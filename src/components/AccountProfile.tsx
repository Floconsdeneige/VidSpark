import { useState } from 'react'
import VideoCard from '@/components/VideoCard'
import type { Video } from '@/data/mock'
import { useAccount } from '@/hooks/useAccount'
import { useSocial } from '@/hooks/useSocial'
import { readAccountUploads } from '@/hooks/useLibrary'

type Sub = 'uploads' | 'followers' | 'following'

export default function AccountProfile({
  accountId,
  onClose,
  onPlay,
  onOpenAccount,
}: {
  accountId: string | null
  onClose: () => void
  onPlay: (v: Video) => void
  onOpenAccount: (id: string) => void
}) {
  const { accounts, activeId } = useAccount()
  const social = useSocial()
  const [sub, setSub] = useState<Sub>('uploads')

  if (!accountId) return null
  const acc = accounts.find((a) => a.id === accountId)
  if (!acc) return null

  const isMe = acc.id === activeId
  const uploads = readAccountUploads(acc.id)
  const followers = social.followersList(acc.id)
  const following = social.followingList(acc.id)
  const followedByMe = !isMe && social.isFollowingAccount(acc.id)
  const mutual = !isMe && social.mutualWith(acc.id)

  const toggleFollow = () => {
    if (isMe) return
    social.follow(acc.name, acc.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-background text-foreground sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
          <div className="text-sm font-semibold">个人主页</div>
          <button onClick={onClose} className="rounded-full px-2 text-xl leading-none text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-3xl font-bold text-white">
              {acc.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-bold">{acc.name}</h2>
                {mutual && (
                  <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-xs font-medium text-emerald-500">
                    互关
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground">{acc.bio || '这个人很懒，什么都没写～'}</p>
            </div>
            {!isMe && (
              <button
                onClick={toggleFollow}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  followedByMe ? 'border border-border bg-card text-muted-foreground hover:text-foreground' : 'bg-red-600 text-white hover:bg-red-500'
                }`}
              >
                {followedByMe ? '已关注' : '+ 关注'}
              </button>
            )}
            {isMe && <span className="shrink-0 rounded-full bg-card px-4 py-2 text-sm text-muted-foreground">这是你</span>}
          </div>

          {/* 统计 */}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { label: '投稿', n: uploads.length },
              { label: '粉丝', n: followers.length },
              { label: '关注', n: following.length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-card py-3">
                <div className="text-lg font-bold">{s.n}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* 子标签 */}
          <div className="mt-5 flex gap-2">
            {([
              { k: 'uploads', label: '投稿' },
              { k: 'followers', label: `粉丝 ${followers.length}` },
              { k: 'following', label: `关注 ${following.length}` },
            ] as { k: Sub; label: string }[]).map((t) => (
              <button
                key={t.k}
                onClick={() => setSub(t.k)}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  sub === t.k ? 'bg-red-600 text-white' : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 内容 */}
          <div className="mt-4">
            {sub === 'uploads' &&
              (uploads.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">还没有投稿</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {uploads.map((v) => (
                    <VideoCard key={v.id} video={v} onClick={() => onPlay(v)} />
                  ))}
                </div>
              ))}

            {sub === 'followers' &&
              (followers.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">还没有粉丝</div>
              ) : (
                <div className="space-y-2">
                  {followers.map((f) => (
                    <AccountRow
                      key={f.id}
                      acc={f}
                      mutual={social.mutualWith(f.id)}
                      followedByMe={social.isFollowingAccount(f.id)}
                      onOpen={() => onOpenAccount(f.id)}
                      onToggle={() => social.follow(f.name, f.id)}
                    />
                  ))}
                </div>
              ))}

            {sub === 'following' &&
              (following.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">还没有关注任何人</div>
              ) : (
                <div className="space-y-2">
                  {following.map((f) => (
                    <AccountRow
                      key={f.id}
                      acc={f}
                      mutual={social.mutualWith(f.id)}
                      followedByMe
                      onOpen={() => onOpenAccount(f.id)}
                      onToggle={() => social.follow(f.name, f.id)}
                    />
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AccountRow({
  acc,
  mutual,
  followedByMe,
  onOpen,
  onToggle,
}: {
  acc: { id: string; name: string; avatar: string; bio: string }
  mutual: boolean
  followedByMe: boolean
  onOpen: () => void
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-base font-bold text-white">
          {acc.avatar}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate font-semibold">
            <span className="truncate">{acc.name}</span>
            {mutual && <span className="text-xs text-emerald-500">互关</span>}
          </div>
          <div className="truncate text-xs text-muted-foreground">{acc.bio || '本地账号'}</div>
        </div>
      </button>
      <button
        onClick={onToggle}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
          followedByMe ? 'border border-border bg-background text-muted-foreground hover:text-foreground' : 'bg-red-600 text-white hover:bg-red-500'
        }`}
      >
        {followedByMe ? '已关注' : '+ 关注'}
      </button>
    </div>
  )
}
