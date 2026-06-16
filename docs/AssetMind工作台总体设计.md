# AssetMind Workbench 设计文档

## Goal

实现一个本地演示优先的知识资产问答工作台，完整覆盖“资产管理 - 检索 - Agent 问答 - 引用 - Agent Trace”的闭环。项目重点是产品判断、工程结构、代码质量、前端审美、AI 产品理解和检索链路可观测性，而不是堆叠复杂功能。

## Scope

- 使用 Next.js、React、TypeScript、Tailwind CSS 构建单页工作台。
- 通过 Next API Route 提供资产读写、检索、Agent 问答接口。
- 使用本地 JSON 文件保存知识资产，适配本地演示和代码解释。
- 内置题目要求的 3 条初始知识资产。
- 支持新增知识资产，并在刷新后保留新增内容。
- 支持基础关键词检索，返回 top 3 相关资产、片段、分数和命中词。
- 支持基于检索结果的 Mock Agent 回答，展示引用来源。
- 展示 Agent Trace，包括查询、检索、评分、答案生成等步骤。
- README 说明启动方式、技术取舍、检索实现、DeepSeek 后续接入、多租户和真实 ToB 风险。

## Non-goals

- 不接入真实向量数据库。
- 不实现登录、权限、多租户隔离、审计日志和数据迁移。
- 不实现文件上传、富文本编辑、资产编辑和资产删除。
- 不把 DeepSeek API 作为必须依赖；本次只预留 Provider 接口和配置说明。
- 不设计复杂发布流程；GitHub 上传按后续用户请求完成。

## Impact

- 这是从零创建应用工程，会新增 Next.js 项目结构、数据文件、API Route、前端组件、业务逻辑和 README。
- 本地 JSON 文件写入适合本地演示，但不适合无持久文件系统的 Serverless 部署。
- Agent 输出是可解释的 Mock 结果，能展示 RAG 产品链路，但不等同于真实 LLM 推理质量。

## Implementation plan

1. 初始化工程结构
   - 新建 Next.js App Router 项目所需配置：`package.json`、`tsconfig.json`、`next.config.*`、Tailwind/PostCSS 配置、`app` 目录。
   - 使用 TypeScript 严格类型约束核心数据结构。

2. 建立数据与业务层
   - 新增 `data/knowledge-assets.json`，写入 3 条初始知识资产。
   - 新增类型定义：`KnowledgeAsset`、`SearchResult`、`AgentTrace`、`AskResponse`。
   - 封装 JSON 文件读写，避免 API Route 里散落文件操作。

3. 实现检索链路
   - 对 query、title、content、tags 做简单 normalization 和 tokenization。
   - 按字段加权评分：标题和标签权重高于正文。
   - 返回 top 3 命中结果，并包含 snippet、score、matchedTerms。
   - 无命中时返回空结果和可解释提示。

4. 实现 Agent 回答
   - 默认使用 Mock Answer Provider，根据 top results 合成回答。
   - 预留 DeepSeek Provider 适配接口，后续可用 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL` 开启真实模型。
   - `POST /api/ask` 负责串联检索、回答、引用和 Trace。

5. 实现前端工作台
   - 左侧区域展示知识资产列表、标签和资产数量。
   - 中间区域提供提问输入、回答、引用来源和检索结果。
   - 右侧区域展示 Agent Trace 时间线和评分明细。
   - 使用右侧抽屉或面板新增知识资产，避免页面跳转。
   - 覆盖 loading、empty、error、no result、新增成功等状态。

6. 打磨 UI 和说明文档
   - UI 风格采用克制的企业 RAG 工作台：清晰分区、适中密度、低饱和中性色和少量状态色。
   - README 覆盖题目必答项、启动方式、技术取舍、DeepSeek 接入说明和后续迭代方向。

## Follow-up documents

- `docs/AssetMind中国化RAG升级设计.md`: 中国化、资料上传、DeepSeek 和液态玻璃 UI 升级设计文档。

早期阶段文档已在升级中清理，保留本总体设计文档和升级设计文档作为长期上下文。

## Files and modules involved

- `app/`: 页面、全局样式、API Route。
- `components/`: 工作台、资产列表、提问区、引用卡片、Trace 面板、新增资产表单等 UI 组件。
- `lib/`: 资产存储、检索逻辑、Agent Provider、工具函数。
- `types/`: 共享业务类型。
- `data/knowledge-assets.json`: 本地资产数据。
- `README.md`: 项目说明和题目必答。

## Risks

- 本地 JSON 文件写入在并发场景下不具备生产级一致性，只适合演示。
- Mock Agent 可能被误解为真实模型能力，需要在 UI 或 README 中说明。
- 中文分词采用轻量策略，召回能力有限；需要通过权重和片段展示提高可解释性。
- 依赖链存在 npm audit 报告的 moderate 漏洞，自动修复路径会触发破坏性版本变更。

## Rollback plan

- 删除新增的 Next.js 工程文件、`data`、`app`、`components`、`lib`、`types`、`README.md` 等文件即可回退。
- 不修改现有 `docs/知识资产智能体笔试题.md` 和 `AGENTS.md`，避免影响原始需求和工作规则。

## Verification

- 运行 `npm run lint`。
- 运行 `npm run build`。
- 启动本地开发服务并人工验证：
  - 初始 3 条资产正确展示。
  - 新增资产后列表更新，刷新后仍存在。
  - 检索返回 top 3、分数、命中词和片段。
  - 提问后展示回答、引用来源和 Agent Trace。
  - 无命中问题展示明确空态。
  - API 错误时前端有错误反馈。
- 运行 `git diff --check` 检查 whitespace 和 diff 基础质量。

## Acceptance criteria

- 项目可通过 README 指令在本地启动。
- 核心 RAG 闭环完整可演示：资产列表、新增、检索、问答、引用、Trace。
- UI 具备清晰信息架构和企业工作台质感，不是营销首页。
- 代码结构清晰，业务逻辑与 UI 组件分层明确。
- README 回答题目要求的关键设计问题。
- 不依赖真实 DeepSeek key 也能完整运行；后续接入 DeepSeek 的边界清楚。

## Implementation result

已完成到 Phase 06 交付收口。

- 完成 Next.js App Router 工程，使用 React、TypeScript、Tailwind CSS 构建工作台。
- 完成知识资产本地 JSON 存储、资产读取和新增 API。
- 完成可解释检索链路，返回 top 3、score、snippet、matchedTerms。
- 完成 Mock Agent 问答，返回 answer、citations、results、trace 和 provider 信息。
- 完成三栏工作台 UI，覆盖资产列表、新增资产、搜索、问答、引用来源和 Agent Trace。
- 完成 README，覆盖启动方式、技术取舍、数据结构、检索实现、向量库改造、多租户改造、DeepSeek 接入边界、真实 ToB 风险和未完成事项。
- 最终验证通过：`npm run lint`、`npm run build`、`git diff --check`、页面 200、资产 API、搜索 API、问答 API、错误状态和无命中场景。
- `npm audit --audit-level=moderate` 仍报告 Next 依赖链中的 PostCSS moderate 漏洞；自动修复需要破坏性 `--force`，本次未执行，已在 README 说明。
