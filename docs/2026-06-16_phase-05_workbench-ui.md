# Phase 05 - 工作台 UI 与交互打磨

## Goal

把 API 和业务能力组织成一个清晰、克制、有质感的 RAG 工作台，突出检索链路和 Agent Trace 可观测性。

## Scope

- 实现三栏工作台信息架构。
- 实现资产列表、新增资产、提问、答案、引用、检索结果、Trace 面板。
- 覆盖 loading、empty、error、no result、新增成功等状态。
- 做响应式适配，保证桌面为主、窄屏可用。

## Non-goals

- 不做营销落地页。
- 不做复杂动画和视觉噱头。
- 不引入重型 UI 框架。
- 不实现资产编辑、删除、批量操作。

## Deliverables

- 工作台主组件。
- 资产列表组件。
- 新增资产面板。
- 提问与回答组件。
- 引用来源组件。
- 检索结果组件。
- Agent Trace 组件。

## Implementation tasks

1. 三栏布局：
   - 左侧：资产列表、标签、资产数量、添加入口。
   - 中间：问题输入、回答区域、引用来源、检索结果。
   - 右侧：Trace 时间线、评分明细、Provider 状态。
2. 新增资产：
   - 使用抽屉或固定侧面板。
   - 字段：Title、Content、Tags。
   - 提交后刷新列表，保留当前工作台上下文。
3. 提问体验：
   - 支持 Enter 或按钮提交。
   - loading 时禁用重复提交。
   - 显示最近一次问题、答案和引用。
4. Trace 展示：
   - 按步骤展示名称、状态、摘要、耗时或分数。
   - 检索结果和引用能互相对应。
5. 视觉打磨：
   - 使用中性色背景、清晰边框、少量强调色。
   - 卡片圆角控制在 8px 左右。
   - 按钮和输入状态完整。
   - 文案简洁，避免解释性大段说明占据界面。

## Acceptance criteria

- 首屏就是可操作工作台，不是介绍页。
- 资产列表、提问区、Trace 区层级清晰。
- 新增资产成功后 UI 有反馈并更新列表。
- 提问 loading、成功、无命中、错误状态都可见。
- 引用来源能看出答案依据。
- 页面在常见桌面宽度下无重叠和明显溢出。

## Verification

- 启动开发服务进行浏览器手动验收。
- 测试新增资产、搜索、提问、无命中和错误状态。
- 检查桌面和较窄宽度布局。
- 运行 `npm run lint`。

## Risks

- UI 过度追求视觉可能稀释题目重点，应优先保证工作台效率和信息可读性。
- Trace 信息过多会干扰主任务，需要控制层级和默认密度。

## Implementation result

已完成。

- 新增 `components/workbench.tsx`，将静态首页替换为可操作的三栏 RAG 工作台。
- 左侧资产区展示资产数量、标签、资产列表，并提供新增资产入口。
- 新增资产使用右侧抽屉面板，提交后调用 `POST /api/assets`，成功后立即更新本地列表。
- 中间区域实现 Agent 提问、答案展示、引用来源、检索结果展示和独立搜索。
- 右侧区域实现 Agent Trace，展示 query、步骤时间线、provider mode 和 scores。
- 覆盖 loading、empty、error、no result、新增成功等状态。
- 响应式布局采用桌面三栏、窄屏纵向堆叠。

验证结果：

- `npm run lint` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。
- 使用测试 JSON 文件启动 dev server，首页返回 200。
- UI 依赖链路验证通过：新增资产后资产数从 3 变为 4，搜索 “UI 阶段验证” 顶部命中新资产。
- 提问 “AIOS 支持哪些能力？” 返回引用 “AIOS 平台介绍”，Trace 包含 `query-normalization`、`retrieval`、`scoring`、`mock-answer-generation`、`final-answer`。
- 验证过程未污染正式 `data/knowledge-assets.json`。

自我审查：

- 阶段边界符合 Phase 05：聚焦 UI 和交互，没有新增后端能力、资产编辑删除、真实 DeepSeek 或复杂状态管理。
- 首屏是可操作工作台，不是营销页；视觉保持企业工作台风格，避免过度装饰。
- Trace 信息密度可控，但真实浏览器视觉验收仍建议由用户打开本地页面确认。
