# CET4 英语四级词汇匹配标注检索系统

基于 Next.js 构建的 CET4 英语四级考试词汇匹配标注检索系统，支持全文检索、知识点检索、单词检索、套题浏览和数据统计等功能。

## 功能特性

- **全文检索**：搜索文章内容，返回包含检索词的完整句子，关键词黄色高亮
- **知识点检索**：按知识点描述、子类名称、单词搜索，展示完整句子上下文
- **单词检索**：快速查找单词在不同套题中的出现位置和标注信息
- **套题浏览**：按套题分组浏览所有文章和标注数据
- **数据统计**：可视化展示知识点分布、词频统计等
- **管理后台**：支持 JSON 数据上传、数据集管理（增删改查）

## 技术栈

- **前端**：Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **后端**：Next.js API Routes + Prisma ORM
- **数据库**：SQLite
- **UI 组件**：Radix UI + Lucide Icons + Recharts

## 项目结构

```
├── prisma/
│   └── schema.prisma        # 数据库模型定义
├── src/
│   ├── app/
│   │   ├── page.tsx         # 用户检索页面（5个Tab）
│   │   ├── admin/page.tsx   # 管理员页面
│   │   ├── api/
│   │   │   ├── datasets/    # 数据集 CRUD API
│   │   │   └── upload/      # 文件上传 API
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   └── ui/              # shadcn/ui 组件库
│   ├── context/
│   │   └── DataContext.tsx   # 全局数据上下文
│   ├── data/
│   │   └── cet4-data.ts     # 内置数据（待清理）
│   ├── hooks/
│   ├── lib/
│   │   ├── cet4-utils.ts    # 核心搜索/解析工具函数
│   │   ├── db.ts            # Prisma 客户端
│   │   └── utils.ts
│   └── ...
├── .gitignore
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/<你的用户名>/cet4-vocab-search.git
cd cet4-vocab-search
```

### 2. 安装依赖

```bash
bun install
# 或
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL="file:./db/custom.db"
```

### 4. 初始化数据库

```bash
npx prisma db push
npx prisma generate
```

### 5. 启动开发服务器

```bash
bun run dev
# 或
npm run dev
```

访问 http://localhost:3000 查看用户检索页面，访问 http://localhost:3000/admin 查看管理后台。

## 数据格式

系统接受 JSON 格式的 CET4 标注数据，结构如下：

```json
{
  "examInfo": {
    "year": 2015,
    "month": 6,
    "type": "P3SA"
  },
  "sets": [
    {
      "setId": 1,
      "passages": [...],
      "knowledgePoints": [...]
    }
  ]
}
```

## 许可证

MIT License
