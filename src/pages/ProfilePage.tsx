import { useState } from 'react'
import VideoCard from '@/components/VideoCard'
import type { Video } from '@/data/mock'
import { useInteractions } from '@/hooks/useInteractions'
import { useLibrary } from '@/hooks/useLibrary'
import { useAccount } from '@/hooks/useAccount'

type Tab = 'uploads' | 'faved' | 'liked' | 'history' | 'watchlater' | 'following'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'uploads', label: '我的投稿', icon: '📤' },
  { key: 'faved', label: '收藏', icon: '⭐' },
  { key: 'liked', label: '点赞', icon: '👍' },
  { key: 'history', label: '观看历史', icon: '🕘' },
  { key: 'watchlater', label: '稍后再看', icon: '🕒' },
  { key: 'following', label: '关注', icon: '➕' },
]

const AVATARS = ['😎', '🦊', '🐱', '🐼', '🚀', '🌟', '🔥', '🍉', '👾', '🐯', '🦄', '🌈']

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
  const { isFaved, isLiked, isWatchLater, followed, toggleFollow } = useInteractions()
  const { account, setName, setAvatar } = useAccount()
  const [tab, setTab] = useState<Tab>('uploads')
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(account.name)
  const [draftAvatar, setDraftAvatar] = useState(account.avatar)
  const [openAuthor, setOpenAuthor] = useState<string | null>(null)

  const byId = (id: number) => allVideos.find((v) => v.id === id)

  const videosByAuthor = (author: string) =>
    allVideos.filter((v) => v.author === author)

  const lists: Record<Tab, Video[]> = {
    uploads: userVideos,
    faved: allVideos.filter((v) => isFaved(v.id)),
    liked: allVideos.filter((v) => isLiked(v.id)),
    history: history.map(byId).filter((v): v is Video => !!v),
    watchlater: allVideos.filter((v) => isWatchLater(v.id)),
    following: [],
  }

  const current = tab === 'following' ? [] : lists[tab]

  const saveProfile = () => {
    setName(draftName)
    setAvatar(draftAvatar)
    setEditing(false)
  }

  return (
    <main className="px-6 pb-20 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-2xl font-bold text-white">
          {account.avatar}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{account.name}</h1>
          <p className="text-sm text-muted-foreground">本地账号 · 数据保存在此浏览器</p>
        </div>
        <button
          onClick={() => {
            setDraftName(account.name)
            setDraftAvatar(account.avatar)
            setEditing((e) => !e)
          }}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-background"
        >
          ✏️ 编辑资料
        </button>
      </div>

      {/* 编辑资料面板 */}
      {editing && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 text-sm font-medium">昵称</div>
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={16}
            placeholder="给自己起个名字"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-red-500"
          />
          <div className="mb-2 mt-4 text-sm font-medium">头像</div>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setDraftAvatar(a)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl transition ${
                  draftAvatar === a ? 'border-red-500 bg-background' : 'border-transparent hover:border-border'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-background"
            >
              取消
            </button>
            <button
              onClick={saveProfile}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
            >
              保存
            </button>
          </div>
        </div>
      )}

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
            <span className="opacity-70">
              {t.key === 'following' ? followed.length : lists[t.key].length}
            </span>
          </button>
        ))}
      </div>

      {tab === 'following' ? (
        followed.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            还没有关注任何人。去视频详情页点「+ 关注」，或逛逛首页关注流吧～
          </div>
        ) : (
          <div className="space-y-4">
            {followed.map((author) => {
              const his = videosByAuthor(author)
              const open = openAuthor === author
              return (
                <div key={author} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-lg font-bold text-white">
                      {Array.from(author)[0] ?? 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">@{author}</div>
                      <div className="text-xs text-muted-foreground">{his.length} 个视频</div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`取消关注 @${author}？`)) toggleFollow(author)
                      }}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:border-red-500 hover:text-red-500"
                    >
                      取关
                    </button>
                    <button
                      onClick={() => setOpenAuthor(open ? null : author)}
                      className="rounded-full bg-card px-3 py-1.5 text-xs font-medium transition hover:bg-background"
                    >
                      {open ? '收起' : '展开'}
                    </button>
                  </div>
                  {open && his.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {his.map((v) => (
                        <VideoCard key={v.id} video={v} onClick={() => onPlay(v)} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : current.length === 0 ? (
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
          ) : tab === 'watchlater' ? (
            '还没有「稍后再看」的视频，去详情页点 🕒 收藏起来吧～'
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
