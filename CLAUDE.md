# CLAUDE.md —— vidspark-ui

> 项目说明书 / AI 协作约定。AI 编程助手进入本目录时应读取本文件并严格遵循。

## 项目简介
- 名称：vidspark-ui
- 定位：视频分享网站前端模拟器（纯前端，数据用 localStorage 持久化）。另含单文件离线版 `vidspark-standalone.html`（无需构建，浏览器直接打开）。
- 运行：`npm install` 后 `npm run dev`（Vite 开发服务器）。
- 部署：`npm run deploy`（推 `dist/` 到 GitHub Pages 的 `gh-pages` 分支，见 `scripts/deploy.mjs`）。

## 技术栈
- 框架/语言：React 19.2 + TypeScript ~6.0（严格模式）
- 构建：Vite 8（`@vitejs/plugin-react`）
- 样式：Tailwind CSS v4（`@tailwindcss/vite`），CSS 变量主题（neutral）
- UI 组件：shadcn/ui 风格（组件多为手写，非安装 `@/components/ui`）；图标用 lucide
- 动效：GSAP；OGL（WebGL，用于 EvilEye 灵眼背景）
- 包管理：npm
- 测试：暂未引入

## 目录约定（src/）
```
src/
├─ main.tsx             入口
├─ App.tsx              根：Provider 组合 + 自实现路由 + 全局布局
├─ pages/               页面（HomePage, PopularPage, CategoriesPage, UploadPage,
│                       FeedPage, ProfilePage, SettingsPage, VideoDetailPage）
├─ hooks/               业务状态（useAccount/useInteractions/useLibrary/useSocial/useTheme，均为 Context）
├─ components/          复用 UI（VideoCard, BubbleMenu, EvilEye, AccountGate...）
├─ lib/                 工具与持久化（db.ts 封装 localStorage, utils, accountKeys, backup, cover）
├─ data/                mock.ts 模拟视频数据
└─ ogl.d.ts             类型声明
```
- 依赖方向：`pages → hooks → lib`（单向，禁止反向依赖与循环依赖）。
- 路径别名：`@/` → `src/`（`vite.config.ts` 与 `tsconfig` 一致）。**所有导入统一用 `@/...`，禁止 `../../` 相对路径。**
- 建议在 `src/types/index.ts` 集中管理跨模块共享类型（如视频、用户、互动）；目前类型较分散，新增共享结构请放 types 层。

## 命令
- 开发：`npm run dev`
- 构建（含类型检查）：`npm run build` → `tsc -b && vite build`
- 静态检查：`npm run lint` → `oxlint`（配置见 `.oxlintrc.json`：强制 `react/rules-of-hooks: error`）
- 预览：`npm run preview`
- 部署：`npm run deploy`

## 编码约定（AI 必须遵守）
- TypeScript 严格模式（`tsconfig.app.json`：开启 `noUnusedLocals`、`verbatimModuleSyntax`、`erasableSyntaxOnly` 等）。**禁止 `any`**；确需宽松用 `unknown` + 类型守卫。未使用的变量/参数会直接报错。
- 命名：组件 PascalCase；hooks `useXxx`；工具函数 camelCase；文件名与导出名一致。
- 单个文件控制在 400 行以内；超大文件先拆分再改。
- 纯函数优先；副作用（localStorage、hash 路由、动画）集中在 `lib/` 与 `App.tsx` 边界。
- 持久化统一走 `lib/db.ts` 的 `saveJSON` 模式，按账号隔离键（`lib/accountKeys`）。
- 改动完成后必须通过 `npm run build` 与 `npm run lint` 才算完成。

## 禁区（AI 不得做的事）
- 禁止引入新的 npm 依赖，除非你显式同意（当前依赖已锁定，见 package.json）。
- 禁止修改 `App.tsx` 中自实现的路由逻辑（`type View` + `go()/play()` + hash 路由 `#/v/<id>`）；本项目**不使用 react-router**，不要引入它。
- 禁止把任何 API Token / 密钥写入前端代码。如需接入 Coze 等工作流，调用走独立的 `coze-proxy/` 后端代理，前端只调本地 `/api/coze/run`。
- 禁止用 `any` 绕过类型检查。

## 给 AI 的协作提示
- 改代码前先复述你的理解，确认范围（哪个文件、哪些模式）再动手。
- 改动尽量小、可独立验证；大改动先拆成多步（加类型 → 加函数 → 接 UI）。
- 善用现有模式：状态走 Context（参考 `hooks/useInteractions.tsx`），持久化走 `lib/db.ts`，UI 复用 `components/`。
- 生成后自检：跑 `npm run build` 与 `npm run lint`，并说明结果；如失败，先修再交付。
