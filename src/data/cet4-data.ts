// CET4 Part III Section A - Enhanced Annotated Data
// Source: 201506P3SA.json with additional fields for extensibility and analysis

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

export const cet4Data: CET4Data = {
  metadata: {
    exam_year: 2015,
    exam_month: 6,
    total_sets: 3,
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
  sets: [
    {
      set_id: 1,
      theme: "将社区资源带入课堂",
      question_type: "banked_cloze",
      word_bank: [
        { letter: "A", word: "assets" },
        { letter: "B", word: "attend" },
        { letter: "C", word: "aware" },
        { letter: "D", word: "especially" },
        { letter: "E", word: "excellent" },
        { letter: "F", word: "expensive" },
        { letter: "G", word: "guidelines" },
        { letter: "H", word: "involved" },
        { letter: "I", word: "joining" },
        { letter: "J", word: "naturally" },
        { letter: "K", word: "observe" },
        { letter: "L", word: "origin" },
        { letter: "M", word: "recruited" },
        { letter: "N", word: "up-to-date" },
        { letter: "O", word: "volunteering" },
      ],
      passage: {
        segments: [
          {
            type: "text",
            content:
              "As a teacher, you could bring the community into your classroom in many ways. Your students' parents and grandparents are resources and ",
          },
          {
            type: "blank",
            id: 36,
            position: "inline",
            annotations: {
              correct_answer: "A",
              correct_word: "assets",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "词性判断与并列结构",
                  description: "空格与resources由and连接，需填入复数名词",
                },
                {
                  category: "语义",
                  sub_category: "语义衔接",
                  description: "assets（财富）与resources（资源）为近义并列，共同描述父母的价值",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "词性判断与并列结构", description: "" },
                { category: "语义", sub_category: "语义衔接", description: "" },
              ]),
              frequency: getFrequency("词性判断与并列结构"),
            },
          },
          {
            type: "text",
            content: " for their children. They could be ",
          },
          {
            type: "blank",
            id: 37,
            position: "inline",
            annotations: {
              correct_answer: "E",
              correct_word: "excellent",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "形容词作表语",
                  description: "be动词后需形容词修饰名词teachers",
                },
                {
                  category: "语义",
                  sub_category: "词义搭配",
                  description: "excellent teachers（优秀的老师）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "形容词作表语", description: "" },
                { category: "语义", sub_category: "词义搭配", description: "" },
              ]),
              frequency: getFrequency("形容词作表语"),
            },
          },
          {
            type: "text",
            content:
              " teachers of their own traditions and histories. Immigrant parents could talk about their country of ",
          },
          {
            type: "blank",
            id: 38,
            position: "inline",
            annotations: {
              correct_answer: "L",
              correct_word: "origin",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "固定搭配",
                  description: "country of origin（原籍国）",
                },
                {
                  category: "语法",
                  sub_category: "介词后接名词",
                  description: "介词of后需填入名词",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "固定搭配", description: "" },
                { category: "语法", sub_category: "介词后接名词", description: "" },
              ]),
              frequency: getFrequency("固定搭配"),
            },
          },
          {
            type: "text",
            content:
              " and why they emigrated to the United States. Parents could be invited to talk about their jobs or a community project. Parents, of course, are not the only community resources. Employees at local businesses and staff at community agencies have ",
          },
          {
            type: "blank",
            id: 39,
            position: "inline",
            annotations: {
              correct_answer: "N",
              correct_word: "up-to-date",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "形容词修饰名词",
                  description: "空格位于have和information之间，需形容词",
                },
                {
                  category: "语义",
                  sub_category: "语义逻辑",
                  description: "up-to-date（最新的）符合社区人士分享信息的特点",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "形容词修饰名词", description: "" },
                { category: "语义", sub_category: "语义逻辑", description: "" },
              ]),
              frequency: getFrequency("形容词修饰名词"),
            },
          },
          {
            type: "text",
            content:
              " information to share in classrooms.\n\nField trips provide another opportunity to know the community. Many students do not have the opportunity to ",
          },
          {
            type: "blank",
            id: 40,
            position: "inline",
            annotations: {
              correct_answer: "B",
              correct_word: "attend",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "动词不定式",
                  description: "have the opportunity to do结构，需动词原形",
                },
                {
                  category: "语义",
                  sub_category: "动宾搭配",
                  description: "attend concerts（参加音乐会），与visit museums并列",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "动词不定式", description: "" },
                { category: "语义", sub_category: "动宾搭配", description: "" },
              ]),
              frequency: getFrequency("动词不定式"),
            },
          },
          {
            type: "text",
            content:
              " concerts or visit museums or historical sites except through field trips. Schools should have ",
          },
          {
            type: "blank",
            id: 41,
            position: "inline",
            annotations: {
              correct_answer: "G",
              correct_word: "guidelines",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "名词作宾语",
                  description: "空格位于have之后，需名词",
                },
                {
                  category: "语义",
                  sub_category: "语义场",
                  description: "学校组织活动应有guidelines（指导方针）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "名词作宾语", description: "" },
                { category: "语义", sub_category: "语义场", description: "" },
              ]),
              frequency: getFrequency("名词作宾语"),
            },
          },
          {
            type: "text",
            content:
              " for selecting and conducting field trips. Families must be made ",
          },
          {
            type: "blank",
            id: 42,
            position: "inline",
            annotations: {
              correct_answer: "C",
              correct_word: "aware",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "固定搭配",
                  description: "be made aware of（使……知晓）",
                },
                {
                  category: "语法",
                  sub_category: "形容词+介词结构",
                  description: "aware与of构成固定搭配",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "固定搭配", description: "" },
                { category: "语法", sub_category: "形容词+介词结构", description: "" },
              ]),
              frequency: getFrequency("固定搭配"),
            },
          },
          {
            type: "text",
            content:
              " of field trips and permission must be obtained.\n\nThrough school projects, students can learn to be ",
          },
          {
            type: "blank",
            id: 43,
            position: "inline",
            annotations: {
              correct_answer: "H",
              correct_word: "involved",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "固定搭配",
                  description: "be involved in（参与）",
                },
                {
                  category: "语法",
                  sub_category: "形容词+介词结构",
                  description: "involved与in构成固定搭配",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "固定搭配", description: "" },
                { category: "语法", sub_category: "形容词+介词结构", description: "" },
              ]),
              frequency: getFrequency("固定搭配"),
            },
          },
          {
            type: "text",
            content:
              " in community projects ranging from planting trees to cleaning up parks to assisting elderly people. Students, ",
          },
          {
            type: "blank",
            id: 44,
            position: "inline",
            annotations: {
              correct_answer: "D",
              correct_word: "especially",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "副词作状语",
                  description: "句子主干完整，需副词修饰整个句子或插入语",
                },
                {
                  category: "语义",
                  sub_category: "逻辑关系",
                  description:
                    "especially（尤其）用于引出特例，强调\"年龄较大的学生\"",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "副词作状语", description: "" },
                { category: "语义", sub_category: "逻辑关系", description: "" },
              ]),
              frequency: getFrequency("副词作状语"),
            },
          },
          {
            type: "text",
            content:
              " older ones, might conduct research into a community need that could lead to action by a city council or state government. Some schools require students to provide community service by ",
          },
          {
            type: "blank",
            id: 45,
            position: "inline",
            annotations: {
              correct_answer: "O",
              correct_word: "volunteering",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "介词后接动名词",
                  description: "by后需填入v-ing形式",
                },
                {
                  category: "语义",
                  sub_category: "语义搭配",
                  description:
                    "volunteering in a nursing home（在养老院做志愿者）符合社区服务语境",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "介词后接动名词", description: "" },
                { category: "语义", sub_category: "语义搭配", description: "" },
              ]),
              frequency: getFrequency("介词后接动名词"),
            },
          },
          {
            type: "text",
            content:
              " in a nursing home, child care center or government agency. These projects help students understand their responsibility to the larger community.",
          },
        ],
      },
    },
    {
      set_id: 2,
      theme: "看电视的健康危害",
      question_type: "banked_cloze",
      word_bank: [
        { letter: "A", word: "climbed" },
        { letter: "B", word: "consume" },
        { letter: "C", word: "decade" },
        { letter: "D", word: "determine" },
        { letter: "E", word: "effective" },
        { letter: "F", word: "harmful" },
        { letter: "G", word: "outcomes" },
        { letter: "H", word: "passively" },
        { letter: "I", word: "previously" },
        { letter: "J", word: "resume" },
        { letter: "K", word: "suffered" },
        { letter: "L", word: "surfing" },
        { letter: "M", word: "term" },
        { letter: "N", word: "terminals" },
        { letter: "O", word: "twisting" },
      ],
      passage: {
        segments: [
          {
            type: "text",
            content:
              "In many parts of the world, watching television is the most common leisure activity after work and sleep—the guilty pleasure we love to hate. Americans watch five hours a day; and while we know that spending so many hours sitting ",
          },
          {
            type: "blank",
            id: 26,
            position: "inline",
            annotations: {
              correct_answer: "H",
              correct_word: "passively",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "副词修饰动词",
                  description: "空格修饰sitting，需副词",
                },
                {
                  category: "语义",
                  sub_category: "语义逻辑",
                  description:
                    "passively（被动地）描述久坐的不活跃状态，与健康风险相关",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "副词修饰动词", description: "" },
                { category: "语义", sub_category: "语义逻辑", description: "" },
              ]),
              frequency: getFrequency("副词修饰动词"),
            },
          },
          {
            type: "text",
            content:
              " can lead to obesity and other diseases, researchers have now quantified just how ",
          },
          {
            type: "blank",
            id: 27,
            position: "inline",
            annotations: {
              correct_answer: "F",
              correct_word: "harmful",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "形容词作表语",
                  description: "how + adj.感叹句结构，需形容词",
                },
                {
                  category: "语义",
                  sub_category: "概括性语义",
                  description: "harmful（有害的）概括下文具体的疾病风险",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "形容词作表语", description: "" },
                { category: "语义", sub_category: "概括性语义", description: "" },
              ]),
              frequency: getFrequency("形容词作表语"),
            },
          },
          {
            type: "text",
            content: " it can be.\n\nAnalyzing data from eight large, ",
          },
          {
            type: "blank",
            id: 28,
            position: "inline",
            annotations: {
              correct_answer: "I",
              correct_word: "previously",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "副词修饰分词",
                  description: "空格修饰published，需副词",
                },
                {
                  category: "语义",
                  sub_category: "语义搭配",
                  description: "previously published studies（先前发表的研究）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "副词修饰分词", description: "" },
                { category: "语义", sub_category: "语义搭配", description: "" },
              ]),
              frequency: getFrequency("副词修饰分词"),
            },
          },
          {
            type: "text",
            content:
              " published studies, a Harvard-led team reported in the Journal of the American Medical Association that for every two hours per day spent channel ",
          },
          {
            type: "blank",
            id: 29,
            position: "inline",
            annotations: {
              correct_answer: "L",
              correct_word: "surfing",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "固定搭配",
                  description: "channel surfing（不停换台看电视）",
                },
                {
                  category: "语法",
                  sub_category: "动名词结构",
                  description: "spend time doing结构中需动名词",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "固定搭配", description: "" },
                { category: "语法", sub_category: "动名词结构", description: "" },
              ]),
              frequency: getFrequency("固定搭配"),
            },
          },
          {
            type: "text",
            content:
              ", the risk of developing Type 2 diabetes rose 20% over 8.5 years, the risk of heart disease increased 15% over a ",
          },
          {
            type: "blank",
            id: 30,
            position: "inline",
            annotations: {
              correct_answer: "C",
              correct_word: "decade",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "名词单复数",
                  description: "a后需单数名词",
                },
                {
                  category: "语义",
                  sub_category: "固定表达",
                  description: "over a decade（超过十年），与上下文时间表述并列",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "名词单复数", description: "" },
                { category: "语义", sub_category: "固定表达", description: "" },
              ]),
              frequency: getFrequency("名词单复数"),
            },
          },
          {
            type: "text",
            content: ", and the odds of dying prematurely ",
          },
          {
            type: "blank",
            id: 31,
            position: "inline",
            annotations: {
              correct_answer: "A",
              correct_word: "climbed",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "动词时态与主谓一致",
                  description: "句子缺谓语，上下文为过去时，需动词过去式",
                },
                {
                  category: "语义",
                  sub_category: "近义词辨析",
                  description:
                    "climbed（攀升）与rose、increased同义复现，描述风险上升",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "动词时态与主谓一致", description: "" },
                { category: "语义", sub_category: "近义词辨析", description: "" },
              ]),
              frequency: getFrequency("动词时态与主谓一致"),
            },
          },
          {
            type: "text",
            content: " 13% during the seven years of follow-up. All of these ",
          },
          {
            type: "blank",
            id: 32,
            position: "inline",
            annotations: {
              correct_answer: "G",
              correct_word: "outcomes",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "名词复数",
                  description: "these后需复数名词作主语",
                },
                {
                  category: "语义",
                  sub_category: "研究/报告用语",
                  description:
                    "outcomes（结果）指代上文的研究发现（患病风险等）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "名词复数", description: "" },
                { category: "语义", sub_category: "研究/报告用语", description: "" },
              ]),
              frequency: getFrequency("名词复数"),
            },
          },
          {
            type: "text",
            content:
              " are linked to a lack of physical activity. But television watching might be an especially ",
          },
          {
            type: "blank",
            id: 33,
            position: "inline",
            annotations: {
              correct_answer: "E",
              correct_word: "effective",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "形容词修饰名词",
                  description: "空格修饰way，需形容词",
                },
                {
                  category: "语义",
                  sub_category: "特殊语义（略带贬义）",
                  description:
                    "effective（有效的）在此语境中指电视\"特别有效地\"促成了坏习惯",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "形容词修饰名词", description: "" },
                { category: "语义", sub_category: "特殊语义（略带贬义）", description: "" },
              ]),
              frequency: getFrequency("形容词修饰名词"),
            },
          },
          {
            type: "text",
            content:
              " way of promoting unhealthy habits, compared with other sedentary activities like knitting. For one thing, it's an activity we spend far more time doing. Other studies have found that watching ads for beer and popcorn may make you more likely to ",
          },
          {
            type: "blank",
            id: 34,
            position: "inline",
            annotations: {
              correct_answer: "B",
              correct_word: "consume",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "动词不定式",
                  description: "be likely to do结构，需动词原形",
                },
                {
                  category: "语义",
                  sub_category: "动宾搭配",
                  description: "consume them指消费广告中的啤酒和爆米花",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "动词不定式", description: "" },
                { category: "语义", sub_category: "动宾搭配", description: "" },
              ]),
              frequency: getFrequency("动词不定式"),
            },
          },
          {
            type: "text",
            content:
              " them.\n\nEven so, the authors admit that they didn't compare different sedentary activities to ",
          },
          {
            type: "blank",
            id: 35,
            position: "inline",
            annotations: {
              correct_answer: "D",
              correct_word: "determine",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "动词不定式表目的",
                  description: "to后接动词原形引导目的状语",
                },
                {
                  category: "语义",
                  sub_category: "研究动词",
                  description:
                    "determine whether...（确定是否……），常用于说明研究目的",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "动词不定式表目的", description: "" },
                { category: "语义", sub_category: "研究动词", description: "" },
              ]),
              frequency: getFrequency("动词不定式表目的"),
            },
          },
          {
            type: "text",
            content:
              " whether television watching is linked to a greater risk of diabetes, heart disease or early death compared with, say, reading.",
          },
        ],
      },
    },
    {
      set_id: 3,
      theme: "教育公平倡议",
      question_type: "banked_cloze",
      word_bank: [
        { letter: "A", word: "announcing" },
        { letter: "B", word: "beneficial" },
        { letter: "C", word: "challenges" },
        { letter: "D", word: "commitment" },
        { letter: "E", word: "component" },
        { letter: "F", word: "contests" },
        { letter: "G", word: "critically" },
        { letter: "H", word: "develop" },
        { letter: "I", word: "distributing" },
        { letter: "J", word: "enhance" },
        { letter: "K", word: "entitled" },
        { letter: "L", word: "potential" },
        { letter: "M", word: "properly" },
        { letter: "N", word: "qualified" },
        { letter: "O", word: "retain" },
      ],
      passage: {
        segments: [
          {
            type: "text",
            content:
              "The U.S. Department of Education is making efforts to ensure that all students have equal access to a quality education. Today it is ",
          },
          {
            type: "blank",
            id: 26,
            position: "inline",
            annotations: {
              correct_answer: "A",
              correct_word: "announcing",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "动词时态（现在进行时）",
                  description: "is后需现在分词构成进行时",
                },
                {
                  category: "语义",
                  sub_category: "动宾搭配",
                  description: "announcing the launch（宣布启动）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "动词时态（现在进行时）", description: "" },
                { category: "语义", sub_category: "动宾搭配", description: "" },
              ]),
              frequency: getFrequency("动词时态（现在进行时）"),
            },
          },
          {
            type: "text",
            content:
              " the launch of the Excellent Educators for All Initiative. The initiative will help states and school districts support great educators for the students who need them most.\n\n\"All children are ",
          },
          {
            type: "blank",
            id: 27,
            position: "inline",
            annotations: {
              correct_answer: "K",
              correct_word: "entitled",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "固定搭配",
                  description: "be entitled to（有权享有）",
                },
                {
                  category: "语义",
                  sub_category: "核心语义",
                  description: "阐述教育公平的基本权利",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "固定搭配", description: "" },
                { category: "语义", sub_category: "核心语义", description: "" },
              ]),
              frequency: getFrequency("固定搭配"),
            },
          },
          {
            type: "text",
            content:
              " to a high-quality education regardless of their race, zip code or family income. It is ",
          },
          {
            type: "blank",
            id: 28,
            position: "inline",
            annotations: {
              correct_answer: "G",
              correct_word: "critically",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "副词修饰形容词",
                  description: "空格修饰important，需副词",
                },
                {
                  category: "语义",
                  sub_category: "固定搭配",
                  description: "critically important（至关重要的）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "副词修饰形容词", description: "" },
                { category: "语义", sub_category: "固定搭配", description: "" },
              ]),
              frequency: getFrequency("副词修饰形容词"),
            },
          },
          {
            type: "text",
            content:
              " important that we provide teachers and principals the support they need to help students reach their full ",
          },
          {
            type: "blank",
            id: 29,
            position: "inline",
            annotations: {
              correct_answer: "L",
              correct_word: "potential",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "名词",
                  description: "full后需名词",
                },
                {
                  category: "语义",
                  sub_category: "固定搭配",
                  description: "reach one's full potential（充分发挥潜力）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "名词", description: "" },
                { category: "语义", sub_category: "固定搭配", description: "" },
              ]),
              frequency: getFrequency("名词"),
            },
          },
          {
            type: "text",
            content:
              ",\" U.S. Secretary of Education Arne Duncan said. \"Despite the excellent work and deep ",
          },
          {
            type: "blank",
            id: 30,
            position: "inline",
            annotations: {
              correct_answer: "D",
              correct_word: "commitment",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "名词并列",
                  description: "与work由and连接，作介词宾语，需名词",
                },
                {
                  category: "语义",
                  sub_category: "抽象名词搭配",
                  description: "deep commitment（深厚的奉献精神）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "名词并列", description: "" },
                { category: "语义", sub_category: "抽象名词搭配", description: "" },
              ]),
              frequency: getFrequency("名词并列"),
            },
          },
          {
            type: "text",
            content:
              " of our nation's teachers and principals, students in high-poverty, high-minority schools are unfairly treated across our country. We have to do better. Local leaders and educators will ",
          },
          {
            type: "blank",
            id: 31,
            position: "inline",
            annotations: {
              correct_answer: "H",
              correct_word: "develop",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "动词原形作谓语",
                  description: "will后需动词原形",
                },
                {
                  category: "语义",
                  sub_category: "动宾搭配",
                  description: "develop solutions（制定解决方案）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "动词原形作谓语", description: "" },
                { category: "语义", sub_category: "动宾搭配", description: "" },
              ]),
              frequency: getFrequency("动词原形作谓语"),
            },
          },
          {
            type: "text",
            content:
              " their own creative solutions, but we must work together to ",
          },
          {
            type: "blank",
            id: 32,
            position: "inline",
            annotations: {
              correct_answer: "J",
              correct_word: "enhance",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "动词不定式表目的",
                  description: "to后接动词原形",
                },
                {
                  category: "语义",
                  sub_category: "动宾搭配",
                  description: "enhance focus（加强关注）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "动词不定式表目的", description: "" },
                { category: "语义", sub_category: "动宾搭配", description: "" },
              ]),
              frequency: getFrequency("动词不定式表目的"),
            },
          },
          {
            type: "text",
            content:
              " our focus on how to better recruit, support and ",
          },
          {
            type: "blank",
            id: 33,
            position: "inline",
            annotations: {
              correct_answer: "O",
              correct_word: "retain",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "动词原形并列",
                  description:
                    "与recruit、support由and连接，构成并列动词原形",
                },
                {
                  category: "语义",
                  sub_category: "语义逻辑链",
                  description:
                    "\"招聘、支持、留住\"有效教师，retain（留住）是最终环节",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "动词原形并列", description: "" },
                { category: "语义", sub_category: "语义逻辑链", description: "" },
              ]),
              frequency: getFrequency("动词原形并列"),
            },
          },
          {
            type: "text",
            content:
              " effective teachers and principals for all students, especially the kids who need them most.\"\n\nToday's announcement is another important step forward in improving access to a quality education, a ",
          },
          {
            type: "blank",
            id: 34,
            position: "inline",
            annotations: {
              correct_answer: "E",
              correct_word: "component",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "名词单复数",
                  description: "a后需单数名词",
                },
                {
                  category: "语义",
                  sub_category: "固定搭配",
                  description: "a component of（是……的组成部分）",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "名词单复数", description: "" },
                { category: "语义", sub_category: "固定搭配", description: "" },
              ]),
              frequency: getFrequency("名词单复数"),
            },
          },
          {
            type: "text",
            content:
              " of President Obama's year of action. Later today, Secretary Duncan will lead a roundtable discussion with principals and school teachers from across the country about the ",
          },
          {
            type: "blank",
            id: 35,
            position: "inline",
            annotations: {
              correct_answer: "C",
              correct_word: "challenges",
              knowledge_points: [
                {
                  category: "语法",
                  sub_category: "名词",
                  description: "the后需名词",
                },
                {
                  category: "语义",
                  sub_category: "上下文语义",
                  description:
                    "讨论在高需求学校工作的challenges（挑战）及如何应对，与后文promising practices形成呼应",
                },
              ],
              difficulty: calculateDifficulty([
                { category: "语法", sub_category: "名词", description: "" },
                { category: "语义", sub_category: "上下文语义", description: "" },
              ]),
              frequency: getFrequency("名词"),
            },
          },
          {
            type: "text",
            content:
              " of working in high-need schools and how to adopt promising practices for supporting great educators in these schools.",
          },
        ],
      },
    },
  ],
};

