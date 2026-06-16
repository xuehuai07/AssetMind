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

- 当前目录不是 Git 仓库，无法使用 `git diff --check` 做最终 diff 检查。
- 如果依赖安装或网络异常，需记录未验证项和原因。
- 收口阶段发现架构问题时，不应临时大改，应记录为后续迭代。

## Implementation result

待完成后补充。
