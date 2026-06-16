# AssetMind 智能资料库

AssetMind 是一个面向中国用户的本地演示型知识资产问答工作台。它支持上传参考资料、检索资料库、输入 DeepSeek API Key 启用真实 AI 回答，并在资料不足时严格拒绝编造。

## 功能概览

- 中文工作台：首页采用清爽的问答入口，模型设置、上传资料、资料库和手动补充收纳在左侧工具按钮中。
- 参考资料上传：支持 `.txt`、`.md`、`.pdf`、`.docx`，单文件上限 10MB。
- 本地资料库：上传或手动录入的资料写入 `data/knowledge-assets.json`。
- DeepSeek 会话 Key：用户在前端输入 Key，验证后启用，Key 只保存在当前页面内存中。
- 严格 RAG 门禁：无相关资料或相关度不足时，不调用大模型，直接提示“资料库没有足够依据”。
- 引用和 Trace：回答后可展开“证据检索”，查看引用资料、检索结果和运行轨迹。
- 液态玻璃 UI：参考 Gemini 的简洁首页结构，叠加半透明面板、模糊、高光边缘和克制动效。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Next API Route
- 本地 JSON 文件存储
- DeepSeek OpenAI 兼容接口
- `pdf-parse`、`mammoth` 用于资料文本提取

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

## 主要流程

1. 上传或录入参考资料。
2. 在“模型设置”输入 DeepSeek API Key。
3. 点击“验证并启用”。
4. 在“智能问答”提问。
5. 查看回答、引用依据、证据检索和运行轨迹。

如果资料库没有相关依据，系统会直接拒绝回答，不会调用 DeepSeek，也不会基于常识补全。

## API

- `GET /api/assets`: 获取知识资产列表。
- `POST /api/assets`: 手动新增知识资产。
- `POST /api/assets/upload`: 上传参考资料并写入资料库。
- `POST /api/search`: 检索 top 3 相关资料。
- `POST /api/llm/validate`: 验证 DeepSeek API Key。
- `POST /api/ask`: 基于资料库问答，可携带当前会话中的 DeepSeek Key。

## 数据结构

```ts
type KnowledgeAsset = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  source?: {
    type: "manual" | "upload";
    fileName?: string;
    mimeType?: string;
    size?: number;
  };
};
```

旧数据不需要迁移，`source` 是可选字段。

## DeepSeek Key 安全说明

- Key 不写入 `localStorage`。
- Key 不写入本地 JSON。
- Key 不写入环境变量或日志。
- 刷新页面后 Key 会丢失，需要重新输入。
- 服务端只在验证和问答请求中临时使用 Key 转发到 DeepSeek。

默认模型是 `deepseek-v4-flash`，也可以选择 `deepseek-v4-pro`。

## 上传资料限制

- 支持：`.txt`、`.md`、`.pdf`、`.docx`
- 单文件上限：10MB
- 扫描版 PDF 或图片型文档无法提取有效文本，需要先 OCR。
- 当前上传文件会转成单条知识资产，不做 chunking 或向量化。

## 生产化限制

- 本地 JSON 不适合高并发、Serverless 无持久文件系统或生产审计场景。
- 关键词检索不是语义检索，召回能力有限。
- 未实现权限、登录、多租户、审计、数据脱敏和版本管理。
- 用户 Key 由浏览器提交到本地服务端转发，生产环境应改为更完整的密钥托管和权限模型。

## 后续迭代

1. 引入 chunking、embedding 和向量数据库。
2. 增加权限过滤、多租户隔离和审计日志。
3. 支持批量上传、上传进度和 OCR。
4. 增加流式回答和反馈闭环。
5. 增加端到端测试和更完整的错误监控。

## 文档入口

- `docs/知识资产智能体笔试题.md`: 原始题目需求。
- `docs/AssetMind工作台总体设计.md`: 初始总体设计文档。
- `docs/AssetMind中国化RAG升级设计.md`: 本次中国化、上传、DeepSeek 和 UI 升级设计文档。
- `docs/阶段01_工程基础与设计系统.md` 到 `docs/阶段06_交付验证与文档.md`: 六个阶段的开发历程。

## 已知风险

`npm audit` 当前报告 2 个 moderate 级别漏洞。自动修复可能触发依赖版本大幅调整，本次没有使用 `npm audit fix --force`。
