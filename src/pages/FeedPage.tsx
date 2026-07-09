import { useMemo } from 'react'
import type { Video } from '@/data/mock'
import { useInteractions } from '@/hooks/useInteractions'
import { useAccount } from '@/hooks/useAccount'
import { useSocial } from '@/hooks/useSocial'

type FItem = {
  key: string
  type: 'upload' | 'like' | 'coin' | 'fav' | 'follow'
  user: string
  avatar: string
  text: string
  targetVideo?: Video
}

const META: Record<FItem['type'], { icon: string; color: string; label: string }> = {
  upload: { icon: '📹', color: '#ef4444', label: '投稿' },
  like: { icon: '❤️', color: '#ec4899', label: '点赞' },
  coin: { icon: '🪙', color: '#f59e0b', label: '投币' },
  fav: { icon: '⭐', color: '#f59e0b', label: '收藏' },
  follow: { icon: '➕', color: '#10b981', label: '关注' },
}

const VERB: Record<'like' | 'coin' | 'fav', string> = {
  like: '赞了',
  coin: '投币了',
  fav: '收藏了',
}

export default function FeedPage({
  allVideos,
  userUploads,
  onPlay,
  onOpenAccount,
}: {
  allVideos: Video[]
  userUploads: Video[]
  onPlay: (v: Video) => void
  onOpenAccount: (id: string) => void
}) {
  const { liked, coined, faved, followed } = useInteractions()
  const { account, accounts, activeId } = useAccount()
  const social = useSocial()

  // 推荐关注：尚未关注的真实账号（不含自己）
  const recommended = useMemo(
    () => accounts.filter((a) => a.id !== activeId && !social.isFollowingAccount(a.id)).slice(0, 12),
    [accounts, activeId, social],
  )

  const items = useMemo<FItem[]>(() => {
    const out: FItem[] = []

    // 1) 我的投稿（最新在前）
    userUploads.forEach((v) => {
      out.push({
        key: `me-up-${v.id}`,
        type: 'upload',
        user: account.name,
        avatar: account.avatar,
        text: `发布了新视频《${v.title}》`,
        targetVideo: v,
      })
    })

    // 2) 我关注的 UP 主投稿
    const followedSet = new Set(followed)
    const myIds = new Set(userUploads.map((u) => u.id))
    allVideos.forEach((v) => {
      if (followedSet.has(v.author) && !myIds.has(v.id)) {
        out.push({
          key: `f-up-${v.id}`,
          type: 'upload',
          user: v.author,
          avatar: Array.from(v.author)[0] ?? 'U',
          text: `发布了新视频《${v.title}》`,
          targetVideo: v,
        })
      }
    })

    // 3) 我的关注行为
    followed.forEach((a) => {
      out.push({
        key: `follow-${a}`,
        type: 'follow',
        user: account.name,
        avatar: account.avatar,
        text: `关注了 @${a}`,
      })
    })

    // 4) 我的互动（点赞 / 投币 / 收藏）
    const pushInteract = (ids: number[], type: 'like' | 'coin' | 'fav') => {
      ids.forEach((id) => {
        const v = allVideos.find((x) => x.id === id)
        if (v) {
          out.push({
            key: `${type}-${id}`,
            type,
            user: account.name,
            avatar: account.avatar,
            text: `${VERB[type]}《${v.title}》`,
            targetVideo: v,
          })
        }
      })
    }
    pushInteract(liked, 'like')
    pushInteract(coined, 'coin')
    pushInteract(faved, 'fav')

    return out
  }, [allVideos, userUploads, liked, coined, faved, followed, account.name, account.avatar])

  return (
    <main className="px-6 pb-20 pt-8">
      <h1 className="mb-1 text-2xl font-bold">📰 动态</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        根据你的关注、投稿与互动实时生成 · @{account.name}
      </p>

      {/* 推荐关注：发现其他真实账号 */}
      {recommended.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            🤝 推荐关注
            <span className="text-xs font-normal text-muted-foreground">还有 {recommended.length} 位用户</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recommended.map((a) => (
              <div
                key={a.id}
                className="flex w-44 shrink-0 flex-col items-center rounded-2xl border border-border bg-card p-4 text-center"
              >
                <button onClick={() => onOpenAccount(a.id)} className="flex flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-2xl font-bold text-white">
                    {a.avatar}
                  </div>
                  <div className="mt-2 max-w-full truncate font-semibold">{a.name}</div>
                </button>
                <div className="mt-0.5 line-clamp-1 w-full text-xs text-muted-foreground">
                  {a.bio || '本地账号'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{social.followersCount(a.id)} 粉丝</div>
                <button
                  onClick={() => social.follow(a.name, a.id)}
                  className="mt-3 w-full rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
                >
                  + 关注
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          还没有动态。去关注几位 UP 主、发个视频或点个赞，这里就会热闹起来～
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-3">
          {items.map((item) => {
            const meta = META[item.type]
            return (
              <div
                key={item.key}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:shadow-md"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                  style={{ background: meta.color }}
                >
                  {item.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-semibold">@{item.user}</span>{' '}
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                  {item.targetVideo && (
                    <button
                      onClick={() => onPlay(item.targetVideo!)}
                      className="mt-1 block w-full truncate rounded-lg bg-background px-3 py-2 text-left text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      🎬 {item.targetVideo.title}
                    </button>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{meta.icon}</span> {meta.label}
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
