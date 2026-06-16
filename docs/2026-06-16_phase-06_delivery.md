# Phase 06 - 文档、验证与交付收口

## Goal

完成项目交付材料、验证闭环和风险说明，确保代码可以被评审者快速运行、理解和追问。

## Scope

- 完成 README。
- 回填总设计文档和阶段文档的 Implementation result。
- 执行 lint、build 和手动验收。
- 整理未完成事项和后续迭代建议。

## Non-goals

- 不在收口阶段新增大功能。
- 不做与题目无关的重构。
- 不初始化 Git 仓库，保持已确认边界。

## Deliverables

- `README.md`。
- 阶段文档 Implementation result 回填。
- 总设计文档 Implementation result 回填。
- 验证结果记录。

## README required content

- 项目介绍和功能概览。
- 本地启动方式。
- 技术栈和目录结构。
- 数据结构设计说明。
- 检索实现说明。
- 为什么选择本地 JSON 文件。
- 如果接入真实向量数据库，会如何改造。
- 如果支持多租户，会如何改造。
- 如果上线真实 ToB 场景，最担心的问题。
- DeepSeek 后续接入方式。
- 未完成事项和继续迭代计划。

## Verification plan

1. 自动检查：
   - `npm run lint`
   - `npm run build`
2. API 验证：
   - `GET /api/assets`
   - `POST /api/assets`
   - `POST /api/search`
   - `POST /api/ask`
3. 浏览器验收：
   - 初始 3 条资产展示正确。
   - 新增资产刷新后仍存在。
   - 搜索返回 top 3、分数、命中词和片段。
   - 提问后展示答案、引用和 Trace。
   - 无命中问题有明确空态。
   - API 错误时 UI 有错误反馈。
4. 文档验收：
   - README 可让评审者独立启动项目。
   - README 能解释项目取舍和后续扩展方案。

## Acceptance criteria

- `npm run lint` 通过。
- `npm run build` 通过。
- README 覆盖题目要求的所有必答问题。
- 总设计文档和阶段文档的 Implementation result 有实际结果。
- 没有引入 `.env`、密钥、运行时上传文件或无关大文件。

## Risks

- 依赖链仍存在 npm audit 报告的 moderate 漏洞，自动修复路径会触发破坏性版本变更。
- 如果依赖安装或网络异常，需记录未验证项和原因。
- 收口阶段发现架构问题时，不应临时大改，应记录为后续迭代。

## Implementation result

已完成。

- README 已补齐项目介绍、功能概览、本地启动、技术栈、目录结构、API、数据结构设计、检索实现、本地 JSON 取舍、DeepSeek 后续接入、真实向量库改造、多租户改造、真实 ToB 风险、未完成事项和后续迭代计划。
- 总设计文档已回填 Implementation result。
- Phase 01 至 Phase 06 的阶段文档均已回填实现结果或状态。
- 最终自动检查：
  - `npm run lint` 通过。
  - `npm run build` 通过。
  - `git diff --check` 通过。
- 最终运行验收：
  - 首页返回 200。
  - `GET /api/assets` 返回 3 条初始资产。
  - `POST /api/assets` 可新增资产。
  - 新增后测试数据源资产数从 3 变为 4。
  - 搜索 “AIOS 支持哪些能力” 顶部命中 “AIOS 平台介绍”。
  - 搜索 “权限 控制 可观测性” 顶部命中 “Agent 工作流”。
  - 搜索新增验收资产可命中新资产。
  - 搜索无命中 query 返回空数组。
  - 提问 “AIOS 支持哪些能力？” 返回引用 “AIOS 平台介绍”。
  - 无命中提问返回无依据回答且引用为空。
  - 空 title 新增和空 question 提问均返回 400。
  - 验证过程使用测试 JSON 文件，正式 `data/knowledge-assets.json` 保持 3 条 seed 数据。
- `npm audit --audit-level=moderate` 报告 Next 依赖链中的 PostCSS moderate 漏洞；自动修复需要破坏性 `npm audit fix --force`，本次未执行，已记录在 README。
