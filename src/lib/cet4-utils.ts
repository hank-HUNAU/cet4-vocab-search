// CET4 Utility Functions - Parameterized versions that accept CET4Data as input
// These mirror the functions in @/data/cet4-data.ts but accept data as a parameter
// so they can work with dynamically loaded data

import type {
  Category,
  Frequency,
  CET4Data,
  BlankAnnotation,
  KnowledgePoint,
  QuestionTypeRegistry,
} from "@/data/cet4-data";

// ─── Sub-category frequency mapping ─────────────────────────────────

const subCategoryFrequency: Record<string, Frequency> = {
  // 语法 sub-categories
  "固定搭配": "高频",
  "动词不定式": "高频",
  "形容词修饰名词": "高频",
  "名词单复数": "中频",
  "形容词作表语": "中频",
  "副词修饰动词": "中频",
  "动词时态与主谓一致": "中频",
  "介词后接名词": "中频",
  "介词后接动名词": "中频",
  "词性判断与并列结构": "低频",
  "名词作宾语": "低频",
  "形容词+介词结构": "低频",
  "副词作状语": "低频",
  "动名词结构": "低频",
  "名词复数": "低频",
  "动词不定式表目的": "中频",
  "动词时态（现在进行时）": "低频",
  "副词修饰形容词": "中频",
  "名词": "中频",
  "名词并列": "低频",
  "动词原形作谓语": "中频",
  "动词原形并列": "低频",
  "副词修饰分词": "低频",
  // 语义 sub-categories
  "动宾搭配": "高频",
  "语义逻辑": "高频",
  "语义搭配": "中频",
  "语义衔接": "中频",
  "固定表达": "中频",
  "近义词辨析": "低频",
  "词义搭配": "低频",
  "语义场": "低频",
  "逻辑关系": "低频",
  "研究/报告用语": "低频",
  "特殊语义（略带贬义）": "低频",
  "概括性语义": "低频",
  "核心语义": "低频",
  "上下文语义": "低频",
  "抽象名词搭配": "低频",
  "语义逻辑链": "低频",
  "研究动词": "低频",
};

// ─── Difficulty calculation ─────────────────────────────────────────

export function calculateDifficulty(knowledgePoints: KnowledgePoint[]): number {
  let score = 0;
  for (const kp of knowledgePoints) {
    if (kp.category === "语法") {
      score += 1;
    } else {
      score += 1.5;
    }
    const complexSubCategories = [
      "词性判断与并列结构", "近义词辨析", "语义逻辑链",
      "动词时态与主谓一致", "特殊语义（略带贬义）"
    ];
    const mediumSubCategories = [
      "固定搭配", "形容词+介词结构", "动名词结构",
      "语义逻辑", "概括性语义", "研究/报告用语"
    ];
    if (complexSubCategories.includes(kp.sub_category)) {
      score += 1;
    } else if (mediumSubCategories.includes(kp.sub_category)) {
      score += 0.5;
    }
  }
  if (score <= 2) return 1;
  if (score <= 3) return 2;
  if (score <= 4) return 3;
  if (score <= 5.5) return 4;
  return 5;
}

export function getFrequency(subCategory: string): Frequency {
  return subCategoryFrequency[subCategory] || "低频";
}

// ─── Default metadata and question_types ────────────────────────────

const DEFAULT_QUESTION_TYPES: QuestionTypeRegistry[] = [
  {
    id: "banked_cloze",
    label: "词汇匹配（选词填空）",
    description: "从15个词中选出10个填入文章空白处，考查词汇语法综合运用能力",
  },
  {
    id: "reading_comprehension",
    label: "阅读理解",
    description: "阅读文章并回答问题，考查阅读理解能力",
  },
  {
    id: "listening",
    label: "听力理解",
    description: "听取录音并回答问题，考查听力理解能力",
  },
  {
    id: "translation",
    label: "段落翻译",
    description: "将中文段落翻译为英文，考查翻译能力",
  },
  {
    id: "writing",
    label: "写作",
    description: "根据提示写一篇短文，考查写作能力",
  },
];

// ─── Normalize uploaded data to CET4Data format ──────────────────────
// Handles multiple JSON formats and ensures all required fields exist

