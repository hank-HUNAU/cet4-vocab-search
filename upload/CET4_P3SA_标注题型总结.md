# 大学英语四级 Part III Section A 词汇匹配 · 标注题型总结

> 基于：`201506P3SA.json`（2015年6月真题，3套，共30空）  
> 标注版本：v1.0 | 更新日期：2026-04-29  
> 作者：Hank

---

## 一、标注体系说明

### 1.1 数据结构

```
{
  metadata: { exam_year, exam_month, total_sets, annotation_version }
  sets[]: [
    {
      set_id,                    // 套次编号（1/2/3）
      theme,                     // 主题（中文）
      word_bank[]: [             // 词库（15个选项 A-O）
        { letter, word }
      ],
      passage: {
        segments[]: [            // 原文分段（原文+空格交替）
          { type: "text", content }
          {
            type: "blank",
            id,                  // 题号（26-45）
            position: "inline",
            annotations: {
              correct_answer,    // 正确字母
              correct_word,      // 正确单词
              knowledge_points[]: [
                { category, sub_category, description }
              ]
            }
          }
        ]
      }
    }
  ]
}
```

### 1.2 知识点双层分类

每个空格标注 **2个知识点**（通常一语法 + 一语义），结构如下：

| 字段 | 取值范围 |
|------|---------|
| `category` | `语法` / `语义` |
| `sub_category` | 见下方分类表 |
| `description` | 具体说明（含例句/语境） |

---

## 二、语法知识点分类（Grammar）

### 2.1 Sub-category 全览

| 编号 | Sub-category | 说明 | 出现次数 |
|-----|-------------|------|---------|
| G01 | 词性判断与并列结构 | 与前后词并列，判断需填词性 | 1 |
| G02 | 形容词作表语 | be动词后 / 感叹句 how adj. 结构 | 2 |
| G03 | 固定搭配 | 词与介词/词的固定组合 | 7 |
| G04 | 介词后接名词 | 介词宾语位置需名词 | 1 |
| G05 | 形容词修饰名词 | 空格位于限定词与名词之间 | 3 |
| G06 | 动词不定式 | have/opportunity/likely to do 结构 | 3 |
| G07 | 名词作宾语 | 及物动词后宾语位置 | 1 |
| G08 | 副词修饰动词 | 空格修饰动词（sitting/published） | 2 |
| G09 | 副词修饰分词 | 修饰过去分词（published） | 1 |
| G10 | 动名词结构 | spend time doing / by doing 结构 | 2 |
| G11 | 名词单复数 | a/these 后的数的限制 | 2 |
| G12 | 动词时态与主谓一致 | 需判断时态（过去时/进行时） | 2 |
| G13 | 名词并列 | and 连接平行结构，判断词性 | 1 |
| G14 | 动词原形作谓语 | will / can 后接动词原形 | 1 |
| G15 | 动词不定式表目的 | to do 表目的状语 | 2 |
| G16 | 动词原形并列 | 与其他动词并列，需原形 | 1 |
| G17 | 副词作状语 | 句子主干完整，插入副词修饰 | 1 |
| G18 | 形容词+介词结构 | adj + 特定介词（aware of / involved in） | 2 |
| G19 | 副词修饰形容词 | 空格修饰形容词（critically important） | 1 |
| G20 | 名词（单） | a/the 后名词 | 2 |

### 2.2 高频语法考点 TOP 5

```
固定搭配（G03）      ████████████████████  7次
动词不定式（G06/G15）████████████  5次
形容词修饰名词（G05） ████████  3次
副词类（G08/G09/G17/G19）████████  5次
并列结构（G01/G13/G16）████  3次
```

---

## 三、语义知识点分类（Semantics）

### 3.1 Sub-category 全览

| 编号 | Sub-category | 说明 | 出现次数 |
|-----|-------------|------|---------|
| S01 | 语义衔接 | 与上下文语义场一致，近义并列 | 2 |
| S02 | 词义搭配 | 词与搭配成分的常见语义组合 | 4 |
| S03 | 语义逻辑 | 根据上下文逻辑选词（递进/转折/对比） | 4 |
| S04 | 逻辑关系 | 因果/递进/举例逻辑 | 1 |
| S05 | 动宾搭配 | 动词与宾语的语义匹配 | 7 |
| S06 | 近义词辨析 | 同义词中选最符合语境者 | 1 |
| S07 | 研究/报告用语 | 学术文体常用词（outcomes/determine） | 2 |
| S08 | 固定搭配（语义层） | 固定短语的语义整体性 | 4 |
| S09 | 概括性语义 | 空格词概括前后段落语义 | 1 |
| S10 | 特殊语义（略带贬义） | 褒义词在特定语境中反用 | 1 |
| S11 | 语义场 | 词与所在主题场的一致性 | 2 |
| S12 | 上下文语义 | 通过前后文推断空格词义 | 2 |
| S13 | 核心语义 | 主旨句/主题句关键词 | 1 |
| S14 | 语义逻辑链 | 词在连续动作/逻辑链中的位置 | 1 |
| S15 | 抽象名词搭配 | 形容词 + 抽象名词的固定语义 | 1 |

### 3.2 高频语义考点 TOP 5

```
动宾搭配（S05）      ████████████████████  7次
词义搭配（S02）      ████████████  4次
语义逻辑（S03）      ████████████  4次
固定搭配语义（S08）  ████████████  4次
研究用语（S07）      ████████  2次
```

---

## 四、典型例题精析（按知识点分类）

