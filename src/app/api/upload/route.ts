import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "未提供文件" }, { status: 400 });
    }

    const fileContent = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      return NextResponse.json({ success: false, error: "JSON格式无效" }, { status: 400 });
    }

    // Extract metadata
    const metadata = parsed.metadata || {};
    const examYear = metadata.exam_year || parsed.exam_year || null;
    const examMonth = metadata.exam_month || parsed.exam_month || null;
    const totalSets = (parsed.sets || []).length;

    const datasetName = name || file.name.replace(/\.json$/i, "");

    // Check for duplicate name
    const existing = await db.dataset.findFirst({ where: { name: datasetName } });
    if (existing) {
      return NextResponse.json({ success: false, error: `数据集"${datasetName}"已存在` }, { status: 409 });
    }

    const dataset = await db.dataset.create({
      data: {
        name: datasetName,
        fileName: file.name,
        fileType: "json",
        fileSize: file.size,
        data: fileContent,
        examYear: examYear ? Number(examYear) : null,
        examMonth: examMonth ? Number(examMonth) : null,
        totalSets,
        description: description || null,
        tags: tags || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: dataset.id, name: dataset.name },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: "上传失败" }, { status: 500 });
  }
}
