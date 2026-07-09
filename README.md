# VidSpark · 视频分享平台（前端模拟器）

一个基于 React 19 + Vite 8 + TypeScript + Tailwind CSS v4 的视频网站前端模拟器。无需后端，所有数据通过 `localStorage` 持久化，开箱即用。

> 本项目为「前端模拟器」：上传的视频、点赞/收藏/投币等互动数据均保存在浏览器本地，刷新不丢失，但仅在当前浏览器内有效。

## ✨ 功能特性

- 🏠 **首页** — 推荐视频流，WebGL 互动「灵眼」背景（react-bits EvilEye）
- 🔥 **热门** — 按播放量排序的热门榜单
- 🗂️ **分区** — 多分类浏览，支持顶部搜索与搜索历史
- ⬆️ **上传** — 选择本地视频文件，自动读取时长并生成封面
- 📺 **动态 / 详情页** — 播放器、弹幕、评论、键盘快捷键（空格播放/暂停、←→ 快退快进、F 全屏、M 静音）
- 💬 **互动** — 点赞 / 收藏 / 投币 / 关注，全局状态 + 本地持久化
- 🫧 **BubbleMenu** — GSAP 动效悬浮导航菜单（react-bits BubbleMenu）
- 📱 **移动端适配** — 底部导航栏，响应式布局
- 🔍 **搜索** — 全局搜索，支持标题 / 作者 / 标签匹配与历史记录
- 👤 **我的 / 本地账号** — 可自定义昵称与头像，投稿、评论、互动均以该身份呈现
- 📰 **动态** — 根据你的关注、投稿与互动（点赞 / 投币 / 收藏）实时生成时间线

## 🛠 技术栈

| 类别 | 选型 |
| --- | --- |
| 构建 | [Vite 8](https://vitejs.dev) |
| 框架 | [React 19](https://react.dev) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 + `@tailwindcss/vite` |
| UI | shadcn/ui（base-nova 主题预设） |
| 动效组件 | react-bits：`EvilEye`、`BubbleMenu` |
| 状态/持久化 | React Context + `localStorage` |

## 🚀 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

> 开发服务器默认地址：http://localhost:5173

## 📦 构建与发布

- `npm run build` 产物输出至 `dist/`（已加入 `.gitignore`）。
- 纯前端，可托管于任意静态服务器（GitHub Pages、CloudStudio、Vercel、Netlify 等）。
- 另提供单文件离线版 `vidspark-standalone.html`，无需构建即可在浏览器直接打开。

### 一键部署到 GitHub Pages

```bash
# 设置仅含 repo 权限的 PAT（部署完可在 GitHub 后台撤销）
export GITHUB_TOKEN=ghp_xxx        # PowerShell: $env:GITHUB_TOKEN="ghp_xxx"

# 构建并推送到 gh-pages 分支（自动启用 GitHub Pages）
npm run deploy
```

脚本 `scripts/deploy.mjs` 会自动：`npm run build` → 将 `dist/` 推送到 `gh-pages` 分支。
默认仓库为 `Floconsdeneige/VidSpark`，可用环境变量 `GITHUB_REPO` 覆盖。
部署后访问 `https://<owner>.github.io/<repo>/`。

## 📁 目录结构

```
src/
├─ App.tsx                 # 状态路由 + 全局布局
├─ components/
│  ├─ EvilEye.tsx          # WebGL 灵眼背景
│  ├─ BubbleMenu.tsx       # GSAP 悬浮菜单
│  └─ VideoCard.tsx        # 视频卡片
├─ pages/                  # 首页/热门/分区/上传/动态/详情
├─ hooks/
│  └─ useInteractions.tsx  # 全局互动状态 + 持久化
├─ data/
│  └─ mock.ts              # 模拟视频数据
└─ ...
```

## 📝 说明

- 项目仅做前端演示，不含真实后端与用户系统。
- 所有用户产生的数据保存在浏览器 `localStorage`，清除浏览器数据即清空。
- 如需接入真实后端，可替换 `src/data/mock.ts` 中的数据源与 `useInteractions` 的持久化逻辑。

---

© VidSpark 前端模拟器 · 仅供学习演示