### 4.1 固定搭配类

#### 例1：country of origin（固定介词搭配）
> **原文**：Immigrant parents could talk about their country of ___(38)___.  
> **答案**：L - origin  
> **语法**：介词 of 后接名词  
> **语义**：country of origin（原籍国）——固定地理/法律用语

#### 例2：be made aware of（形容词介词结构）
> **原文**：Families must be made ___(42)___ of field trips...  
> **答案**：C - aware  
> **语法**：be made aware of（使……知晓）固定结构  
> **语义**：aware + of 构成固定搭配，强调信息告知

#### 例3：be involved in（固定搭配）
> **原文**：students can learn to be ___(43)___ in community projects  
> **答案**：H - involved  
> **语法**：be involved in（参与），固定搭配  
> **语义**：involved 与 community projects 语义匹配

---

### 4.2 动词不定式类

#### 例1：have the opportunity to do
> **原文**：Many students do not have the opportunity to ___(40)___ concerts  
> **答案**：B - attend  
> **语法**：have the opportunity to do 结构，需动词原形  
> **语义**：attend concerts（参加音乐会），与 visit museums 并列

#### 例2：to do 表目的
> **原文**：they didn't compare different sedentary activities to ___(35)___ whether...  
> **答案**：D - determine  
> **语法**：to 引导目的状语，接动词原形  
> **语义**：determine whether...（确定是否）——学术研究用语

---

### 4.3 副词修饰类

#### 例1：副词修饰动词
> **原文**：spending so many hours sitting ___(26)___ can lead to obesity  
> **答案**：H - passively  
> **语法**：空格修饰 sitting，需副词  
> **语义**：passively（被动地）——描述久坐不动状态，引出健康风险

#### 例2：副词修饰形容词
> **原文**：It is ___(28)___ important that we provide teachers...  
> **答案**：G - critically  
> **语法**：空格修饰 important，需副词  
> **语义**：critically important（至关重要的）——固定强调用语

---

### 4.4 并列结构类

#### 例1：动词原形并列
> **原文**：how to better recruit, support and ___(33)___ effective teachers  
> **答案**：O - retain  
> **语法**：与 recruit、support 并列，需动词原形  
> **语义**：招聘→支持→留住，逻辑链末端

#### 例2：名词并列（and 连接）
> **原文**：Your students' parents are resources and ___(36)___  
> **答案**：A - assets  
> **语法**：与 resources 由 and 连接，需复数名词  
> **语义**：assets（财富）与 resources（资源）近义并列

---

### 4.5 语义逻辑类

#### 例1：近义词同义复现
> **原文**：the odds of dying prematurely ___(31)___ 13%  
> **答案**：A - climbed  
> **语法**：句子缺谓语，过去时  
> **语义**：climbed 与上文 rose、increased 同义复现，描述数据上升

#### 例2：概括性语义
> **原文**：All of these ___(32)___ are linked to a lack of physical activity  
> **答案**：G - outcomes  
> **语法**：these 后复数名词  
> **语义**：outcomes（结果）概括上文所列患病风险数据

---

## 五、知识点组合统计

### 5.1 最常见的知识点组合模式

| 组合类型 | 频率 | 典型例子 |
|---------|------|---------|
| 语法：固定搭配 + 语义：动宾搭配 | 6次 | attend（G06+S05）|
| 语法：形容词修饰名词 + 语义：词义搭配 | 4次 | excellent（G02+S02）|
| 语法：副词类 + 语义：语义逻辑 | 4次 | passively（G08+S03）|
| 语法：并列结构 + 语义：逻辑链 | 3次 | retain（G16+S14）|
| 语法：固定搭配 + 语义：固定搭配 | 3次 | aware（G03+S08）|

### 5.2 词性分布

| 词性 | 数量 | 占比 |
|-----|------|------|
| 动词（含分词/动名词） | 12 | 40% |
| 名词 | 10 | 33% |
| 形容词 | 5 | 17% |
| 副词 | 3 | 10% |

---

## 六、备考策略总结

### 6.1 解题优先级

```
第一步：语法定位  →  判断词性（名词/动词/形容词/副词）
第二步：语法约束  →  固定搭配 / 并列结构 / 时态
第三步：语义筛选  →  动宾搭配 / 语义逻辑 / 上下文
第四步：排除验证  →  词库中剩余词逐一排除
```

### 6.2 高频考点快查

| 考点 | 判断信号 |
|-----|---------|
| 固定搭配 | be + adj + of/in/to；country of；channel surfing |
| 并列结构 | A, B, and ___；A and ___ |
| 动词不定式 | opportunity to ___；to ___（目的状语） |
| 副词 | 修饰动词/形容词，句子主干已完整 |
| 研究学术用语 | determine, outcomes, previously 等 |

### 6.3 词库使用策略

- **先定性**：语法确定词性，先圈出 5-7 个候选词
- **再定义**：语义缩小到 2-3 个
- **最后排除**：利用已用词不重复原则确认

---

## 七、本批次题目完整索引

| 套次 | 主题 | 题号范围 | 答案序列 |
|-----|------|---------|---------|
| Set 1 | 将社区资源带入课堂 | 36-45 | A E L N B G C H D O |
| Set 2 | 看电视的健康危害 | 26-35 | H F I L C A G E B D |
| Set 3 | 教育公平倡议 | 26-35 | A K G L D H J O E C |

---

*本文件由 WorkBuddy 自动生成 | 标注来源：201506P3SA.json*
