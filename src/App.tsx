import { useState, useEffect } from 'react'
import BubbleMenu from '@/components/BubbleMenu'
import HomePage from '@/pages/HomePage'
import PopularPage from '@/pages/PopularPage'
import CategoriesPage from '@/pages/CategoriesPage'
import UploadPage from '@/pages/UploadPage'
import FeedPage from '@/pages/FeedPage'
import ProfilePage from '@/pages/ProfilePage'
import SettingsPage from '@/pages/SettingsPage'
import VideoDetailPage from '@/pages/VideoDetailPage'
import { AccountProvider, useAccount } from '@/hooks/useAccount'
import AccountGate from '@/components/AccountGate'
import { InteractionsProvider } from '@/hooks/useInteractions'
import { LibraryProvider, useLibrary } from '@/hooks/useLibrary'
import { ThemeProvider, useTheme } from '@/hooks/useTheme'
import { videos as baseVideos, type Video } from '@/data/mock'

type View = 'home' | 'popular' | 'categories' | 'upload' | 'feed' | 'profile' | 'settings' | 'detail'

const tabs: { key: View; label: string }[] = [
  { key: 'home', label: '首页' },
  { key: 'popular', label: '热门' },
  { key: 'categories', label: '分区' },
  { key: 'upload', label: '上传' },
  { key: 'feed', label: '动态' },
  { key: 'profile', label: '我的' },
  { key: 'settings', label: '设置' },
]

const navColor: Record<View, string> = {
  home: '#ff4d4d',
  popular: '#ff8a00',
  categories: '#8b5cf6',
  upload: '#10b981',
  feed: '#3b82f6',
  profile: '#ec4899',
  settings: '#64748b',
  detail: '#ff4d4d',
}

const navIcon: Record<string, string> = {
  home: '🏠',
  popular: '🔥',
  categories: '📂',
  upload: '📤',
  feed: '📡',
  profile: '👤',
  settings: '⚙️',
  detail: '▶️',
}

