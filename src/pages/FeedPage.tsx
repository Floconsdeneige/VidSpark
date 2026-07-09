import { feed, feedTypeMeta, type FeedItem, type Video } from '@/data/mock'

export default function FeedPage({
  userUploads,
  onPlay,
}: {
  userUploads: Video[]
  onPlay: (v: Video) => void
}) {
  // 用户上传 → 派生为"投稿"动态，置于时间线最前
  const myItems: FeedItem[] = userUploads.map((v, i) => ({
    id: -1000 - i,
    type: 'upload',
    user: '你',
    avatar: '我',
    text: `发布了新视频《${v.title}》`,
    target: v.title,
    time: '刚刚',
  }))

  const items = [...myItems, ...feed]

  return (
    <main className="px-6 pb-20 pt-8">
      <h1 className="mb-1 text-2xl font-bold">📰 动态</h1>
      <p className="mb-6 text-sm text-muted-foreground">你关注的 UP 主最近在搞什么</p>

      {items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">还没有动态，去首页逛逛吧～</div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-3">
          {items.map((item) => {
            const meta = feedTypeMeta[item.type]
            const targetVideo = userUploads.find((v) => v.title === item.target)
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:shadow-md"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: meta.color }}
                >
                  {item.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-semibold">@{item.user}</span>{' '}
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                  {item.target && targetVideo && (
                    <button
                      onClick={() => onPlay(targetVideo)}
                      className="mt-1 block w-full truncate rounded-lg bg-background px-3 py-2 text-left text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      🎬 {item.target}
                    </button>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{meta.icon}</span> {meta.label} · {item.time}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
