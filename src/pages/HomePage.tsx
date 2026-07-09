import EvilEye from '@/components/EvilEye'
import VideoCard from '@/components/VideoCard'
import { videos as allVideos, type Video } from '@/data/mock'

export default function HomePage({
  userVideos,
  allVideos: _all,
  onPlay,
}: {
  userVideos: Video[]
  allVideos: Video[]
  onPlay: (v: Video) => void
}) {
  // 推荐：默认库 + 用户上传，去重后展示
  const recommended = allVideos
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
      </main>
    </>
  )
}
