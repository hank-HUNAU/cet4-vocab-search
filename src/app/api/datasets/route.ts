import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── Dataset CRUD API ────────────────────────────────────────────

// GET /api/datasets - List all datasets (without full data payload)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const withData = searchParams.get("withData") === "true";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // Get single dataset by ID
    if (id) {
      const dataset = await db.dataset.findUnique({ where: { id } });
      if (!dataset) {
        return NextResponse.json(
          { success: false, error: "数据集不存在" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: withData ? dataset : sanitizeDataset(dataset),
      });
    }

    // List datasets with optional search
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { fileName: { contains: search } },
            { description: { contains: search } },
            { tags: { contains: search } },
          ],
        }
      : {};

    const [datasets, total] = await Promise.all([
      db.dataset.findMany({
        where,
        select: withData
          ? undefined
          : {
              id: true,
              name: true,
              fileName: true,
              fileType: true,
              fileSize: true,
              examYear: true,
              examMonth: true,
              totalSets: true,
              description: true,
              tags: true,
              createdAt: true,
              updatedAt: true,
            },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.dataset.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: datasets,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Dataset query error:", error);
    return NextResponse.json(
      { success: false, error: "查询数据集失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/datasets?id=xxx - Delete a dataset
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少数据集ID参数" },
        { status: 400 }
      );
    }

    const existing = await db.dataset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "数据集不存在" },
        { status: 404 }
      );
    }

    await db.dataset.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `数据集"${existing.name}"已删除`,
    });
  } catch (error) {
    console.error("Dataset delete error:", error);
    return NextResponse.json(
      { success: false, error: "删除数据集失败" },
      { status: 500 }
    );
  }
}

// PUT /api/datasets - Update dataset metadata
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, tags } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少数据集ID参数" },
        { status: 400 }
      );
    }

    const existing = await db.dataset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "数据集不存在" },
        { status: 404 }
      );
    }

    // Check name uniqueness if changing name
    if (name && name !== existing.name) {
      const dup = await db.dataset.findFirst({ where: { name } });
      if (dup) {
        return NextResponse.json(
          { success: false, error: "数据集名称已存在" },
          { status: 409 }
        );
      }
    }

    const updated = await db.dataset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
      },
    });

    return NextResponse.json({
      success: true,
      data: sanitizeDataset(updated),
    });
  } catch (error) {
    console.error("Dataset update error:", error);
    return NextResponse.json(
      { success: false, error: "更新数据集失败" },
      { status: 500 }
    );
  }
}

// Helper: remove data field for list views
function sanitizeDataset(dataset: Record<string, unknown>) {
  const { data: _, ...rest } = dataset;
  return rest;
}