export function normalizeToCET4Data(raw: unknown): CET4Data {
  const obj = (typeof raw === "object" && raw !== null) ? raw as Record<string, unknown> : {};

  // Ensure metadata exists
  const existingMeta = (obj.metadata && typeof obj.metadata === "object")
    ? obj.metadata as Record<string, unknown>
    : {};
  const metadata = {
    exam_year: (existingMeta.exam_year ?? obj.exam_year ?? 0) as number,
    exam_month: (existingMeta.exam_month ?? obj.exam_month ?? 0) as number,
    total_sets: (existingMeta.total_sets ?? obj.total_sets ?? 0) as number,
    annotation_version: (existingMeta.annotation_version ?? obj.annotation_version ?? "2.0") as string,
  };
  // Fix total_sets if zero but sets exist
  if (metadata.total_sets === 0 && Array.isArray(obj.sets)) {
    metadata.total_sets = (obj.sets as unknown[]).length;
  }

  // Ensure question_types exists
  const question_types: QuestionTypeRegistry[] =
    (Array.isArray(obj.question_types) && (obj.question_types as unknown[]).length > 0)
      ? obj.question_types as QuestionTypeRegistry[]
      : DEFAULT_QUESTION_TYPES;

  // Ensure sets exists
  let sets;
  if (Array.isArray(obj.sets) && obj.sets.length > 0) {
    sets = obj.sets as CET4Data["sets"];
  } else if (obj.word_bank && obj.passage) {
    // Format 2: Single set - wrap into CET4Data format
    sets = [{
      set_id: 1,
      theme: (obj as Record<string, unknown>).theme as string || "未命名套题",
      question_type: "banked_cloze" as const,
      word_bank: obj.word_bank as CET4Data["sets"][0]["word_bank"],
      passage: obj.passage as CET4Data["sets"][0]["passage"],
    }];
  } else {
    sets = [];
  }

  return { metadata, question_types, sets };
}

// ─── Enrich CET4Data: add missing difficulty/frequency fields ────────

export function enrichCET4Data(data: CET4Data): CET4Data {
  return {
    ...data,
    sets: data.sets.map((set) => ({
      ...set,
      passage: {
        segments: set.passage.segments.map((seg) => {
          if (seg.type === "blank") {
            const ann = seg.annotations;
            const difficulty =
              ann.difficulty ?? calculateDifficulty(ann.knowledge_points);
            const frequency =
              ann.frequency ??
              getFrequency(
                ann.knowledge_points[0]?.sub_category ?? ""
              );
            return {
              ...seg,
              annotations: {
                ...ann,
                difficulty,
                frequency,
              },
            };
          }
          return seg;
        }),
      },
    })),
  };
}

// ─── Parameterized data processing functions ────────────────────────

export function getAllBlanks(data: CET4Data): Array<{
  setId: number;
  theme: string;
  blankId: number;
  annotations: BlankAnnotation;
  context: string;
}> {
  const results: Array<{
    setId: number;
    theme: string;
    blankId: number;
    annotations: BlankAnnotation;
    context: string;
  }> = [];

  for (const set of data.sets) {
    const segments = set.passage.segments;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.type === "blank") {
        const before = i > 0 && segments[i - 1].type === "text" ? segments[i - 1].content : "";
        const after = i < segments.length - 1 && segments[i + 1].type === "text" ? segments[i + 1].content : "";
        const context = `${before}___(${seg.id})___${after}`;
        results.push({
          setId: set.set_id,
          theme: set.theme,
          blankId: seg.id,
          annotations: seg.annotations,
          context,
        });
      }
    }
  }

  return results;
}

export function getSubCategories(
  data: CET4Data,
  category?: Category
): string[] {
  const subCats = new Set<string>();
  for (const set of data.sets) {
    for (const seg of set.passage.segments) {
      if (seg.type === "blank") {
        for (const kp of seg.annotations.knowledge_points) {
          if (!category || kp.category === category) {
            subCats.add(kp.sub_category);
          }
        }
      }
    }
  }
  return Array.from(subCats).sort();
}