// Helper functions for data analysis

export function getAllBlanks(): Array<{
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

  for (const set of cet4Data.sets) {
    const segments = set.passage.segments;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.type === "blank") {
        // Get surrounding context
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

export function getFullPassage(setId: number): string {
  const set = cet4Data.sets.find((s) => s.set_id === setId);
  if (!set) return "";
  return set.passage.segments
    .map((seg) => {
      if (seg.type === "text") return seg.content;
      return `___(${seg.id})___`;
    })
    .join("");
}

export function getSubCategories(category?: Category): string[] {
  const subCats = new Set<string>();
  for (const set of cet4Data.sets) {
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
  category: Category
): Array<{ name: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const set of cet4Data.sets) {
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

export function getWordPartOfSpeechDistribution(): Array<{
  name: string;
  value: number;
}> {
  const posMap: Record<string, string> = {
    // 动词
    attend: "动词",
    observe: "动词",
    consume: "动词",
    determine: "动词",
    develop: "动词",
    enhance: "动词",
    retain: "动词",
    climbed: "动词",
    // 名词
    assets: "名词",
    guidelines: "名词",
    origin: "名词",
    decade: "名词",
    outcomes: "名词",
    commitment: "名词",
    component: "名词",
    challenges: "名词",
    potential: "名词",
    term: "名词",
    contests: "名词",
    terminals: "名词",
    // 形容词
    aware: "形容词",
    excellent: "形容词",
    expensive: "形容词",
    involved: "形容词",
    up_to_date: "形容词",
    harmful: "形容词",
    effective: "形容词",
    beneficial: "形容词",
    entitled: "形容词",
    qualified: "形容词",
    // 副词
    especially: "副词",
    naturally: "副词",
    passively: "副词",
    previously: "副词",
    critically: "副词",
    properly: "副词",
    // 动名词/分词
    joining: "动名词",
    recruited: "分词",
    volunteering: "动名词",
    surfing: "动名词",
    announcing: "动名词",
    distributing: "动名词",
    suffered: "分词",
    twisting: "动名词",
    resume: "动词",
  };

  const counts: Record<string, number> = { "动词": 0, "名词": 0, "形容词": 0, "副词": 0, "动名词": 0, "分词": 0 };

  for (const set of cet4Data.sets) {
    for (const seg of set.passage.segments) {
      if (seg.type === "blank") {
        const word = seg.annotations.correct_word;
        const pos = posMap[word] || "名词";
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

  for (const set of cet4Data.sets) {
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

  for (const set of cet4Data.sets) {
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

export function getRelatedWords(word: string): string[] {
  // Find all sub_categories for this word
  const subCats = new Set<string>();
  for (const set of cet4Data.sets) {
    for (const seg of set.passage.segments) {
      if (seg.type === "blank" && seg.annotations.correct_word.toLowerCase() === word.toLowerCase()) {
        for (const kp of seg.annotations.knowledge_points) {
          subCats.add(kp.sub_category);
        }
      }
    }
  }

  // Find words that share the same sub_categories
  const relatedWords = new Set<string>();
  for (const set of cet4Data.sets) {
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

export function getAllWords(): Array<{ word: string; letter: string; setId: number }> {
  const results: Array<{ word: string; letter: string; setId: number }> = [];
  for (const set of cet4Data.sets) {
    for (const item of set.word_bank) {
      results.push({ word: item.word, letter: item.letter, setId: set.set_id });
    }
  }
  return results;
}

// Classify word part of speech based on its grammar sub_categories
export function getWordPartOfSpeech(word: string): string {
  const allBlanks = getAllBlanks();
  const blank = allBlanks.find(b => b.annotations.correct_word.toLowerCase() === word.toLowerCase());
  if (!blank) return "未知";
  const grammarKps = blank.annotations.knowledge_points.filter(kp => kp.category === "语法");
  if (grammarKps.length === 0) return "未知";
  const subCats = grammarKps.map(kp => kp.sub_category);
  if (subCats.some(s => s.includes("动名词") || s.includes("动名词结构"))) return "动名词";
  if (subCats.some(s => s.includes("分词"))) return "分词";
  if (subCats.some(s => s.includes("副词"))) return "副词";
  if (subCats.some(s => s.includes("形容词"))) return "形容词";
  if (subCats.some(s => s.includes("动词"))) return "动词";
  if (subCats.some(s => s.includes("名词"))) return "名词";
  return "未知";
}

// Get word frequency count (how many times it appears as correct answer across all sets)
export function getWordFrequencyCount(word: string): number {
  const allBlanks = getAllBlanks();
  return allBlanks.filter(b => b.annotations.correct_word.toLowerCase() === word.toLowerCase()).length;
}
