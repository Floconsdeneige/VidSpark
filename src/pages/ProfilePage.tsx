import { useState } from 'react'
import VideoCard from '@/components/VideoCard'
import type { Video } from '@/data/mock'
import { useInteractions } from '@/hooks/useInteractions'
import { useLibrary } from '@/hooks/useLibrary'

type Tab = 'uploads' | 'faved' | 'liked' | 'history'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'uploads', label: '我的投稿', icon: '📤' },
  { key: 'faved', label: '收藏', icon: '⭐' },
  { key: 'liked', label: '点赞', icon: '👍' },
  { key: 'history', label: '观看历史', icon: '🕘' },
]

export default function ProfilePage({
  allVideos,
  onPlay,
  onGoHome,
  onBack,
}: {
  allVideos: Video[]
  onPlay: (v: Video) => void
  onGoHome: () => void
  onBack: () => void
}) {
  const { userVideos, removeUpload, history } = useLibrary()
  const { isFaved, isLiked } = useInteractions()
  const [tab, setTab] = useState<Tab>('uploads')

  const byId = (id: number) => allVideos.find((v) => v.id === id)

  const lists: Record<Tab, Video[]> = {
    uploads: userVideos,
    faved: allVideos.filter((v) => isFaved(v.id)),
    liked: allVideos.filter((v) => isLiked(v.id)),
    history: history.map(byId).filter((v): v is Video => !!v),
  }

  const current = lists[tab]

  return (
    <main className="px-6 pb-20 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-2xl font-bold text-white">
          我
        </div>
        <div>
          <h1 className="text-2xl font-bold">我的 VidSpark</h1>
          <p className="text-sm text-muted-foreground">本地账号 · 数据保存在此浏览器</p>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? 'bg-red-600 text-white' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
            <span className="opacity-70">{lists[t.key].length}</span>
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {tab === 'uploads' ? (
            <>
              你还没有投稿，去发布第一个视频吧～
              <div className="mt-4">
                <button
                  onClick={onGoHome}
                  className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                >
                  去首页上传
                </button>
              </div>
            </>
          ) : tab === 'history' ? (
            '还没有观看记录，去首页逛逛吧～'
          ) : (
            '这里还空空如也，去给视频点个赞 / 收个藏吧～'
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {current.map((v) => (
            <div key={v.id} className="relative">
              <VideoCard video={v} onClick={() => onPlay(v)} />
              {tab === 'uploads' && (
                <button
                  onClick={() => {
                    if (window.confirm(`确定删除《${v.title}》吗？`)) removeUpload(v)
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-600/90 px-2 py-1 text-xs text-white shadow transition hover:bg-red-600"
                  title="删除投稿"
                >
                  🗑 删除
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        className="mt-8 text-sm text-muted-foreground transition hover:text-foreground"
      >
        ← 返回
      </button>
    </main>
  )
}
