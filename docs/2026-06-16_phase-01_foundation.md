# Phase 01 - 工程骨架与基础设计系统

## Goal

建立 AssetMind Workbench 的最小可运行工程骨架，为后续 API、检索、Agent 和 UI 打磨提供稳定基础。

## Scope

- 初始化 Next.js App Router 工程。
- 配置 TypeScript、Tailwind CSS、ESLint 和基础 npm scripts。
- 建立全局样式、页面入口和基础布局壳。
- 定义初版视觉方向：克制、企业级、信息密度适中。

## Non-goals

- 不实现知识资产 CRUD。
- 不实现检索和 Agent 问答。
- 不接入 shadcn/ui 的完整组件体系，除非后续阶段确认需要。

## Deliverables

- `package.json`、`tsconfig.json`、`next.config.*`、Tailwind/PostCSS 配置。
- `app/layout.tsx`、`app/page.tsx`、`app/globals.css`。
- 基础工作台框架：顶部产品标识、主内容区域、占位状态。

## Implementation tasks

1. 创建 Next.js + React + TypeScript 项目结构。
2. 配置 Tailwind CSS 主题变量，包括背景、边框、文本、强调色和状态色。
3. 实现基础页面壳，先展示静态工作台布局占位。
4. 确保字体、间距、圆角、边框和阴影规则统一。
5. 添加 `npm run dev`、`npm run lint`、`npm run build` 脚本。

## Acceptance criteria

- `npm install` 后可运行 `npm run dev`。
- 首页可以打开，并显示 AssetMind Workbench 的基础工作台框架。
- Tailwind 样式正确生效。
- `npm run lint` 可执行。

## Verification

- 运行 `npm run lint`。
- 启动开发服务，浏览器打开首页。
- 检查页面在桌面宽度下无明显布局溢出。

## Risks

- 如果 Next.js 或 Tailwind 版本变化导致配置差异，需要以安装后的官方模板为准。
- 当前目录不是 Git 仓库，阶段变更无法通过 Git diff 审查。

## Implementation result

已完成。

- 新增 Next.js 16 App Router 工程骨架，包含 TypeScript、ESLint、Tailwind 4、PostCSS 和基础 npm scripts。
- 新增 `app/layout.tsx`、`app/page.tsx`、`app/globals.css`，实现静态三栏工作台基础壳。
- 视觉方向采用克制的企业工作台风格：纸色背景、细边框、中性色文本和少量绿色信号色。
- `npm install` 已生成 `package-lock.json`；安装后 npm audit 报告 2 个 moderate 漏洞，未执行破坏性自动升级。
- `npm run lint` 通过。
- `npm run build` 通过；Next.js 自动补充了 `tsconfig.json` 的 `.next/dev/types/**/*.ts` include，保留该框架建议配置。

自我审查：

- 阶段边界符合 Phase 01：只实现工程骨架和静态页面壳，没有提前实现资产 CRUD、检索或 Agent 问答。
- UI 没有做营销首页，首屏是工作台结构，符合后续产品方向。
- 当前风险是依赖版本较新，后续阶段如遇 Next 16/Tailwind 4 配置差异，应优先以实际构建结果为准。
