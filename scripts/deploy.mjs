// 一键部署 VidSpark 到 GitHub Pages（gh-pages 分支）
// 用法：
//   GITHUB_TOKEN=ghp_xxx npm run deploy            (macOS / Linux)
//   $env:GITHUB_TOKEN="ghp_xxx"; npm run deploy    (PowerShell)
// 可选环境变量 GITHUB_REPO 指定仓库（默认 Floconsdeneige/VidSpark）
// 说明：token 仅用于本次 git push，不会写入任何文件；建议用仅含 repo 权限的 PAT，
//       部署完成后在 GitHub 后台撤销该 token。

import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync, cpSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const REPO = process.env.GITHUB_REPO || 'Floconsdeneige/VidSpark'
const TOKEN = process.env.GITHUB_TOKEN

if (!TOKEN) {
  console.error('❌ 缺少 GITHUB_TOKEN 环境变量。')
  console.error('   Linux/macOS:  export GITHUB_TOKEN=ghp_xxx')
  console.error('   PowerShell:    $env:GITHUB_TOKEN="ghp_xxx"')
  process.exit(1)
}

const ROOT = process.cwd()
const DIST = join(ROOT, 'dist')

if (!existsSync(DIST)) {
  console.log('🔨 未找到 dist/，先构建…')
  execSync('npm run build', { stdio: 'inherit' })
}

// 在项目内 staging 目录打包（避免 Windows %TEMP% 的 cpSync EIO 权限问题）
const tmp = mkdtempSync(join(ROOT, '.deploy-'))
try {
  // 复制 dist 内容到临时目录根（GitHub Pages 以分支根发布）
  for (const f of readdirSync(DIST, { withFileTypes: true })) {
    cpSync(join(DIST, f.name), join(tmp, f.name), { recursive: true })
  }

  const run = (cmd) => execSync(cmd, { cwd: tmp, stdio: 'inherit' })
  run('git init -q')
  run('git checkout -q -b gh-pages')
  run('git add -A')
  run(
    `git -c user.name="VidSpark Deploy" -c user.email="deploy@vidspark.local" commit -qm "deploy: ${new Date().toISOString()}"`,
  )
  const url = `https://${TOKEN}@github.com/${REPO}.git`
  run(`git push --force ${url} HEAD:gh-pages`)

  const [owner, name] = REPO.split('/')
  console.log('\n✅ 已部署到 GitHub Pages')
  console.log(`🌐 https://${owner.toLowerCase()}.github.io/${name}/`)
  console.log('   （CloudStudio 预览请在本对话中用部署工具重新发布）')
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
