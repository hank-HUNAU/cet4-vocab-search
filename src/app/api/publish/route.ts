import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { normalizeToCET4Data } from "@/lib/cet4-utils";
import type { CET4Data } from "@/data/cet4-data";

export async function POST() {
  try {
    // Get all datasets
    const datasets = await db.dataset.findMany({ orderBy: { createdAt: "asc" } });
    if (datasets.length === 0) {
      return NextResponse.json({ success: false, error: "没有数据集可发布" }, { status: 400 });
    }

    // Merge all datasets
    const allSets: CET4Data["sets"] = [];
    let globalId = 0;
    for (const ds of datasets) {
      try {
        const rawParsed = JSON.parse(ds.data as string);
        const normalized = normalizeToCET4Data(rawParsed);
        for (const set of normalized.sets ?? []) {
          globalId++;
          allSets.push({ ...set, set_id: globalId });
        }
      } catch (e) {
        console.error(`Failed to parse dataset ${ds.id}:`, e);
      }
    }

    const mergedData: CET4Data = {
      metadata: {
        exam_year: 0,
        exam_month: 0,
        total_sets: allSets.length,
        annotation_version: "2.0",
      },
      question_types: [
        { id: "banked_cloze", label: "词汇匹配（选词填空）", description: "从15个词中选出10个填入文章空白处" },
      ],
      sets: allSets,
    };

    // Write to public/data/sample.json
    const outputPath = "public/data/sample.json";
    writeFileSync(outputPath, JSON.stringify(mergedData, null, 2), "utf-8");

    // Git commit and push
    try {
      execSync("git add public/data/sample.json", { cwd: "/home/z/my-project" });
      execSync('git commit -m "chore: update sample data for GitHub Pages"', { cwd: "/home/z/my-project" });
      execSync("git push origin main", { cwd: "/home/z/my-project", timeout: 30000 });
    } catch (gitError: unknown) {
      // If "nothing to commit", that's OK
      const message = gitError instanceof Error ? gitError.message : String(gitError);
      if (!message?.includes("nothing to commit")) {
        throw gitError;
      }
    }

    return NextResponse.json({ success: true, message: `已发布 ${allSets.length} 套题目到 GitHub Pages` });
  } catch (error: unknown) {
    console.error("Publish error:", error);
    const message = error instanceof Error ? error.message : "发布失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
