# Phase 03 - 可解释检索链路

## Goal

实现基础但可解释的知识资产检索能力，为 Agent 问答提供可追踪上下文。

## Scope

- 实现 query normalization 和轻量 tokenization。
- 按标题、标签、正文加权评分。
- 返回 top 3 检索结果。
- 输出 snippet、score、matchedTerms，用于 UI 展示和 Trace。

## Non-goals

- 不接入真实 embedding 模型。
- 不接入真实向量数据库。
- 不实现复杂中文分词、语义重排和混合检索。

## Deliverables

- `SearchResult` 类型。
- `lib/retrieval` 检索逻辑。
- `POST /api/search`。
- 可复用的检索结果结构，供 `/api/ask` 使用。

## Implementation tasks

1. 实现 normalization：
   - 小写英文。
   - 去除多余空白。
   - 保留中文、英文、数字和常见业务词。
2. 实现 tokenization：
   - 英文和数字按空白与符号切分。
   - 中文采用连续短词、原 query 和资产字段包含关系的轻量策略。
   - 过滤过短和重复 token。
3. 实现加权评分：
   - 标题命中权重最高。
   - 标签命中次高。
   - 正文命中作为基础召回。
   - 分数归一化为便于展示的小数。
4. 生成 snippet：
   - 优先围绕第一个命中词截取正文。
   - 无明确命中词时取正文开头。
5. `POST /api/search`：
   - 输入：`{ query: string }`
   - 输出：`{ data: SearchResult[] }`
   - 空 query 返回 400。

## Acceptance criteria

- 搜索 “AIOS 支持哪些能力” 能命中 “AIOS 平台介绍”。
- 搜索 “权限 控制 可观测性” 能命中 “Agent 工作流”。
- 搜索 “客户案例 产品说明” 能命中 “数字资产知识库”。
- 每个结果包含 title、snippet、score、matchedTerms。
- 无命中时返回空数组，而不是伪造结果。

## Verification

- 使用 API 手动调用 3 个代表性 query。
- 检查 top 3 排序是否符合直觉。
- 检查 snippet 是否能解释命中原因。
- 运行 `npm run lint`。

## Risks

- 轻量中文 tokenization 的语义召回有限。
- 如果 query 很短，分数可能偏高或偏低，需要通过展示 matchedTerms 解释结果。

## Implementation result

待完成后补充。
