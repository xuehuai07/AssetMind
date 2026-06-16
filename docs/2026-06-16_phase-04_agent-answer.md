# Phase 04 - Agent 问答与 Provider 边界

## Goal

基于检索结果生成可解释的 Agent 回答，并预留 DeepSeek 后续接入边界。

## Scope

- 定义 Agent 请求、回答、引用和 Trace 类型。
- 实现 Mock Answer Provider。
- 实现 `POST /api/ask`，串联检索、回答、引用和 Trace。
- 在 README 中说明 DeepSeek 后续接入方式。

## Non-goals

- 不默认调用真实 DeepSeek API。
- 不实现流式输出。
- 不暴露 Chain of Thought；Trace 展示系统步骤和可观测元数据，不展示模型内部推理。
- 不实现多轮对话记忆。

## Deliverables

- `AnswerProvider` 接口。
- `MockAnswerProvider`。
- `AgentTrace`、`AskResponse` 类型。
- `POST /api/ask`。
- DeepSeek Provider 的配置边界说明。

## Implementation tasks

1. 定义 Provider 接口：
   - 输入 query、search results、assets。
   - 输出 answer、citations、provider metadata。
2. Mock Answer Provider：
   - 有检索结果时，基于 top results 的片段合成回答。
   - 引用只来自实际命中的资产。
   - 无命中时明确说明未找到足够依据。
3. 实现 Trace：
   - `query normalization`
   - `retrieval`
   - `scoring`
   - `mock answer generation`
   - `final answer`
4. 实现 `/api/ask`：
   - 输入：`{ question: string }`
   - 输出：`AskResponse`
   - 空问题返回 400。
5. 预留 DeepSeek 边界：
   - 环境变量建议：`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`。
   - 默认 base URL：`https://api.deepseek.com`。
   - 后续可通过 OpenAI 兼容 Chat Completions 格式接入。

## Acceptance criteria

- 提问 “AIOS 支持哪些能力？” 返回基于 “AIOS 平台介绍” 的回答。
- 回答下方引用来源只包含命中的资产。
- Trace 展示 query、retrieved assets、scores、final answer。
- 无命中问题返回明确的低置信或无依据回答。
- 无 DeepSeek key 时功能仍完整可用。

## Verification

- 手动调用 `/api/ask` 测试常见问题和无命中问题。
- 检查回答是否引用检索结果，而不是自由编造。
- 检查 Trace 是否与检索结果一致。
- 运行 `npm run lint`。

## Risks

- Mock 回答的语言质量有限，需要 README 说明其定位是演示 RAG 链路。
- DeepSeek 只预留边界，不能作为本阶段验收的真实能力。

## Implementation result

待完成后补充。