function Shell() {
  const { userVideos, addUpload } = useLibrary()
  const { theme, toggleTheme } = useTheme()
  const [view, setView] = useState<View>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailVideo, setDetailVideo] = useState<Video | null>(null)

  // 全站视频 = 用户上传(置顶) + 默认库
  const allVideos: Video[] = [...userVideos, ...baseVideos]

  const go = (v: View, query = '') => {
    if (query) setSearchQuery(query)
    setView(v)
    // 离开详情时清理分享用的 hash，避免地址栏残留失效链接
    if (v !== 'detail' && location.hash) {
      window.history.replaceState(null, '', location.pathname + location.search)
    }
    window.scrollTo({ top: 0 })
  }

  const play = (v: Video) => {
    setDetailVideo(v)
    setView('detail')
    // 写入可分享的 hash 链接（replaceState 不产生额外历史记录）
    window.history.replaceState(null, '', `#/v/${v.id}`)
    window.scrollTo({ top: 0 })
  }

  // 分享链接直达：解析 #/v/<id> 打开对应视频；支持外部粘贴/刷新后直达
  useEffect(() => {
    const sync = () => {
      const m = location.hash.match(/^#\/v\/(\d+)$/)
      if (!m) return
      const id = Number(m[1])
      const v = allVideos.find((x) => x.id === id)
      if (v) {
        setDetailVideo(v)
        setView('detail')
        window.scrollTo({ top: 0 })
      }
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [allVideos])

  const navItems = tabs
    .filter((t) => t.key !== 'detail')
    .map((t) => ({
      label: t.label,
      href: '#',
      ariaLabel: t.label,
      rotation: t.key === 'home' || t.key === 'upload' ? -8 : 8,
      hoverStyles: { bgColor: navColor[t.key], textColor: '#ffffff' },
      onClick: () => go(t.key),
    }))

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
        <button
          onClick={() => go('home')}
          className="flex items-center gap-2 text-xl font-bold"
        >
          <span className="text-red-500">●</span> VidSpark
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {tabs
            .filter((t) => t.key !== 'detail')
            .map((t) => (
              <button
                key={t.key}
                onClick={() => go(t.key)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  view === t.key
                    ? 'bg-red-600 text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
        </nav>

        <form
          className="flex flex-1 max-w-xl items-center gap-2 rounded-full border border-border bg-card px-4 py-2"
          onSubmit={(e) => {
            e.preventDefault()
            const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
            go('categories', q)
          }}
        >
          <input
            name="q"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜视频 / UP主 / 分区 / 标签 / 简介…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="text-muted-foreground">🔍</span>
        </form>

        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? '切换到亮色' : '切换到暗色'}
          className="rounded-full border border-border bg-card px-3 py-2 text-sm transition hover:bg-background"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <button
          onClick={() => go('upload')}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
        >
          上传
        </button>
      </header>

      {/* 页面路由 */}
      {view === 'home' && <HomePage userVideos={userVideos} allVideos={allVideos} onPlay={play} />}
      {view === 'popular' && <PopularPage allVideos={allVideos} onPlay={play} />}
      {view === 'categories' && (
        // key 绑定 searchQuery：从顶部搜索框在分区页内提交时，强制重建页面以刷新结果
        <CategoriesPage key={searchQuery} initialQuery={searchQuery} allVideos={allVideos} onPlay={play} />
      )}
      {view === 'upload' && (
        <UploadPage
          onPublish={addUpload}
          onGoHome={() => go('home')}
          onPlay={play}
        />
      )}
      {view === 'feed' && <FeedPage allVideos={allVideos} userUploads={userVideos} onPlay={play} />}
      {view === 'profile' && <ProfilePage allVideos={allVideos} onPlay={play} onGoHome={() => go('home')} onBack={() => go('home')} />}
      {view === 'settings' && <SettingsPage onBack={() => go('home')} />}
      {view === 'detail' && detailVideo && (
        // key 绑定视频 id：从相关推荐点另一视频时，重建页面以重置播放/评论状态
        <VideoDetailPage key={detailVideo.id} video={detailVideo} allVideos={allVideos} onBack={() => go('home')} onPlay={play} />
      )}

      {/* 悬浮快捷导航：BubbleMenu（点开弹出大药丸按钮）。
          定位交给 .vs-bubble 类（含移动端避让底栏的媒体查询），避免内联样式覆盖。 */}
      <BubbleMenu
        useFixedPosition
        onLogoClick={() => go('home')}
        logo={<span className="text-sm font-bold text-red-500">VidSpark</span>}
        menuBg={theme === 'dark' ? '#27272a' : '#f4f4f5'}
        menuContentColor={theme === 'dark' ? '#fafafa' : '#111827'}
        items={navItems}
        className="vs-bubble"
        style={{ gap: '12px', zIndex: 100 }}
      />

      {/* 移动端底部导航：窄屏替代顶部 tab */}
      <nav className="fixed bottom-0 left-0 z-30 flex w-full border-t border-border bg-background/95 backdrop-blur md:hidden">
        {tabs
          .filter((t) => t.key !== 'detail')
          .map((t) => (
            <button
              key={t.key}
              onClick={() => go(t.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition ${
                view === t.key ? 'text-red-500' : 'text-muted-foreground'
              }`}
            >
              <span className="text-base">{navIcon[t.key]}</span>
              {t.label}
            </button>
          ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AccountProvider>
        <InteractionsProvider>
          <LibraryProvider>
            <Root />
          </LibraryProvider>
        </InteractionsProvider>
      </AccountProvider>
    </ThemeProvider>
  )
}

// 登录网关：未登录(activeId 为空)展示账号选择/注册，登录后进入应用。
// 这样"账号"才是有意义的身份——登出后数据视图随之隔离。
function Root() {
  const { activeId } = useAccount()
  return activeId ? <Shell /> : <AccountGate />
}
