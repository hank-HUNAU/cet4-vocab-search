// CET4 Part III Section A - Enhanced Annotated Data
// Built-in data has been removed. Data is loaded from uploaded datasets via the UI.

export type Category = "语法" | "语义";
export type Frequency = "高频" | "中频" | "低频";
export type QuestionType = "banked_cloze" | "reading_comprehension" | "listening" | "translation" | "writing";

export interface KnowledgePoint {
  category: Category;
  sub_category: string;
  description: string;
}

export interface BlankAnnotation {
  correct_answer: string;
  correct_word: string;
  knowledge_points: KnowledgePoint[];
  difficulty: number; // 1-5
  frequency: Frequency;
}

export interface BlankSegment {
  type: "blank";
  id: number;
  position: string;
  annotations: BlankAnnotation;
}

export interface TextSegment {
  type: "text";
  content: string;
}

export type PassageSegment = TextSegment | BlankSegment;

export interface WordBankItem {
  letter: string;
  word: string;
}

export interface ExamSet {
  set_id: number;
  theme: string;
  question_type: QuestionType;
  word_bank: WordBankItem[];
  passage: {
    segments: PassageSegment[];
  };
}

export interface QuestionTypeRegistry {
  id: QuestionType;
  label: string;
  description: string;
}

export interface ExamMetadata {
  exam_year: number;
  exam_month: number;
  total_sets: number;
  annotation_version: string;
}

export interface CET4Data {
  metadata: ExamMetadata;
  question_types: QuestionTypeRegistry[];
  sets: ExamSet[];
}

// Sub-category frequency mapping based on occurrence counts across all sets
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

// Difficulty calculation based on knowledge point complexity
function calculateDifficulty(knowledgePoints: KnowledgePoint[]): number {
  let score = 0;
  for (const kp of knowledgePoints) {
    // Base score by category
    if (kp.category === "语法") {
      score += 1;
    } else {
      score += 1.5; // Semantic points tend to be harder
    }
    // Adjust for sub-category complexity
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
  // Convert to 1-5 scale
  if (score <= 2) return 1;
  if (score <= 3) return 2;
  if (score <= 4) return 3;
  if (score <= 5.5) return 4;
  return 5;
}

function getFrequency(subCategory: string): Frequency {
  return subCategoryFrequency[subCategory] || "低频";
}

// Built-in data is empty - data comes from uploaded datasets
export const cet4Data: CET4Data = {
  metadata: {
    exam_year: 0,
    exam_month: 0,
    total_sets: 0,
    annotation_version: "2.0",
  },
  question_types: [
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
  ],
  sets: [],
};
