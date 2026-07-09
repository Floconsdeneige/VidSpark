import { useState, useEffect } from 'react'
import VideoCard from '@/components/VideoCard'
import { categories, matchVideo, type Video, type CategoryKey } from '@/data/mock'
import { useInteractions } from '@/hooks/useInteractions'
import { useLibrary } from '@/hooks/useLibrary'

const catName = (k: CategoryKey) => categories.find((c) => c.key === k)?.name ?? ''

const HISTORY_KEY = 'vidspark_search_history_v1'
const MAX_HISTORY = 8

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export default function CategoriesPage({
  initialQuery = '',
  allVideos,
  onPlay,
}: {
  initialQuery?: string
  allVideos: Video[]
  onPlay: (v: Video) => void
}) {
  const [active, setActive] = useState<CategoryKey | 'all'>('all')
  const [query, setQuery] = useState(initialQuery)
  const [history, setHistory] = useState<string[]>(loadHistory)
  const [onlyFollowed, setOnlyFollowed] = useState(false)
  const [sort, setSort] = useState<'smart' | 'hot' | 'new'>('smart')
  const { followed } = useInteractions()
  const { viewCount } = useLibrary()

  const addHistory = (raw: string) => {
    const w = raw.trim()
    if (!w) return
    setHistory((h) => {
      const next = [w, ...h.filter((x) => x !== w)].slice(0, MAX_HISTORY)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch {
        /* 忽略 */
      }
      return next
    })
  }

  // 从首页/顶栏带词进入时，写入一次历史
  useEffect(() => {
    if (initialQuery.trim()) addHistory(initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const q = query.trim()
  let filtered = allVideos.filter((v) => {
    const catOk = active === 'all' || v.category === active
    return catOk && matchVideo(v, q, catName)
  })

  // 只看关注的人：仅保留已关注 UP 主发布的视频
  if (onlyFollowed) {
    const set = new Set(followed)
    filtered = filtered.filter((v) => set.has(v.author))
  }

  // 排序：综合（默认顺序）/ 最热（实时播放量降序）/ 最新（创建时间降序）
  if (sort === 'hot') {
    filtered = [...filtered].sort((a, b) => viewCount(b) - viewCount(a))
  } else if (sort === 'new') {
    filtered = [...filtered].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  }

  const activeCat = categories.find((c) => c.key === active)

  // 修复：当带搜索词时，直接展示结果，而不是回到分区九宫格
  const showResults = q.length > 0 || active !== 'all'

  if (!showResults) {
    return (
      <main className="px-6 pb-20 pt-8">
        <h1 className="mb-1 text-2xl font-bold">📂 视频分区</h1>
        <p className="mb-6 text-sm text-muted-foreground">挑一个你感兴趣的世界钻进去</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => {
            const count = allVideos.filter((v) => v.category === c.key).length
            return (
              <button
                key={c.key}
                onClick={() => setActive(c.key)}
                className="group flex flex-col items-start overflow-hidden rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-20 w-full rounded-xl" style={{ background: c.cover }} />
                <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
                  <span>{c.icon}</span> {c.name}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{c.desc}</div>
                <div className="mt-2 text-xs text-muted-foreground">{count} 个视频</div>
              </button>
            )
          })}
        </div>
      </main>
    )
  }

  return (
    <main className="px-6 pb-20 pt-8">
      <button
        onClick={() => {
          setActive('all')
          setQuery('')
          setOnlyFollowed(false)
        }}
        className="mb-4 text-sm text-muted-foreground transition hover:text-foreground"
      >
        ← 返回分区
      </button>

      <div className="mb-1 flex items-center gap-2 text-2xl font-bold">
        {active === 'all' ? '🔍' : activeCat?.icon} {active === 'all' ? '搜索结果' : activeCat?.name}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {q ? `“${q}”` : activeCat?.desc} · 共 {filtered.length} 个视频
      </p>

      {/* 搜索历史 */}
      {history.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>🕘 最近搜索</span>
            <button
              onClick={() => {
                setHistory([])
                try {
                  localStorage.removeItem(HISTORY_KEY)
                } catch {
                  /* 忽略 */
                }
              }}
              className="transition hover:text-foreground"
            >
              清空
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((w) => (
              <span
                key={w}
                className="group flex items-center gap-1 rounded-full bg-card px-3 py-1 text-sm text-muted-foreground"
              >
                <button
                  onClick={() => setQuery(w)}
                  className="transition hover:text-foreground"
                >
                  {w}
                </button>
                <button
                  onClick={() =>
                    setHistory((h) => h.filter((x) => x !== w))
                  }
                  className="text-muted-foreground/60 transition hover:text-red-500"
                  title="删除"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addHistory(query)
          }}
          placeholder="搜索标题 / UP主 / 标签…"
          className="w-full max-w-md rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-red-500"
        />
        <button
          onClick={() => setOnlyFollowed((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${
            onlyFollowed
              ? 'border-red-500 bg-red-600 text-white'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          }`}
          title="只显示你已关注的 UP 主发布的视频"
        >
          👥 只看关注的人
          {onlyFollowed && <span className="text-xs">✓</span>}
        </button>

        <div className="ml-auto flex items-center gap-1 rounded-full border border-border bg-card p-1 text-sm">
          {(
            [
              { key: 'smart', label: '综合' },
              { key: 'hot', label: '最热' },
              { key: 'new', label: '最新' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                sort === opt.key ? 'bg-red-600 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {onlyFollowed ? (
            <>
              你关注的人里没有匹配的视频 🤔
              <div className="mt-2 text-xs">
                先去视频详情页关注几位 UP 主，或
                <button
                  onClick={() => setOnlyFollowed(false)}
                  className="ml-1 text-red-500 underline"
                >
                  关闭筛选
                </button>
              </div>
            </>
          ) : (
            <>
              没有找到匹配的视频 🤔
              <div className="mt-2 text-xs">试试别的关键词，或换个分区</div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VideoCard key={v.id} video={v} onClick={() => onPlay(v)} />
          ))}
        </div>
      )}
    </main>
  )
}
