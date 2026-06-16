# Phase 02 - 知识资产数据层与 API

## Goal

建立知识资产的本地 JSON 存储和基础 API，让资产列表与新增资产形成可演示闭环。

## Scope

- 定义知识资产类型和 API 响应类型。
- 新增本地 JSON 数据文件，内置题目要求的 3 条资产。
- 实现资产读取和新增 API。
- 实现服务端输入校验和错误响应。

## Non-goals

- 不实现编辑、删除、批量导入和文件上传。
- 不实现数据库迁移、并发锁和生产级事务。
- 不实现前端完整工作台，只保留必要联调能力。

## Deliverables

- `types` 中的 `KnowledgeAsset` 等共享类型。
- `data/knowledge-assets.json` 初始数据。
- `lib/assets-store` 一类的数据读写封装。
- `GET /api/assets` 和 `POST /api/assets`。

## Implementation tasks

1. 定义 `KnowledgeAsset`：
   - `id: string`
   - `title: string`
   - `content: string`
   - `tags: string[]`
   - `createdAt: string`
2. 写入 3 条初始资产：
   - AIOS 平台介绍
   - 数字资产知识库
   - Agent 工作流
3. 封装 JSON 文件读写：
   - 读取时返回数组。
   - 文件缺失或 JSON 损坏时返回明确错误。
   - 新增时生成 id 和 ISO 时间。
4. 实现 API 校验：
   - title 必填。
   - content 必填。
   - tags 支持逗号分隔字符串或数组输入，服务端统一清洗为空格去重后的数组。
5. API 返回结构保持简单一致：
   - 成功：`{ data: ... }`
   - 失败：`{ error: string }`

## Acceptance criteria

- `GET /api/assets` 返回 3 条初始资产。
- `POST /api/assets` 可新增资产。
- 新增后再次 `GET /api/assets` 能看到新资产。
- 刷新页面或重启 dev server 后新增资产仍在 JSON 文件中。
- 非法输入返回 400 和可读错误信息。

## Verification

- 使用浏览器或 PowerShell 调用 `GET /api/assets`。
- 使用 PowerShell 调用 `POST /api/assets` 新增一条测试资产。
- 检查 `data/knowledge-assets.json` 被正确更新。
- 运行 `npm run lint`。

## Risks

- 本地 JSON 写入不处理高并发写冲突，只适合本地演示。
- API Route 在部分部署平台没有持久可写文件系统，README 需要明确限制。

## Implementation result

待完成后补充。
