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
