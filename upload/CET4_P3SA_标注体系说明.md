# 大学英语四级 Part III Section A · 标注体系说明

> 文件：`201506P3SA.json` | 版本：v1.0 | 日期：2026-04-29

---

## 一、数据结构层次（4层）

```
根对象
├── metadata          ← 考试元数据（年份/月份/套数/版本号）
└── sets[]            ← 三套题数组
    ├── set_id        ← 套题编号（1/2/3）
    ├── theme         ← 文章主题（中文概括）
    ├── word_bank[]   ← 词库（letter + word，共15项）
    └── passage
        └── segments[]  ← 文章分段序列（交替排列）
            ├── { type: "text",  content: "..." }       ← 原文文本片段
            └── { type: "blank", id: N, annotations }   ← 空格 + 知识点
```

---

## 二、标注核心字段

每个 `blank` 节点的 `annotations` 包含：

| 字段 | 说明 |
|------|------|
| `correct_answer` | 正确选项字母（如 `"A"`） |
| `correct_word` | 正确单词（如 `"assets"`） |
| `knowledge_points[]` | 知识点数组，每条含 3 个字段 |

`knowledge_points` 每条结构：

| 字段 | 取值 |
|------|------|
| `category` | `"语法"` 或 `"语义"` |
| `sub_category` | 具体分类（如 `"固定搭配"`、`"动宾搭配"`） |
| `description` | 针对该空的具体解释 |

---

## 三、去噪处理

### ✅ 已完全去除的噪音

- 题目指令语（`"Directions: In this section, a passage…"`）
- 重复标题段落
- 套题编号分隔符

### ✅ 保留的完整内容

- 原文每一句（通过 `text` + `blank` 交替还原完整段落）
- 段落换行（`\n\n` 嵌入在 `text.content` 中）

---

## 四、当前标注统计

| 套题 | 题号范围 | 空格数 | 知识点条数（约） |
|------|---------|--------|----------------|
| Set 1 | 36–45 | 10 | 20 |
| Set 2 | 26–35 | 10 | 20 |
| Set 3 | 26–35 | 10 | 20 |
| **合计** | — | **30** | **~60** |

---

## 五、可扩展的字段（建议）

下一步可直接在现有结构上追加，**不破坏兼容性**：

```json
"annotations": {
  "correct_answer": "A",
  "correct_word": "assets",
  "difficulty": 2,           // 难度 1–5
  "frequency": "高频",        // 考试出现频率
  "distractors": ["B", "C"], // 常见错误选项
  "knowledge_points": [...]
}
```

---

## 六、完整 JSON 骨架示例

```json
{
  "metadata": {
    "exam_year": 2015,
    "exam_month": 6,
    "total_sets": 3,
    "annotation_version": "1.0"
  },
  "sets": [
    {
      "set_id": 1,
      "theme": "将社区资源带入课堂",
      "word_bank": [
        { "letter": "A", "word": "assets" },
        { "letter": "B", "word": "attend" }
      ],
      "passage": {
        "segments": [
          { "type": "text", "content": "As a teacher, you could bring..." },
          {
            "type": "blank",
            "id": 36,
            "position": "inline",
            "annotations": {
              "correct_answer": "A",
              "correct_word": "assets",
              "knowledge_points": [
                {
                  "category": "语法",
                  "sub_category": "词性判断与并列结构",
                  "description": "空格与 resources 由 and 连接，需填入复数名词"
                },
                {
                  "category": "语义",
                  "sub_category": "语义衔接",
                  "description": "assets（财富）与 resources（资源）近义并列"
                }
              ]
            }
          },
          { "type": "text", "content": " for their children..." }
        ]
      }
    }
  ]
}
```

---

> **用途说明**：JSON 文件已完整，可直接用于前端词汇学习系统的题目加载与知识点检索。  
> *由 WorkBuddy 自动生成 | 标注来源：201506P3SA.json*
