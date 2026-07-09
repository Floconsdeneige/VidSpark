import { useState, useEffect, useRef, type ReactNode } from 'react'
import type { Video } from '@/data/mock'
import { categories, formatViews, type Comment } from '@/data/mock'
import { useInteractions } from '@/hooks/useInteractions'
import { useAccount } from '@/hooks/useAccount'
import { useSocial } from '@/hooks/useSocial'
import { useLibrary } from '@/hooks/useLibrary'
import { getBlob } from '@/lib/db'

export default function VideoDetailPage({
  video,
  allVideos,
  onBack,
  onPlay,
  onOpenAccount,
}: {
  video: Video
  allVideos: Video[]
  onBack: () => void
  onPlay: (v: Video) => void
  onOpenAccount?: (id: string) => void
}) {
  const cat = categories.find((c) => c.key === video.category)
  const {
    isLiked,
    toggleLike,
    isCoined,
    toggleCoin,
    isFollowed,
    toggleFollow,
    isWatchLater,
    toggleWatchLater,
    likes,
    coins,
    favs,
  } = useInteractions()
  const { getComments, addComment, deleteComment, likeComment, viewCount, incrementView, removeUpload } = useLibrary()
  const { account, accounts, activeId } = useAccount()
  const social = useSocial()

  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [commentSort, setCommentSort] = useState<'hot' | 'time'>('time')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [sentDanmaku, setSentDanmaku] = useState<string[]>([])
  const [danmakuText, setDanmakuText] = useState('')
  const [burst, setBurst] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const videoElRef = useRef<HTMLVideoElement>(null)
  const longPressed = useRef(false)
  const tripleTimer = useRef<number | null>(null)

  const baseLike = Math.max(1, Math.round(video.viewsNum / 220))
  const baseCoin = Math.max(1, Math.round(video.viewsNum / 380))
  const baseFav = Math.max(1, Math.round(video.viewsNum / 300))
  const followed = isFollowed(video.author)
  // 视频作者若是真实账号（非游客/预设），则关注走双向社交图并互关。
  // 优先按稳定 authorId 匹配，避免改名/重名导致错靶；降级按显示名。
  const authorAccount =
    (video.authorId
      ? accounts.find((a) => a.id === video.authorId && a.id !== activeId)
      : undefined) ?? accounts.find((a) => a.name === video.author && a.id !== activeId) ?? null
  const comments = getComments(video.id)
  const [replyTarget, setReplyTarget] = useState<{ user: string; id: string } | null>(null)

  // 真实弹幕：取自该视频的真实评论（预设 + 用户），叠加本会话手发的弹幕。
  // 不再是写死的假常量——这与「完整功能」的第一性要求一致。
  const danmakuItems = [
    ...comments.filter((c) => !c.deleted && c.text.trim()).map((c) => c.text.trim()),
    ...sentDanmaku,
  ]

  // 把扁平评论按 replyTo 组装成线程树（顶层 + 嵌套回复）
  const threads = buildThreads(comments)
  // 评论排序：热度 = 顶层按点赞数降序；时间 = 默认（新评论在前）
  const displayThreads =
    commentSort === 'hot' ? [...threads].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)) : threads

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1500)
  }

  // 相关推荐：同分区优先，不足再用其他分区补齐（前 6 个）
  const sameCat = allVideos.filter((v) => v.id !== video.id && v.category === video.category)
  const otherCat = allVideos.filter((v) => v.id !== video.id && v.category !== video.category)
  const related = [...sameCat, ...otherCat].slice(0, 6)

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

  // 向视频作者推送互动通知（点赞/投币/收藏）；作者为真实账号、且不是自己时生效
  const pushEngagement = (type: 'like' | 'coin' | 'fav', label: string) => {
    if (!authorAccount) return
    social.pushNotification(authorAccount.id, {
      type,
      fromName: account.name,
      fromId: activeId ?? undefined,
      text: `${label}了你的视频`,
      videoId: video.id,
      videoTitle: video.title,
    })
  }

  // 一键三连（B站签名）：确保点赞+投币+收藏全开。仅对「本次新发生」的动作推通知，避免重复。
  const doTriple = () => {
    const wasLiked = isLiked(video.id)
    const wasCoined = isCoined(video.id)
    const wasFaved = social.isFaved(video.id)
    const changed = social.triple(video.id)
    if (changed) {
      if (authorAccount) {
        if (!wasLiked)
          social.pushNotification(authorAccount.id, { type: 'like', fromName: account.name, fromId: activeId ?? undefined, text: '赞了你的视频', videoId: video.id, videoTitle: video.title })
        if (!wasCoined)
          social.pushNotification(authorAccount.id, { type: 'coin', fromName: account.name, fromId: activeId ?? undefined, text: '投币了你的视频', videoId: video.id, videoTitle: video.title })
        if (!wasFaved)
          social.pushNotification(authorAccount.id, { type: 'fav', fromName: account.name, fromId: activeId ?? undefined, text: '收藏了你的视频', videoId: video.id, videoTitle: video.title })
      }
      showToast('已三连 ❤️🪙⭐')
      setBurst(true)
      window.setTimeout(() => setBurst(false), 900)
    } else {
      showToast('已经三连过啦～')
    }
  }
  // 长按点赞按钮触发三连（同时保留单击单独点赞）
  const startTriple = () => {
    longPressed.current = false
    if (tripleTimer.current) window.clearTimeout(tripleTimer.current)
    tripleTimer.current = window.setTimeout(() => {
      longPressed.current = true
      doTriple()
    }, 600)
  }
  const cancelTriple = () => {
    if (tripleTimer.current) window.clearTimeout(tripleTimer.current)
  }

  // 评论点赞：点赞真实账号的评论时向对方推送通知
  const onLikeComment = (cid: string) => {
    likeComment(video.id, cid)
    const c = comments.find((x) => x.id === cid)
    if (c?.authorId && c.authorId !== activeId) {
      const target = accounts.find((a) => a.id === c.authorId)
      if (target) {
        social.pushNotification(target.id, {
          type: 'like',
          fromName: account.name,
          fromId: activeId ?? undefined,
          text: `赞了你的评论：${clip(c.text)}`,
          videoId: video.id,
          videoTitle: video.title,
        })
      }
    }
  }

  // 发送一条本会话弹幕（弹幕天然是临时的，不写入评论库）
  const sendDanmaku = () => {
    const t = danmakuText.trim()
    if (!t) return
    setSentDanmaku((prev) => [...prev, t])
    setDanmakuText('')
  }

  // @提及：解析评论中的 @昵称，向匹配到的真实账号（非自己）推送「@我」通知。
  const pushMentions = (text: string, skipAccountId?: string) => {
    const re = /@([^ @，。！？、；：]+)/g
    const seen = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      const name = m[1]
      const acc = accounts.find((a) => a.name === name && a.id !== activeId)
      if (acc && acc.id !== skipAccountId && !seen.has(acc.id)) {
        seen.add(acc.id)
        social.pushNotification(acc.id, {
          type: 'mention',
          fromName: account.name,
          fromId: activeId ?? undefined,
          text: `在评论中 @ 了你：${clip(text)}`,
          videoId: video.id,
          videoTitle: video.title,
        })
      }
    }
  }

  // 评论文本富渲染：@昵称 可点击打开对应账号主页
  const renderText = (text: string): ReactNode => {
    const parts = text.split(/@([^ @，。！？、；：]+)/g)
    return parts.map((p, i) => {
      if (p.startsWith('@')) {
        const name = p.slice(1)
        const acc = accounts.find((a) => a.name === name && a.id !== activeId)
        if (acc && onOpenAccount) {
          return (
            <button
              key={i}
              onClick={() => onOpenAccount(acc.id)}
              className="font-semibold text-red-500 transition hover:underline"
            >
              {p}
            </button>
          )
        }
      }
      return <span key={i}>{p}</span>
    })
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

            {/* 弹幕层（真实评论驱动） */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {danmakuItems.map((d, i) => (
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

            {/* 弹幕发送框 */}
            <div className="absolute bottom-9 left-3 z-10 flex items-center gap-1">
              <input
                value={danmakuText}
                onChange={(e) => setDanmakuText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendDanmaku()
                }}
                placeholder="发个弹幕…"
                className="w-36 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs text-white outline-none placeholder:text-white/60"
              />
              <button
                onClick={sendDanmaku}
                className="rounded-full bg-red-600/90 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-600"
              >
                发送
              </button>
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
            {authorAccount && onOpenAccount ? (
              <button
                onClick={() => onOpenAccount(authorAccount.id)}
                className="font-medium text-foreground transition hover:text-red-500"
                title="查看 TA 的主页"
              >
                @{video.author}
              </button>
            ) : (
              <span>@{video.author}</span>
            )}
            {authorAccount && social.mutualWith(authorAccount.id) && (
              <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-xs font-medium text-emerald-500">
                互关
              </span>
            )}
            <button
              onClick={() => {
                if (authorAccount) {
                  social.follow(video.author, authorAccount.id)
                  showToast(
                    followed
                      ? `已取消关注 @${video.author}`
                      : `已关注 @${video.author} 👤`,
                  )
                } else {
                  toggleFollow(video.author)
                  showToast(
                    followed
                      ? `已取消关注 @${video.author}`
                      : `已关注 @${video.author} 👤`,
                  )
                }
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
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onPointerDown={startTriple}
              onPointerUp={cancelTriple}
              onPointerLeave={cancelTriple}
              onClick={() => {
                if (longPressed.current) {
                  longPressed.current = false
                  return
                }
                const will = !isLiked(video.id)
                toggleLike(video.id)
                showToast(will ? '点赞 +1 ❤️' : '已取消点赞')
                if (will) pushEngagement('like', '赞')
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                isLiked(video.id) ? 'bg-red-600 text-white' : 'bg-card text-foreground hover:bg-background'
              }`}
            >
              👍 {likes(baseLike, video.id)}
            </button>
            <button
              onClick={() => {
                const will = !isCoined(video.id)
                toggleCoin(video.id)
                showToast(will ? '投币 +1 🪙' : '已取消投币')
                if (will) pushEngagement('coin', '投币')
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                isCoined(video.id) ? 'bg-amber-500 text-white' : 'bg-card text-foreground hover:bg-background'
              }`}
            >
              🪙 {coins(baseCoin, video.id)}
            </button>
            <button
              onClick={() => {
                const will = !social.isFaved(video.id)
                if (will) {
                  social.fav(video.id)
                  pushEngagement('fav', '收藏')
                  showToast('收藏成功 ⭐')
                } else {
                  social.unfav(video.id)
                  showToast('已取消收藏')
                }
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                social.isFaved(video.id) ? 'bg-yellow-500 text-white' : 'bg-card text-foreground hover:bg-background'
              }`}
            >
              ⭐ {favs(baseFav, video.id)}
            </button>
            <button
              onClick={() => setFolderOpen(true)}
              title="收藏到文件夹"
              className="flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background"
            >
              📁
            </button>
            {/* 一键三连 */}
            <button
              onClick={doTriple}
              className="relative flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              🎉 三连
              {burst && (
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 animate-[vs-burst_0.9s_ease-out] text-lg">
                  ❤️🪙⭐
                </span>
              )}
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
            <button
              onClick={() => {
                toggleWatchLater(video.id)
                showToast(isWatchLater(video.id) ? '已移出稍后再看' : '已加入稍后再看 🕒')
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                isWatchLater(video.id) ? 'bg-indigo-600 text-white' : 'bg-card text-foreground hover:bg-background'
              }`}
            >
              🕒 稍后再看
            </button>
          </div>

          {/* 评论区 */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                💬 评论 {comments.filter((c) => !c.deleted).length}
              </h2>
              <div className="flex gap-1 rounded-full bg-card p-1 text-xs">
                <button
                  onClick={() => setCommentSort('time')}
                  className={`rounded-full px-3 py-1 transition ${commentSort === 'time' ? 'bg-red-600 text-white' : 'text-muted-foreground'}`}
                >
                  最新
                </button>
                <button
                  onClick={() => setCommentSort('hot')}
                  className={`rounded-full px-3 py-1 transition ${commentSort === 'hot' ? 'bg-red-600 text-white' : 'text-muted-foreground'}`}
                >
                  最热
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    if (replyTarget) {
                      addComment(video.id, commentText, account.name, {
                        authorId: activeId ?? undefined,
                        replyTo: replyTarget,
                      })
                      // 回复真实账号的评论 → 向对方推送通知（带评论片段）
                      const target = accounts.find(
                        (a) => a.name === replyTarget.user && a.id !== activeId,
                      )
                      if (target) {
                        social.pushNotification(target.id, {
                          type: 'reply',
                          fromName: account.name,
                          fromId: activeId ?? undefined,
                          text: `回复了你的评论：${clip(commentText)}`,
                          videoId: video.id,
                          videoTitle: video.title,
                        })
                      }
                      // @提及：跳过被回复者本人，避免与「回复」通知重复
                      const rtAccId = comments.find((c) => c.id === replyTarget.id)?.authorId
                      pushMentions(commentText, rtAccId)
                    } else {
                      addComment(video.id, commentText, account.name, {
                        authorId: activeId ?? undefined,
                      })
                      // 评论真实账号的视频 → 向作者推送通知（带评论片段）
                      if (authorAccount) {
                        social.pushNotification(authorAccount.id, {
                          type: 'comment',
                          fromName: account.name,
                          fromId: activeId ?? undefined,
                          text: `评论了你的视频：${clip(commentText)}`,
                          videoId: video.id,
                          videoTitle: video.title,
                        })
                      }
                      pushMentions(commentText)
                    }
                    setCommentText('')
                    setReplyTarget(null)
                  }
                }}
                placeholder={replyTarget ? `回复 @${replyTarget.user}…（回车发送）` : '发一条友善的评论…（回车发送）'}
                className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-red-500"
              />
              {replyTarget && (
                <button
                  onClick={() => setReplyTarget(null)}
                  className="shrink-0 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                  title="取消回复"
                >
                  取消
                </button>
              )}
            </div>
            <div className="mt-4 space-y-4">
              {displayThreads.map((c) => (
                <CommentThread
                  key={c.id}
                  node={c}
                  depth={0}
                  activeId={activeId}
                  onReply={(user, id) => setReplyTarget({ user, id })}
                  onDelete={(cid) => deleteComment(video.id, cid)}
                  onLike={onLikeComment}
                  onOpenAccount={onOpenAccount}
                  renderText={renderText}
                />
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

      {/* 收藏夹选择浮层 */}
      {folderOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setFolderOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">收藏到…</h3>
              <button onClick={() => setFolderOpen(false)} className="text-xl leading-none text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {social.favFolders.map((f) => (
                <label
                  key={f.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <input
                    type="checkbox"
                    checked={social.inFolder(video.id, f.id)}
                    onChange={() => social.toggleFolder(video.id, f.id)}
                    className="h-4 w-4 accent-red-600"
                  />
                  <span className="flex-1 text-sm font-medium">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{f.videoIds.length}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                maxLength={12}
                placeholder="新建收藏夹…"
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-red-500"
              />
              <button
                onClick={() => {
                  const id = social.createFavFolder(newFolderName)
                  if (id !== 'default') {
                    social.toggleFolder(video.id, id)
                    setNewFolderName('')
                  }
                }}
                disabled={!newFolderName.trim()}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                新建并收藏
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <style>{`@keyframes vs-burst { 0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -16px) scale(1.3); opacity: 0; } }`}</style>
    </main>
  )
}

// 把扁平评论按 replyTo 组装成线程树（顶层 + 嵌套回复）
type CNode = Comment & { replies: CNode[] }
function buildThreads(list: Comment[]): CNode[] {
  const map = new Map<string, CNode>()
  list.forEach((c) => map.set(c.id, { ...c, replies: [] }))
  const roots: CNode[] = []
  list.forEach((c) => {
    const node = map.get(c.id)!
    const parentId = c.replyTo?.id
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.replies.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

// 通知里展示的评论片段（最多 18 字）
function clip(text: string): string {
  const t = text.trim()
  return t.length > 18 ? `${t.slice(0, 18)}…` : t
}

// 单条评论（递归渲染嵌套回复，缩进表达线程；支持点赞/回复/删除）
function CommentThread({
  node,
  depth,
  activeId,
  onReply,
  onDelete,
  onLike,
  onOpenAccount,
  renderText,
}: {
  node: CNode
  depth: number
  activeId: string | null
  onReply: (user: string, id: string) => void
  onDelete: (id: string) => void
  onLike: (id: string) => void
  onOpenAccount?: (id: string) => void
  renderText: (text: string) => ReactNode
}) {
  return (
    <div className={depth > 0 ? 'ml-6 border-l border-border pl-4' : ''}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
          {node.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm">
            <span className="font-semibold">@{node.user}</span>{' '}
            <span className="text-xs text-muted-foreground">· {node.time}</span>
          </div>
          {node.replyTo && (
            <div className="text-xs text-muted-foreground">↩ 回复 @{node.replyTo.user}</div>
          )}
          <div className="text-sm text-muted-foreground">
            {node.deleted ? '该评论已删除' : renderText(node.text)}
          </div>
        </div>
        {!node.deleted && (
          <div className="flex shrink-0 flex-col items-end gap-1 self-center">
            <button
              onClick={() => onLike(node.id)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
                node.likedByMe ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="点赞评论"
            >
              👍 {node.likes ?? 0}
            </button>
            <button
              onClick={() => onReply(node.user, node.id)}
              className="rounded-full px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              title="回复"
            >
              回复
            </button>
            {node.authorId === activeId && (
              <button
                onClick={() => onDelete(node.id)}
                className="rounded-full px-2 py-1 text-xs text-muted-foreground transition hover:text-red-500"
                title="删除我的评论"
              >
                删除
              </button>
            )}
          </div>
        )}
      </div>
      {node.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.replies.map((r) => (
            <CommentThread
              key={r.id}
              node={r}
              depth={depth + 1}
              activeId={activeId}
              onReply={onReply}
              onDelete={onDelete}
              onLike={onLike}
              onOpenAccount={onOpenAccount}
              renderText={renderText}
            />
          ))}
        </div>
      )}
    </div>
  )
}
