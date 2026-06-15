# 业务库需求开发主流程

标准流转：

`draft_spec -> spec_review -> spec_revision -> implementation -> code_review -> code_revision -> acceptance -> done`

## 使用原则

- 每个阶段先判断任务类型
- 每个阶段先读最小加载集，而不是整库扫描
- 每个阶段的正式结论都必须能回溯到知识库事实或源码事实
- 审查必须由新的 reviewer 视角完成，不能作者自判通过

## 阶段与产物

| 阶段 | 负责角色 | 最小读取集 | 主要产物 |
|------|---------|-----------|---------|
| 方案编写 | solution-writer | index + shared-facts + 方案路由文件 | `spec.md` |
| 方案审查 | solution-reviewer | index + shared-facts + 审查热点 | `spec-review.md` |
| 代码编写 | code-writer | index + shared-facts + 实现模板 | 源码与最小验证记录 |
| 代码审查 | code-reviewer | index + shared-facts + 陷阱目录 | `code-review.md` |
| 验收 | reviewer / orchestrator | 方案、实现、审查产物 | `acceptance.md` |

## 交接要求

- 交接时携带：任务类型、feature_key、相关产物、最关键事实、未决风险
- reviewer 先核实边界、注册链、多视图/单例、输入桥接、pick、dirty、销毁链
- 发现知识库和源码冲突时，先修正文档，再继续流转
