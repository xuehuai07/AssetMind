# AssetMind Workbench

AssetMind Workbench 是一个本地演示优先的知识资产问答工作台。它把知识资产列表、新增资产、关键词检索、Agent 问答、引用来源和 Agent Trace 放在同一个克制的企业工作台界面里，重点展示 RAG 产品闭环和可观测链路，而不是堆叠复杂功能。

## 功能概览

- 知识资产列表：展示标题、正文摘要、标签和资产数量。
- 新增知识资产：通过右侧抽屉提交 Title、Content、Tags，写入本地 JSON 文件。
- 简单检索：根据 query 返回 top 3 相关资产，展示 score、snippet、matchedTerms。
- Agent 问答：基于检索结果生成 Mock 回答，不命中时明确提示缺少依据。
- 引用来源：答案下方展示实际用于回答的资产引用。
- Agent Trace：展示 query normalization、retrieval、scoring、mock answer generation、final answer。
- 交互状态：覆盖 loading、empty、error、no result、新增成功等基础状态。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Next API Route
- 本地 JSON 文件存储

## 本地运行

```powershell
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:3000
```

常用检查：

```powershell
npm run lint
npm run build
```

## 目录结构

```text
app/
  api/
    assets/route.ts
    search/route.ts
    ask/route.ts
  layout.tsx
  page.tsx
components/
  workbench.tsx
data/
  knowledge-assets.json
lib/
  agent.ts
  assets-store.ts
  retrieval.ts
types/
  agent.ts
  api.ts
  assets.ts
  retrieval.ts
docs/
  *_phase-*.md
```

## API

- `GET /api/assets`: 获取知识资产列表。
- `POST /api/assets`: 新增知识资产。
- `POST /api/search`: 检索 top 3 相关资产。
- `POST /api/ask`: 检索并生成回答、引用和 Trace。

## 数据结构设计

知识资产使用题目要求的最小结构：

```ts
type KnowledgeAsset = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
};
```

设计取舍：

- `title` 用于高权重检索和列表识别。
- `content` 是回答和引用的主要依据。
- `tags` 用于检索加权和左侧资产概览。
- `createdAt` 便于后续排序、审计和增量同步。
- `id` 使用 `crypto.randomUUID()` 生成，避免标题变更影响引用关系。

## 检索实现

当前检索是轻量关键词检索，不接入 embedding 或向量数据库。

流程：

1. 对 query 做 normalization：大小写统一、空白清洗、保留中文/英文/数字。
2. 做轻量 tokenization：英文按词切分，中文优先保留业务词，必要时补充短 n-gram。
3. 对资产字段加权评分：标题权重最高，标签次之，正文作为基础召回。
4. 生成 `snippet`、`score`、`matchedTerms`。
5. 返回 top 3，供搜索面板和 Agent 问答复用。

这不是语义检索，但优点是稳定、透明、容易解释，适合笔试项目展示检索链路意识。

## Agent 回答设计

当前默认使用 Mock Answer Provider：

- 先调用检索链路。
- 只使用检索命中的资产生成回答。
- 引用只来自实际命中的高置信资产。
- 无命中时返回“没有足够依据”的回答。
- Trace 展示系统步骤和检索元数据，不暴露模型内部推理。

## 为什么选择本地 JSON

本项目优先服务本地演示和代码解释，所以选择 `data/knowledge-assets.json`：

- 实现轻量，评审者无需准备数据库。
- 刷新或重启 dev server 后新增资产仍保留。
- 能清楚展示数据结构和读写边界。

限制：

- 不适合高并发写入。
- 不适合无持久文件系统的 Serverless 部署。
- 缺少权限、审计、事务和备份能力。

## DeepSeek 后续接入方式

当前不默认调用真实模型，避免密钥成为演示阻塞。后续接入 DeepSeek 时建议新增 DeepSeek Provider，并复用现有 `AnswerProvider` 接口。

建议环境变量：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`，默认 `https://api.deepseek.com`
- `DEEPSEEK_MODEL`

接入方式：

1. 在 Provider 中把检索结果拼成上下文。
2. 通过 DeepSeek 的 OpenAI 兼容 Chat Completions 格式请求模型。
3. 保留 Mock Provider 作为无 key 或调用失败时的兜底。
4. Trace 中记录 provider、retrieved assets、scores、final answer，不记录敏感 prompt 或密钥。

## 如果接入真实向量数据库

会把当前 `lib/retrieval.ts` 拆成检索接口和具体实现：

- 写入资产时生成 chunk。
- 对 chunk 调用 embedding 模型。
- 存储到向量数据库，例如 pgvector、Milvus、Qdrant 或 Pinecone。
- 查询时做向量召回，可叠加关键词过滤和 rerank。
- `SearchResult` 保持兼容，继续向 UI 和 Agent 返回 `assetId/title/snippet/score`。

## 如果支持多租户

需要从数据模型和接口层加入租户隔离：

- `KnowledgeAsset` 增加 `tenantId`。
- 所有 API 从认证上下文解析 tenant，而不是信任前端传参。
- 存储层按 tenant 过滤读写。
- 检索索引按 tenant 隔离，避免跨租户召回。
- Trace、日志和错误信息也必须避免泄露其他租户数据。

## 真实 ToB 场景最担心的问题

最担心的是权限与引用可信度：

- RAG 很容易把用户无权访问的资料召回进上下文。
- Agent 回答如果没有清晰引用，会降低业务可信度。
- 企业知识常有版本、权限、敏感字段和过期内容，单纯检索命中不代表可以回答。

真实上线前必须补齐权限过滤、审计日志、数据脱敏、引用校验、反馈闭环和人工可追责机制。

## 未完成事项

- 未接入真实 DeepSeek API。
- 未接入真实向量数据库或 embedding。
- 未实现登录、权限、多租户和审计。
- 未实现资产编辑、删除、文件上传和批量导入。
- 未实现流式回答和多轮对话记忆。
- npm audit 当前报告 Next 依赖链中的 PostCSS moderate 漏洞；自动修复需要破坏性 `--force` 降级，因此本次未执行。

## 继续迭代计划

1. 接入 DeepSeek Provider，并保留 Mock 兜底。
2. 增加资产编辑、删除、导入和检索高亮。
3. 引入 chunking、embedding 和向量数据库。
4. 增加权限模型、多租户隔离和审计日志。
5. 增加端到端测试和更完整的错误监控。

## 文档入口

- `docs/knowledge_asset_agent_exam.md`: 笔试题目原始需求。
- `docs/2026-06-16_assetmind-workbench.md`: 总体设计文档。
- `docs/2026-06-16_phase-roadmap.md`: 分阶段路线图。
- `docs/2026-06-16_phase-01_foundation.md` 到 `docs/2026-06-16_phase-06_delivery.md`: 阶段实施文档。
