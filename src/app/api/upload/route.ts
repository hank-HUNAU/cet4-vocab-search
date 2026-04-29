import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── JSON Upload API ─────────────────────────────────────────────
// POST /api/upload
// Accepts multipart form data with a JSON file and optional metadata
// Validates the JSON structure and stores it in the database

interface UploadMetadata {
  name?: string;
  description?: string;
  tags?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || null;
    const description = (formData.get("description") as string) || null;
    const tags = (formData.get("tags") as string) || null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "未提供文件，请选择一个JSON文件上传" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      return NextResponse.json(
        { success: false, error: "仅支持JSON文件上传，请选择.json格式的文件" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "文件大小超过10MB限制，请压缩后重试" },
        { status: 400 }
      );
    }

    // Read and parse JSON content
    const fileContent = await file.text();
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(fileContent);
    } catch {
      return NextResponse.json(
        { success: false, error: "JSON解析失败，请检查文件内容是否为有效的JSON格式" },
        { status: 400 }
      );
    }

    // Validate JSON structure - support multiple formats
    const validationResult = validateJsonStructure(parsedData);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: `数据结构验证失败：${validationResult.error}` },
        { status: 400 }
      );
    }

    // Extract metadata from the JSON data if available
    const examYear = extractField(parsedData, "exam_year") as number | null;
    const examMonth = extractField(parsedData, "exam_month") as number | null;
    const totalSets = extractTotalSets(parsedData);

    // Generate dataset name
    const datasetName =
      name ||
      generateDatasetName(file.name, examYear, examMonth);

    // Check for duplicate name
    const existing = await db.dataset.findFirst({
      where: { name: datasetName },
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `数据集名称"${datasetName}"已存在，请更换名称或先删除已有数据集`,
          existingId: existing.id,
        },
        { status: 409 }
      );
    }

    // Store in database
    const dataset = await db.dataset.create({
      data: {
        name: datasetName,
        fileName: file.name,
        fileType: "json",
        fileSize: file.size,
        data: fileContent,
        examYear,
        examMonth,
        totalSets,
        description,
        tags,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: dataset.id,
        name: dataset.name,
        fileName: dataset.fileName,
        fileSize: dataset.fileSize,
        examYear: dataset.examYear,
        examMonth: dataset.examMonth,
        totalSets: dataset.totalSets,
        description: dataset.description,
        tags: dataset.tags,
        createdAt: dataset.createdAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误，上传处理失败" },
      { status: 500 }
    );
  }
}

// ─── Validation Helpers ───────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateJsonStructure(data: unknown): ValidationResult {
  if (typeof data !== "object" || data === null) {
    return { valid: false, error: "JSON根元素必须为对象" };
  }

  const obj = data as Record<string, unknown>;

  // Format 1: CET4Data format (with metadata, sets, question_types)
  if (obj.sets && Array.isArray(obj.sets)) {
    // Validate sets structure
    for (let i = 0; i < obj.sets.length; i++) {
      const set = obj.sets[i] as Record<string, unknown>;
      if (!set.set_id || !set.passage) {
        return {
          valid: false,
          error: `第${i + 1}套题缺少set_id或passage字段`,
        };
      }
    }
    return { valid: true };
  }

  // Format 2: Single set format (with word_bank, passage)
  if (obj.word_bank && obj.passage) {
    return { valid: true };
  }

  // Format 3: Simple array of segments
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return { valid: false, error: "JSON数组不能为空" };
    }
    return { valid: true };
  }

  // Format 4: Generic object (accept but warn)
  if (Object.keys(obj).length > 0) {
    return { valid: true };
  }

  return { valid: false, error: "无法识别的数据结构，请确保JSON包含有效的CET4标注数据" };
}

function extractField(data: unknown, field: string): unknown {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    // Check top-level
    if (obj[field] !== undefined) return obj[field];
    // Check metadata sub-object
    if (obj.metadata && typeof obj.metadata === "object") {
      const meta = obj.metadata as Record<string, unknown>;
      if (meta[field] !== undefined) return meta[field];
    }
  }
  return null;
}

function extractTotalSets(data: unknown): number | null {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.total_sets !== undefined) return obj.total_sets as number;
    if (obj.metadata && typeof obj.metadata === "object") {
      const meta = obj.metadata as Record<string, unknown>;
      if (meta.total_sets !== undefined) return meta.total_sets as number;
    }
    if (Array.isArray(obj.sets)) return obj.sets.length;
  }
  return null;
}

function generateDatasetName(
  fileName: string,
  year: number | null,
  month: number | null
): string {
  // Try to derive a meaningful name from file name and metadata
  const baseName = fileName.replace(/\.json$/i, "");
  if (year && month) {
    return `CET4_${year}${String(month).padStart(2, "0")}_${baseName}`;
  }
  return baseName;
}
