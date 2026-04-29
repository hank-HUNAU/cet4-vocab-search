---
Task ID: 1
Agent: Main Agent
Task: JSON文件上传接口 - 上传数据后读取并更新到各个页面

Work Log:
- 分析现有项目结构：后端API已存在(upload/datasets)，前端5个Tab使用静态cet4-data.ts
- 创建 /src/lib/cet4-utils.ts (379行) - 参数化工具函数，所有函数接受CET4Data作为参数
- 创建 /src/context/DataContext.tsx (228行) - 数据上下文Provider，管理动态数据状态
- 修改 /src/app/page.tsx (1997行) - 全部5个Tab改为接收动态data prop，新增上传UI和数据源选择器
- 修改 /src/app/layout.tsx (56行) - 包裹DataProvider + SonnerToaster
- 构建验证通过 npm run build ✓

Stage Summary:
- 前端数据层从静态导入改为动态Context+Props模式
- 新增数据源选择器（下拉切换内置数据/上传数据集）
- 新增上传区域（拖拽上传、文件选择、名称描述输入）
- 上传成功后自动加载数据到所有Tab页面
- 支持导出/删除已上传数据集
- 上传的JSON缺少difficulty/frequency字段时自动计算补充

---
Task ID: 2
Agent: Main Agent
Task: 修复客户端异常 - 上传数据处理方式等同于内置数据

Work Log:
- 诊断问题：上传的JSON数据缺少metadata和question_types字段，导致页面渲染时data.metadata.exam_year等访问崩溃
- 新增 normalizeToCET4Data() 函数在 cet4-utils.ts 中，处理4种JSON格式并确保所有CET4Data字段存在
- 修改 DataContext.tsx 中 loadDataset 使用 normalizeToCET4Data + enrichCET4Data 双重处理
- 修改 page.tsx 中 DataSourceSelector 和页脚，安全访问 metadata 和 question_types
- 修改 hasData 逻辑从硬编码 questionType === "banked_cloze" 改为 data.sets.length > 0
- 新增 ErrorBoundary 组件包裹页面，防止白屏错误
- 使用 node/tsx 直接测试验证：normalize、enrich、各格式数据处理全部通过
- 构建验证通过 npm run build ✓

Stage Summary:
- 核心问题：上传数据缺少 metadata/question_types 导致客户端异常
- 解决方案：新增 normalizeToCET4Data() 统一数据格式，确保 metadata + question_types + sets 全部存在
- 数据流：上传JSON → parse → normalizeToCET4Data(补全metadata/question_types/sets) → enrichCET4Data(补全difficulty/frequency) → 渲染
- 支持4种格式：标准CET4Data、单套题、缺metadata、缺question_types
- ErrorBoundary 兜底防白屏
