import { useState, useEffect, useRef } from 'react'
import type { Video } from '@/data/mock'
import { categories, formatViews } from '@/data/mock'
import { useInteractions } from '@/hooks/useInteractions'
import { useLibrary } from '@/hooks/useLibrary'
import { getBlob } from '@/lib/db'

const DANMAKU = [
  '前排！', '这运镜绝了', '慧眼盯得我发毛', '已三连', 'BGM 是什么',
  '哈哈哈哈哈', '收藏了', 'UP主好强', '下饭神作', '泪目了',
  '慕了慕了', '求教程', '循环ing', '太顶了', '沙发',
]

export default function VideoDetailPage({
  video,
  allVideos,
  onBack,
  onPlay,
}: {
  video: Video
  allVideos: Video[]
  onBack: () => void
  onPlay: (v: Video) => void
}) {
  const cat = categories.find((c) => c.key === video.category)
  const {
    isLiked,
    toggleLike,
    isCoined,
    toggleCoin,
    isFaved,
    toggleFav,
    isFollowed,
    toggleFollow,
    likes,
    coins,
    favs,
  } = useInteractions()
  const { getComments, addComment, viewCount, incrementView, removeUpload } = useLibrary()

  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const videoElRef = useRef<HTMLVideoElement>(null)

  const baseLike = Math.max(1, Math.round(video.viewsNum / 220))
  const baseCoin = Math.max(1, Math.round(video.viewsNum / 380))
  const baseFav = Math.max(1, Math.round(video.viewsNum / 300))
  const followed = isFollowed(video.author)
  const comments = getComments(video.id)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1500)
  }

  const related = allVideos.filter((v) => v.id !== video.id).slice(0, 6)

  // 打开即计入播放量 + 写入观看历史（localStorage 持久化）
  useEffect(() => {
    incrementView(video.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id])

  // 本地上传视频：从 IndexedDB 取真实文件并生成可播放 URL
  useEffect(() => {
    let url: string | null = null
    let cancelled = false
    if (video.isLocal && video.blobKey) {
      getBlob(video.blobKey)
        .then((b) => {
          if (b && !cancelled) {
            url = URL.createObjectURL(b)
            setObjectUrl(url)
          }
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [video.id])

  // 模拟播放器进度推进
  const timerRef = useRef<number | null>(null)
  useEffect(() => {
    if (!playing || objectUrl) return // 真实视频由 <video> 自身控制
    timerRef.current = window.setInterval(() => {
      setProgress((pr) => {
        if (pr >= 100) {
          setPlaying(false)
          return 100
        }
        return pr + 1
      })
    }, 200)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [playing, objectUrl])

  // 键盘快捷键：空格播放/暂停、Esc 返回（输入框聚焦时不拦截）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
      if (typing) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (objectUrl && videoElRef.current) {
          videoElRef.current.paused ? videoElRef.current.play() : videoElRef.current.pause()
        } else {
          setPlaying((p) => !p)
        }
      } else if (e.key === 'Escape') {
        onBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack, objectUrl])

  const onDelete = () => {
    if (!window.confirm(`确定删除《${video.title}》吗？该操作不可恢复。`)) return
    removeUpload(video)
    showToast('已删除投稿')
    onBack()
  }

  return (
    <main className="px-6 pb-24 pt-6 md:pb-20">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-muted-foreground transition hover:text-foreground"
      >
        ← 返回（Esc）
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        {/* 主区：播放器 + 信息 + 评论 */}
        <div>
          {/* 播放器 */}
          <div
            className="relative aspect-video w-full overflow-hidden rounded-2xl"
            style={{ background: video.cover }}
          >
            {objectUrl ? (
              <video
                ref={videoElRef}
                className="absolute inset-0 h-full w-full"
                src={objectUrl}
                poster={video.cover}
                controls
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => {
                  const el = e.currentTarget
                  if (el.duration) setProgress((el.currentTime / el.duration) * 100)
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 text-4xl text-white backdrop-blur transition hover:scale-105"
                  aria-label={playing ? '暂停' : '播放'}
                >
                  {playing ? '⏸' : '▶'}
                </button>
              </div>
            )}

            {/* 弹幕层 */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {DANMAKU.map((d, i) => (
                <span
                  key={i}
                  className="absolute whitespace-nowrap text-sm font-medium text-white drop-shadow"
                  style={{
                    top: `${(i * 37) % 80 + 5}%`,
                    left: '100%',
                    animation: playing
                      ? `dm-move ${8 + (i % 5)}s linear ${i * 0.6}s infinite`
                      : 'none',
                  }}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* 进度条 */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-black/30">
              <div
                className="h-full bg-red-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="absolute bottom-2 right-3 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
              {objectUrl
                ? videoElRef.current?.duration
                  ? `${Math.floor(videoElRef.current.duration / 60)}:${String(Math.floor(videoElRef.current.duration % 60)).padStart(2, '0')}`
                  : video.duration
                : video.duration}
            </span>

            <style>{`@keyframes dm-move { from { transform: translateX(0); } to { transform: translateX(-120vw); } }`}</style>
          </div>

          {/* 标题与元信息 */}
          <h1 className="mt-4 text-2xl font-bold">{video.title}</h1>
          {video.desc && (
            <p className="mt-2 text-sm text-muted-foreground">{video.desc}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>@{video.author}</span>
            <button
              onClick={() => {
                toggleFollow(video.author)
                showToast(followed ? `已取消关注 @${video.author}` : `已关注 @${video.author} 👤`)
              }}
              className={`rounded-full px-3 py-0.5 text-xs font-medium transition ${
                followed
                  ? 'bg-card text-muted-foreground hover:text-foreground'
                  : 'bg-red-600 text-white hover:bg-red-500'
              }`}
            >
              {followed ? '已关注' : '+ 关注'}
            </button>
            <span>· {formatViews(viewCount(video))}次观看</span>
            <span>· {video.publishedAt}</span>
            {cat && (
              <span className="rounded-full bg-background px-2 py-0.5">
                {cat.icon} {cat.name}
              </span>
            )}
            {video.isLocal && (
              <button
                onClick={onDelete}
                className="rounded-full bg-card px-3 py-0.5 text-xs font-medium text-muted-foreground transition hover:text-red-500"
              >
                🗑 删除投稿
              </button>
            )}
          </div>

          {/* 互动条 */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => {
                toggleLike(video.id)
                showToast(isLiked(video.id) ? '已取消点赞' : '点赞 +1 ❤️')
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                isLiked(video.id) ? 'bg-red-600 text-white' : 'bg-card text-foreground hover:bg-background'
              }`}
            >
              👍 {likes(baseLike, video.id)}
            </button>
            <button
              onClick={() => {
                toggleCoin(video.id)
                showToast(isCoined(video.id) ? '已取消投币' : '投币 +1 🪙')
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                isCoined(video.id) ? 'bg-amber-500 text-white' : 'bg-card text-foreground hover:bg-background'
              }`}
            >
              🪙 {coins(baseCoin, video.id)}
            </button>
            <button
              onClick={() => {
                toggleFav(video.id)
                showToast(isFaved(video.id) ? '已取消收藏' : '收藏成功 ⭐')
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                isFaved(video.id) ? 'bg-yellow-500 text-white' : 'bg-card text-foreground hover:bg-background'
              }`}
            >
              ⭐ {favs(baseFav, video.id)}
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`${location.origin}${location.pathname}#/v/${video.id}`)
                showToast('分享链接已复制 🔗')
              }}
              className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background"
            >
              🔗 分享
            </button>
          </div>

          {/* 评论区 */}
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">💬 评论 {comments.length}</h2>
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    addComment(video.id, commentText)
                    setCommentText('')
                  }
                }}
                placeholder="发一条友善的评论…（回车发送）"
                className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-red-500"
              />
            </div>
            <div className="mt-4 space-y-3">
              {comments.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                    {c.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">@{c.user}</span>{' '}
                      <span className="text-xs text-muted-foreground">· {c.time}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 侧栏：相关推荐 */}
        <aside>
          <h2 className="mb-3 text-lg font-semibold">📎 相关推荐</h2>
          <div className="space-y-4">
            {related.map((v) => (
              <div
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => onPlay(v)}
                onKeyDown={(e) => e.key === 'Enter' && onPlay(v)}
                className="flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-2 transition hover:shadow-md"
              >
                <div className="h-16 w-28 shrink-0 rounded-lg" style={{ background: v.cover }} />
                <div className="min-w-0">
                  <div className="line-clamp-2 text-sm font-medium">{v.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    @{v.author} · {formatViews(viewCount(v))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  )
}
