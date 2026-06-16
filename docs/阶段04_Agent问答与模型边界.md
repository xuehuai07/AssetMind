# 阶段 04：Agent 问答与模型边界

## 目标

基于检索结果生成可解释的 Agent 回答，并预留后续接入真实大模型的边界。

## 开发内容

- 定义 `Citation`、`AgentTrace`、`AskResponse`、`AnswerProvider` 等类型。
- 实现 Mock Answer Provider。
- 新增 `POST /api/ask`，串联资产读取、检索、回答、引用和 Trace。
- Trace 展示系统步骤和可观测元数据，不暴露模型内部推理。
- 预留 DeepSeek Provider 接入边界。

## 阶段结果

- 提问 “AIOS 支持哪些能力？” 可以返回基于资料的回答。
- 回答引用只来自实际命中的资产。
- 无命中问题返回明确无依据提示。
- 无真实模型 Key 时系统仍可完整演示 RAG 闭环。

## 验证

- 常见问题和无命中问题均通过 `/api/ask` 验证。
- Trace 的 final answer 与顶层 answer 一致。
- 空 question 返回 400。
- `npm run lint` 和 `npm run build` 通过。

## 风险记录

- Mock 回答语言质量有限，只用于展示链路。
- 后续接入真实模型时必须保留引用和证据约束。
