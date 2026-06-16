# AssetMind 中国化 RAG 工作台升级设计

## Goal

将 AssetMind Workbench 从本地 Mock 演示升级为更适合中国用户使用的知识资产问答工作台，支持用户上传参考资料、输入 DeepSeek API Key 启用真实 AI 回答，并通过严格 RAG 门禁避免无依据编造。

## Scope

- 页面主要操作路径中文化。
- 使用 Apple 风格液态玻璃视觉语言优化整体 UI/UX。
- 支持上传 `.txt`、`.md`、`.pdf`、`.docx` 参考资料，单文件上限 10MB。
- 上传资料解析为知识资产并写入本地 JSON。
- 前端支持用户输入 DeepSeek API Key，验证成功后在当前浏览器会话中启用。
- 问答链路保留引用、检索结果和 Agent Trace。
- 无相关资料或相关度不足时严格返回无依据提示，不调用模型。
- 清理重复阶段文档，保留核心文档。

## Non-goals

- 不实现登录、权限、多租户、审计和生产级密钥托管。
- 不实现向量数据库、embedding、chunking 或批量上传队列。
- 不把用户 API Key 写入 localStorage、服务端文件、环境变量或日志。
- 不支持通用 OpenAI Base URL 配置，本阶段只接入 DeepSeek。
- 不实现流式输出和多轮长期记忆。

## Impact

- 扩展知识资产数据结构，新增来源元数据字段。
- 新增上传 API、资料解析模块、DeepSeek 验证 API 和真实模型 Provider。
- 扩展问答 API 请求体，允许携带当前会话中的 DeepSeek Key 和模型名。
- 大幅重构工作台 UI 组件和样式系统。
- 删除重复阶段文档，README 需要同步更新。

## Implementation plan

1. 文档和依赖
   - 新增本设计文档。
   - 安装 PDF 和 DOCX 文本提取依赖。

2. 数据与上传
   - 扩展 `KnowledgeAsset`，增加可选 `source` 元数据。
   - 新增上传解析模块，按扩展名和 MIME 类型校验文件。
   - 新增 `POST /api/assets/upload`，将解析文本写入本地 JSON。

3. DeepSeek 与严格回答
   - 新增 DeepSeek 常量、Key 验证和 Chat Completion 调用。
   - 更新 Agent Provider：无 Key 时使用 Mock，有 Key 且证据充分时调用 DeepSeek。
   - 设置最低证据分数门槛，门槛不满足时不调用模型。
   - Trace 只展示安全元数据，不展示 Key 或完整 Prompt。

4. 前端体验
   - 重构工作台为中文信息架构。
   - 增加模型设置、资料上传、资料库、智能问答、证据链和运行轨迹面板。
   - 使用液态玻璃视觉：半透明面板、模糊、边缘高光、柔和层次和轻量交互。

5. 文档和清理
   - 更新 README。
   - 删除重复阶段文档，保留核心说明和本设计文档。
   - 运行 lint、build、diff check。

## Files and modules involved

- `app/api/assets/upload/route.ts`
- `app/api/llm/validate/route.ts`
- `app/api/ask/route.ts`
- `components/workbench.tsx`
- `lib/assets-store.ts`
- `lib/document-parser.ts`
- `lib/deepseek.ts`
- `lib/agent.ts`
- `types/assets.ts`
- `types/agent.ts`
- `app/globals.css`
- `README.md`

## Risks

- PDF 和 DOCX 解析质量受文件内容影响，扫描版 PDF 无法提取有效文本。
- 用户 Key 经服务端转发到 DeepSeek，但不持久化；仍需提醒用户在可信环境中使用。
- 本地 JSON 存储不适合高并发和生产部署。
- 液态玻璃效果依赖 `backdrop-filter`，低端设备或旧浏览器可能退化为半透明面板。

## Rollback plan

- 移除新增上传、DeepSeek 和 UI 重构相关文件。
- 恢复旧版 `KnowledgeAsset` 类型、Agent Mock 逻辑和工作台组件。
- 从 `package.json` 和 `package-lock.json` 移除解析依赖。
- 恢复被删除的阶段文档。

## Verification

- `npm run lint`
- `npm run build`
- `git diff --check`
- 手工验证上传 `.txt`、`.md`、`.pdf`、`.docx`。
- 手工验证 Key 成功和失败状态。
- 手工验证无证据问题不会调用模型并返回严格提示。
- 手工验证中文 UI 在桌面和移动端无明显重叠。

## Acceptance criteria

- 用户可以在中文界面中上传参考资料并立即用于检索和问答。
- 用户输入 DeepSeek Key 验证成功后，可以基于已有资料得到 AI 回答。
- 没有相关参考资料时，系统明确拒绝编造。
- Key 不被持久化。
- UI 比原版更清晰、现代，并具备液态玻璃视觉特征。
- 工程文件更清爽，重复阶段文档已清理。

## Implementation result

已完成本次升级。

- 完成中文化液态玻璃工作台，覆盖资料库、上传资料、模型设置、智能问答、证据检索、运行轨迹和手动补充资料。
- 根据二次体验反馈，将首页改为 Gemini 风格的清爽问答入口，模型设置、上传资料、资料库和手动补充改为工具按钮打开。
- 证据检索改为回答后的可展开选项，默认不占据首页空间。
- docs 文件已改为中文文件名，并恢复六个阶段开发历程文档。
- 完成 `.txt`、`.md`、`.pdf`、`.docx` 上传解析，上传内容会写入本地 JSON，并记录来源文件元数据。
- 完成 DeepSeek Key 验证接口和真实问答 Provider，默认模型为 `deepseek-v4-flash`，支持切换 `deepseek-v4-pro`。
- 完成严格 RAG 证据门禁，无相关资料或相关度不足时不调用大模型，并明确拒绝编造。
- 完成 README 更新和重复阶段文档清理。
- 验证通过：`npm run lint`、`npm run build`、`git diff --check`，以及基于临时测试数据文件的 API smoke test。
- 未使用真实 DeepSeek Key 测试成功调用；Key 验证和真实模型调用需要用户提供有效 Key 后手工验证。
