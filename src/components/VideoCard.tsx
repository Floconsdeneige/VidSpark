import type { Video } from '@/data/mock'
import { formatViews } from '@/data/mock'
import { useInteractions } from '@/hooks/useInteractions'
import { useLibrary } from '@/hooks/useLibrary'
import { coverStyle } from '@/lib/cover'

export default function VideoCard({
  video,
  rank,
  onClick,
}: {
  video: Video
  rank?: number
  onClick?: () => void
}) {
  const { isLiked, toggleLike, isFaved, toggleFav } = useInteractions()
  const { viewCount } = useLibrary()
  const liked = isLiked(video.id)
  const faved = isFaved(video.id)

  const stop = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-40" style={coverStyle(video.cover)}>
        {rank !== undefined && (
          <span
            className={`absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold ${
              rank <= 3 ? 'bg-red-600 text-white' : 'bg-black/60 text-white'
            }`}
          >
            {rank}
          </span>
        )}

        {/* 已互动静态标记：用户一眼看到自己赞/藏过 */}
        <div className="absolute left-2 top-2 flex gap-1">
          {liked && <span className="rounded bg-red-600/90 px-1.5 text-xs text-white">❤️</span>}
          {faved && <span className="rounded bg-amber-500/90 px-1.5 text-xs text-white">⭐</span>}
        </div>

        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
          {video.duration}
        </span>

        {/* 悬停播放提示 */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-4xl opacity-0 transition group-hover:opacity-100">
          ▶️
        </span>

        {/* 悬停操作气泡（BubbleMenu 风格小圆钮，点击不进详情） */}
        <div
          className="absolute bottom-2 left-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100"
          onClick={stop}
          onKeyDown={stop}
        >
          <button
            type="button"
            title="点赞"
            onClick={(e) => {
              stop(e)
              toggleLike(video.id)
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm shadow transition ${
              liked ? 'bg-red-600 text-white' : 'bg-black/70 text-white hover:bg-black/85'
            }`}
          >
            👍
          </button>
          <button
            type="button"
            title="收藏"
            onClick={(e) => {
              stop(e)
              toggleFav(video.id)
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm shadow transition ${
              faved ? 'bg-amber-500 text-white' : 'bg-black/70 text-white hover:bg-black/85'
            }`}
          >
            ⭐
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="line-clamp-2 font-medium leading-snug">{video.title}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          @{video.author} · {formatViews(viewCount(video))}次观看
        </div>
        {video.tags && video.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {video.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        {(liked || faved) && (
          <div className="mt-2 text-xs text-red-500/80">
            {liked && faved ? '你赞过并收藏了' : liked ? '你赞过' : '你收藏了'}
          </div>
        )}
      </div>
    </div>
  )
}