export function getSubCategoryDistribution(
  data: CET4Data,
  category: Category
): Array<{ name: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const set of data.sets) {
    for (const seg of set.passage.segments) {
      if (seg.type === "blank") {
        for (const kp of seg.annotations.knowledge_points) {
          if (kp.category === category) {
            counts[kp.sub_category] = (counts[kp.sub_category] || 0) + 1;
          }
        }
      }
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// Word POS classification using grammar sub-categories (works for any data)
export function getWordPartOfSpeechFromGrammar(word: string, data: CET4Data): string {
  const blanks = getAllBlanks(data);
  const blank = blanks.find((b) => b.annotations.correct_word.toLowerCase() === word.toLowerCase());
  if (!blank) return "未知";
  const grammarKps = blank.annotations.knowledge_points.filter((kp) => kp.category === "语法");
  if (grammarKps.length === 0) return "未知";
  const subCats = grammarKps.map((kp) => kp.sub_category);
  if (subCats.some((s) => s.includes("动名词") || s.includes("动名词结构"))) return "动名词";
  if (subCats.some((s) => s.includes("分词"))) return "分词";
  if (subCats.some((s) => s.includes("副词"))) return "副词";
  if (subCats.some((s) => s.includes("形容词"))) return "形容词";
  if (subCats.some((s) => s.includes("动词"))) return "动词";
  if (subCats.some((s) => s.includes("名词"))) return "名词";
  return "未知";
}

export function getWordPartOfSpeechDistribution(data: CET4Data): Array<{
  name: string;
  value: number;
}> {
  // Use grammar-based classification for dynamic data
  const counts: Record<string, number> = {
    动词: 0,
    名词: 0,
    形容词: 0,
    副词: 0,
    动名词: 0,
    分词: 0,
  };

  for (const set of data.sets) {
    for (const seg of set.passage.segments) {
      if (seg.type === "blank") {
        const word = seg.annotations.correct_word;
        const pos = getWordPartOfSpeechFromGrammar(word, data);
        if (counts[pos] !== undefined) {
          counts[pos]++;
        } else {
          counts[pos] = 1;
        }
      }
    }
  }

  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function searchFullText(
  data: CET4Data,
  query: string
): Array<{
  setId: number;
  theme: string;
  blankId: number | null;
  segmentIndex: number;
  content: string;
  matchIndex: number;
}> {
  const results: Array<{
    setId: number;
    theme: string;
    blankId: number | null;
    segmentIndex: number;
    content: string;
    matchIndex: number;
  }> = [];

  if (!query.trim()) return results;

  const lowerQuery = query.toLowerCase();

  for (const set of data.sets) {
    const segments = set.passage.segments;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const textContent =
        seg.type === "text"
          ? seg.content
          : seg.annotations.correct_word;
      const lowerContent = textContent.toLowerCase();
      const idx = lowerContent.indexOf(lowerQuery);
      if (idx !== -1) {
        results.push({
          setId: set.set_id,
          theme: set.theme,
          blankId: seg.type === "blank" ? seg.id : null,
          segmentIndex: i,
          content: textContent,
          matchIndex: idx,
        });
      }
    }
  }

  return results;
}

export function getWordAssociations(
  data: CET4Data,
  word: string
): Array<{
  setId: number;
  theme: string;
  blankId: number;
  annotations: BlankAnnotation;
}> {
  const results: Array<{
    setId: number;
    theme: string;
    blankId: number;
    annotations: BlankAnnotation;
  }> = [];

  for (const set of data.sets) {
    for (const seg of set.passage.segments) {
      if (seg.type === "blank" && seg.annotations.correct_word.toLowerCase() === word.toLowerCase()) {
        results.push({
          setId: set.set_id,
          theme: set.theme,
          blankId: seg.id,
          annotations: seg.annotations,
        });
      }
    }
  }

  return results;
}

export function getRelatedWords(data: CET4Data, word: string): string[] {
  const subCats = new Set<string>();
  for (const set of data.sets) {
    for (const seg of set.passage.segments) {
      if (seg.type === "blank" && seg.annotations.correct_word.toLowerCase() === word.toLowerCase()) {
        for (const kp of seg.annotations.knowledge_points) {
          subCats.add(kp.sub_category);
        }
      }
    }
  }

  const relatedWords = new Set<string>();
  for (const set of data.sets) {
    for (const seg of set.passage.segments) {
      if (seg.type === "blank") {
        for (const kp of seg.annotations.knowledge_points) {
          if (subCats.has(kp.sub_category) && seg.annotations.correct_word.toLowerCase() !== word.toLowerCase()) {
            relatedWords.add(seg.annotations.correct_word);
          }
        }
      }
    }
  }

  return Array.from(relatedWords);
}

export function getAllWords(
  data: CET4Data
): Array<{ word: string; letter: string; setId: number }> {
  const results: Array<{ word: string; letter: string; setId: number }> = [];
  for (const set of data.sets) {
    for (const item of set.word_bank) {
      results.push({ word: item.word, letter: item.letter, setId: set.set_id });
    }
  }
  return results;
}
