# 阶段 02：知识资产数据与 API

## 目标

建立知识资产的本地 JSON 存储和基础 API，让资产列表与新增资产形成可演示闭环。

## 开发内容

- 定义 `KnowledgeAsset`、`CreateKnowledgeAssetInput` 和 API 响应类型。
- 新增 `data/knowledge-assets.json`，内置 3 条初始知识资产。
- 新增资产存储封装，集中处理 JSON 读取、schema 校验、新增写入和输入清洗。
- 新增 `GET /api/assets` 和 `POST /api/assets`。
- 新增 `ASSETMIND_ASSETS_FILE_NAME` 测试覆盖点，便于用临时 JSON 文件做 API 验证。

## 阶段结果

- 资产列表可读取。
- 资产可通过 API 新增并持久化到本地 JSON。
- title 和 content 必填校验已在服务端实现。
- tags 支持逗号分隔字符串或数组输入。

## 验证

- `GET /api/assets` 返回初始资产。
- `POST /api/assets` 可新增资产。
- 新增后再次读取可以看到新资产。
- `npm run lint` 和 `npm run build` 通过。

## 风险记录

- 本地 JSON 写入不处理高并发冲突，只适合本地演示。
- Serverless 或无持久文件系统部署不适合当前存储方案。
