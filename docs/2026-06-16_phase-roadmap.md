# AssetMind Workbench 阶段路线图

## 阶段拆分原则

- 每个阶段都能独立验收，避免把所有风险压到最后。
- 先打通数据和 API，再做检索、Agent、UI 打磨。
- 保持本地演示优先，不引入真实数据库、真实向量库、登录权限等重型能力。
- DeepSeek 只做可替换边界和配置说明，不作为默认运行依赖。

## 阶段总览

| 阶段 | 文档 | 目标 | 主要验收点 |
| --- | --- | --- | --- |
| Phase 01 | `docs/2026-06-16_phase-01_foundation.md` | 初始化工程骨架和基础设计系统 | 已完成：Next.js 可启动，Tailwind 生效，基础布局可展示 |
| Phase 02 | `docs/2026-06-16_phase-02_assets-api.md` | 建立知识资产数据层和 API | 已完成：初始资产可读取，新增资产可持久化到 JSON |
| Phase 03 | `docs/2026-06-16_phase-03_retrieval.md` | 实现可解释检索链路 | 已完成：搜索返回 top 3、score、snippet、matchedTerms |
| Phase 04 | `docs/2026-06-16_phase-04_agent-answer.md` | 实现 Agent 问答和 Provider 边界 | 已完成：`/api/ask` 返回答案、引用和 Trace |
| Phase 05 | `docs/2026-06-16_phase-05_workbench-ui.md` | 打磨完整工作台 UI 和交互 | 三栏工作台、新增面板、状态反馈完整 |
| Phase 06 | `docs/2026-06-16_phase-06_delivery.md` | 文档、验证和交付收口 | README 完整，lint/build 通过，人工验收完成 |

## 建议执行顺序

1. 先完成 Phase 01，确保工程可运行。
2. Phase 02 和 Phase 03 形成数据与检索基础，先用 API 或简单页面验证。
3. Phase 04 在检索稳定后接入，保证 Agent 输出严格基于检索结果。
4. Phase 05 聚焦产品完成度和审美，不在 UI 阶段重新发明业务逻辑。
5. Phase 06 做 README、验证、风险说明和设计文档结果回填。

## 全局完成标准

- 本地可通过 README 指令启动。
- 初始 3 条资产展示正确。
- 新增资产刷新后仍存在。
- 搜索和问答均能展示引用来源。
- Agent Trace 能看出 query、retrieval、scoring、answer generation 的过程。
- 无 DeepSeek key 时项目仍完整可演示。
- README 回答题目要求的关键设计问题。
