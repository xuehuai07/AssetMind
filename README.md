# AssetMind Workbench

AssetMind Workbench 是一个知识资产问答工作台项目，目标是实现知识资产列表、新增资产、检索、Agent 问答、引用来源和 Agent Trace 可观测性的完整闭环。

当前仓库已完成到 Phase 04：工程骨架、知识资产 API、可解释检索链路和 Mock Agent 问答 API。

## 本地运行

```powershell
npm install
npm run dev
```

打开 `http://127.0.0.1:3000` 查看工作台基础页面。

## 已实现 API

- `GET /api/assets`: 获取知识资产列表。
- `POST /api/assets`: 新增知识资产。
- `POST /api/search`: 检索 top 3 相关资产，返回 score、snippet、matchedTerms。
- `POST /api/ask`: 检索并生成 Mock Agent 回答，返回引用来源和 Agent Trace。

## DeepSeek 后续接入边界

当前默认使用 Mock Answer Provider，不依赖真实模型密钥。后续接入 DeepSeek 时建议新增 DeepSeek Provider，并通过环境变量配置：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`，默认 `https://api.deepseek.com`
- `DEEPSEEK_MODEL`

DeepSeek 支持 OpenAI 兼容格式，因此 Provider 层可以复用当前 `AnswerProvider` 接口，把检索结果作为上下文传入模型，并保留 Mock Provider 作为无密钥兜底。

## 文档入口

- `docs/knowledge_asset_agent_exam.md`: 笔试题目原始需求。
- `docs/2026-06-16_assetmind-workbench.md`: 总体设计文档。
- `docs/2026-06-16_phase-roadmap.md`: 分阶段路线图。
- `docs/2026-06-16_phase-01_foundation.md` 到 `docs/2026-06-16_phase-06_delivery.md`: 阶段实施文档。

后续实现将按阶段推进，并在完成后补充运行方式、技术取舍和验收结果。
