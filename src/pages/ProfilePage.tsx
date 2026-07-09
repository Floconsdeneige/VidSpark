import { useState } from 'react'
import VideoCard from '@/components/VideoCard'
import type { Video } from '@/data/mock'
import { useInteractions } from '@/hooks/useInteractions'
import { useLibrary } from '@/hooks/useLibrary'
import { useAccount } from '@/hooks/useAccount'
import { useSocial } from '@/hooks/useSocial'

type Tab = 'uploads' | 'faved' | 'liked' | 'history' | 'watchlater' | 'following' | 'followers'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'uploads', label: '我的投稿', icon: '📤' },
  { key: 'faved', label: '收藏', icon: '⭐' },
  { key: 'liked', label: '点赞', icon: '👍' },
  { key: 'history', label: '观看历史', icon: '🕘' },
  { key: 'watchlater', label: '稍后再看', icon: '🕒' },
  { key: 'following', label: '关注', icon: '➕' },
  { key: 'followers', label: '粉丝', icon: '💗' },
]

const AVATARS = ['😎', '🦊', '🐱', '🐼', '🚀', '🌟', '🔥', '🍉', '👾', '🐯', '🦄', '🌈']

export default function ProfilePage({
  allVideos,
  onPlay,
  onGoHome,
  onBack,
  onOpenAccount,
}: {
  allVideos: Video[]
  onPlay: (v: Video) => void
  onGoHome: () => void
  onBack: () => void
  onOpenAccount: (id: string) => void
}) {
  const { userVideos, removeUpload, history } = useLibrary()
  const { isFaved, isLiked, isWatchLater, followed, toggleFollow, liked, faved, watchLater } =
    useInteractions()
  const { account, accounts, activeId, setName, setAvatar, setBio, logout, switchAccount, register, deleteAccount } =
    useAccount()
  const social = useSocial()
  const [tab, setTab] = useState<Tab>('uploads')
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(account.name)
  const [draftAvatar, setDraftAvatar] = useState(account.avatar)
  const [draftBio, setDraftBio] = useState(account.bio)
  const [showAccounts, setShowAccounts] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addAvatar, setAddAvatar] = useState(AVATARS[0])
  const [addBio, setAddBio] = useState('')

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
    followers: [],
  }

  const current = tab === 'following' || tab === 'followers' ? [] : lists[tab]

  const saveProfile = () => {
    setName(draftName)
    setAvatar(draftAvatar)
    setBio(draftBio)
    setEditing(false)
  }

  return (
    <main className="px-6 pb-20 pt-8">
      {/* 账号卡 */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-3xl font-bold text-white">
            {account.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <p className="truncate text-sm text-muted-foreground">{account.bio || '这个人很懒，什么都没写～'}</p>
          </div>
          <button
            onClick={() => {
              setDraftName(account.name)
              setDraftAvatar(account.avatar)
              setDraftBio(account.bio)
              setEditing((e) => !e)
            }}
            className="shrink-0 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-card"
          >
            ✏️ 编辑资料
          </button>
        </div>

        {/* 数据统计 */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          {[
            { label: '投稿', n: userVideos.length },
            { label: '粉丝', n: social.followersCount(activeId ?? '') },
            { label: '关注', n: followed.length },
            { label: '点赞', n: liked.length },
            { label: '收藏', n: faved.length },
            { label: '稍后再看', n: watchLater.length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-background py-3">
              <div className="text-lg font-bold">{s.n}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 账号管理 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowAccounts((v) => !v)
              setShowAdd(false)
            }}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:bg-card"
          >
            🔄 切换账号
          </button>
          <button
            onClick={() => {
              if (window.confirm('确定退出登录吗？之后可在账号列表里切换或创建其他账号。')) logout()
            }}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:bg-card"
          >
            🚪 退出登录
          </button>
          {accounts.length > 1 && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `删除账号「${account.name}」？该账号的全部本地数据（投稿/点赞/收藏/历史等）将被清除，不可恢复。`,
                  )
                )
                  deleteAccount(activeId!)
              }}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition hover:text-red-500"
            >
              🗑 删除账号
            </button>
          )}
        </div>

        {/* 切换账号面板 */}
        {showAccounts && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <div className="mb-2 text-sm font-medium">选择账号</div>
            <div className="space-y-2">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    switchAccount(a.id)
                    setShowAccounts(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition hover:border-red-500 ${
                    a.id === activeId ? 'border-red-500 bg-card' : 'border-border bg-background'
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-base font-bold text-white">
                    {a.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{a.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.bio || '本地账号'}</div>
                  </div>
                  {a.id === activeId && <span className="text-xs text-red-500">当前</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="mt-3 text-sm text-red-500 transition hover:underline"
            >
              + 添加账号
            </button>
            {showAdd && (
              <div className="mt-3 space-y-3 border-t border-border pt-3">
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  maxLength={16}
                  placeholder="新账号昵称"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-red-500"
                />
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAddAvatar(a)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg transition ${
                        addAvatar === a ? 'border-red-500 bg-card' : 'border-transparent hover:border-border'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <input
                  value={addBio}
                  onChange={(e) => setAddBio(e.target.value)}
                  maxLength={80}
                  placeholder="个性签名（可选）"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-red-500"
                />
                <button
                  onClick={() => {
                    if (!addName.trim()) return
                    register(addName, addAvatar, addBio)
                    setAddName('')
                    setAddBio('')
                    setShowAdd(false)
                    setShowAccounts(false)
                  }}
                  disabled={!addName.trim()}
                  className="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  创建并登录
                </button>
              </div>
            )}
          </div>
        )}
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
          <div className="mb-2 mt-4 text-sm font-medium">个性签名</div>
          <textarea
            value={draftBio}
            onChange={(e) => setDraftBio(e.target.value)}
            rows={2}
            maxLength={80}
            placeholder="一句话介绍自己…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-red-500"
          />
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
              {t.key === 'followers'
                ? social.followersCount(activeId ?? '')
                : t.key === 'following'
                  ? followed.length
                  : lists[t.key].length}
            </span>
          </button>
        ))}
      </div>

      {tab === 'following' ? (
        (() => {
          const realFollowees = social.followingList(activeId ?? '')
          const realNames = new Set(realFollowees.map((a) => a.name))
          const mockFollowees = followed.filter((n) => !realNames.has(n))
          if (realFollowees.length === 0 && mockFollowees.length === 0)
            return (
              <div className="py-16 text-center text-muted-foreground">
                还没有关注任何人。去视频详情页点「+ 关注」，或逛逛首页关注流吧～
              </div>
            )
          return (
            <div className="space-y-3">
              {realFollowees.map((a) => (
                <AccountRow
                  key={a.id}
                  name={a.name}
                  avatar={a.avatar}
                  bio={a.bio}
                  mutual={social.mutualWith(a.id)}
                  followedByMe
                  onOpen={() => onOpenAccount(a.id)}
                  onToggle={() => social.follow(a.name, a.id)}
                />
              ))}
              {mockFollowees.map((name) => (
                <div key={name} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-base font-bold text-white">
                    {Array.from(name)[0] ?? 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">@{name}</div>
                    <div className="truncate text-xs text-muted-foreground">{videosByAuthor(name).length} 个视频</div>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`取消关注 @${name}？`)) toggleFollow(name)
                    }}
                    className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:border-red-500 hover:text-red-500"
                  >
                    取关
                  </button>
                </div>
              ))}
            </div>
          )
        })()
      ) : tab === 'followers' ? (
        social.followersCount(activeId ?? '') === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            还没有粉丝。去「动态」页关注其他账号，或发个视频吸引大家吧～
          </div>
        ) : (
          <div className="space-y-3">
            {social.followersList(activeId ?? '').map((f) => (
              <AccountRow
                key={f.id}
                name={f.name}
                avatar={f.avatar}
                bio={f.bio}
                mutual={social.mutualWith(f.id)}
                followedByMe={social.isFollowingAccount(f.id)}
                onOpen={() => onOpenAccount(f.id)}
                onToggle={() => social.follow(f.name, f.id)}
              />
            ))}
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

// 关注/粉丝列表中的账号行（可点开主页、可互相关注/取关）
function AccountRow({
  name,
  avatar,
  bio,
  mutual,
  followedByMe,
  onOpen,
  onToggle,
}: {
  name: string
  avatar: string
  bio: string
  mutual: boolean
  followedByMe: boolean
  onOpen: () => void
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-base font-bold text-white">
          {avatar}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate font-semibold">
            <span className="truncate">{name}</span>
            {mutual && <span className="text-xs text-emerald-500">互关</span>}
          </div>
          <div className="truncate text-xs text-muted-foreground">{bio || '本地账号'}</div>
        </div>
      </button>
      <button
        onClick={onToggle}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
          followedByMe
            ? 'border border-border bg-background text-muted-foreground hover:text-foreground'
            : 'bg-red-600 text-white hover:bg-red-500'
        }`}
      >
        {followedByMe ? '已关注' : '+ 关注'}
      </button>
    </div>
  )
}
