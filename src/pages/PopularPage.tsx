import VideoCard from '@/components/VideoCard'
import type { Video } from '@/data/mock'

const podiumColors = ['#f43f5e', '#fb923c', '#fbbf24']

export default function PopularPage({
  allVideos,
  onPlay,
}: {
  allVideos: Video[]
  onPlay: (v: Video) => void
}) {
  const ranked = [...allVideos].sort((a, b) => b.viewsNum - a.viewsNum)
  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)

  return (
    <main className="px-6 pb-20 pt-8">
      <h1 className="mb-1 text-2xl font-bold">🔥 全站热榜</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        实时热度排序 · 每小时更新 · 共 {ranked.length} 个视频
      </p>

      {/* 前三名领奖台 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {top3.map((v, i) => (
          <div
            key={v.id}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-4"
            style={{ borderTop: `4px solid ${podiumColors[i]}` }}
          >
            <div className="text-3xl font-black" style={{ color: podiumColors[i] }}>
              {i + 1}
            </div>
            <button
              className="mt-3 block h-28 w-full rounded-lg"
              style={{ background: v.cover }}
              onClick={() => onPlay(v)}
              aria-label={`播放 ${v.title}`}
            />
            <button
              className="mt-3 block w-full text-left font-semibold line-clamp-2 hover:text-red-500"
              onClick={() => onPlay(v)}
            >
              {v.title}
            </button>
            <div className="mt-1 text-sm text-muted-foreground">@{v.author}</div>
            <div className="mt-2 text-sm font-medium text-red-500">🔥 {v.views}次热播</div>
          </div>
        ))}
      </div>

      {/* 其余榜单 */}
      <h2 className="mb-4 text-lg font-semibold">更多热门</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((v, i) => (
          <VideoCard key={v.id} video={v} rank={i + 4} onClick={() => onPlay(v)} />
        ))}
      </div>
    </main>
  )
}
