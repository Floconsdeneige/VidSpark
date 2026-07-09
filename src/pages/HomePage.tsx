import { useState } from 'react'
import EvilEye from '@/components/EvilEye'
import VideoCard from '@/components/VideoCard'
import { videos as allVideos, type Video } from '@/data/mock'
import { useInteractions } from '@/hooks/useInteractions'

export default function HomePage({
  userVideos,
  allVideos: _all,
  onPlay,
}: {
  userVideos: Video[]
  allVideos: Video[]
  onPlay: (v: Video) => void
}) {
  const { followed } = useInteractions()
  const [tab, setTab] = useState<'recommend' | 'following'>('recommend')

  const recommended = allVideos
  const followingVideos = allVideos.filter(
    (v) => followed.includes(v.author) && !userVideos.some((u) => u.id === v.id),
  )

  return (
    <>
      {/* Hero：EvilEye 招牌慧眼 */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
        <div className="h-64 w-64 sm:h-80 sm:w-80">
          <EvilEye
            eyeColor="#ff4d4d"
            backgroundColor="#0a0a0f"
            intensity={1.6}
            glowIntensity={0.5}
            pupilFollow={1.3}
            flameSpeed={1.2}
            scale={0.85}
          />
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">VidSpark</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          一双盯着你的眼睛，只为推荐最对味的下头视频。把鼠标移到眼睛上，看看它有没有在偷看你 👀
        </p>
      </section>

      <main className="px-6 pb-20">
        {/* 推荐 / 关注 切换 */}
        <div className="mb-6 flex gap-2">
          {(['recommend', 'following'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t ? 'bg-red-600 text-white' : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'recommend' ? '🔥 推荐' : `➕ 关注${followed.length ? ` (${followed.length})` : ''}`}
            </button>
          ))}
        </div>

        {tab === 'following' ? (
          followed.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              你还没有关注任何人。去视频详情页点「+ 关注」，关注的 UP 主投稿会出现在这里～
            </div>
          ) : followingVideos.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              你关注的 UP 主暂时还没有投稿（默认库里可能没他们的视频）。去发个视频或关注更多 UP 主吧～
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {followingVideos.map((v) => (
                <VideoCard key={v.id} video={v} onClick={() => onPlay(v)} />
              ))}
            </div>
          )
        ) : (
          <>
            {userVideos.length > 0 && (
              <>
                <h2 className="mb-4 text-lg font-semibold">📤 你发布的视频</h2>
                <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {userVideos.map((v) => (
                    <VideoCard key={`u-${v.id}`} video={v} onClick={() => onPlay(v)} />
                  ))}
                </div>
              </>
            )}

            <h2 className="mb-4 text-lg font-semibold">🔥 为你推荐</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((v) => (
                <VideoCard key={v.id} video={v} onClick={() => onPlay(v)} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}
