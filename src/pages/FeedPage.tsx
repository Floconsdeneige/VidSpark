import { useMemo, useState } from 'react'
import type { Video } from '@/data/mock'
import { useInteractions } from '@/hooks/useInteractions'
import { useAccount } from '@/hooks/useAccount'
import { useSocial } from '@/hooks/useSocial'
import { readAccountUploads } from '@/hooks/useLibrary'
import { readAccountInteractions } from '@/hooks/useInteractions'

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
  const [feedTab, setFeedTab] = useState<'follow' | 'friends' | 'recommend'>('follow')

  // 推荐关注：尚未关注的真实账号（不含自己）
  const recommended = useMemo(
    () => accounts.filter((a) => a.id !== activeId && !social.isFollowingAccount(a.id)).slice(0, 12),
    [accounts, activeId, social],
  )

  const items = useMemo<FItem[]>(() => {
    const out: FItem[] = []
    const followedAccounts = social.followingList(activeId ?? '')
    const followedIds = new Set(followedAccounts.map((a) => a.id))
    const followedSet = new Set(followed)
    const myIds = new Set(userUploads.map((u) => u.id))

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

    // 2) 关注账号的投稿（读取其本地上传仓库，改名/重名也能命中）
    followedAccounts.forEach((a) => {
      readAccountUploads(a.id).forEach((v) => {
        out.push({
          key: `f-up-${a.id}-${v.id}`,
          type: 'upload',
          user: a.name,
          avatar: a.avatar,
          text: `发布了新视频《${v.title}》`,
          targetVideo: v,
        })
      })
    })
    // 2b) 库内作者（按名字/账号 id 关注，多为预设作者）的投稿
    allVideos.forEach((v) => {
      if (!myIds.has(v.id) && (followedSet.has(v.author) || (v.authorId != null && followedIds.has(v.authorId)))) {
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

    // 3) 关注账号的互动（B站动态双向化：TA 赞了/投币了/收藏了什么，进我的关注流）
    const extraVideos = followedAccounts.flatMap((a) => readAccountUploads(a.id))
    const resolve = (id: number) => allVideos.find((v) => v.id === id) ?? extraVideos.find((v) => v.id === id)
    followedAccounts.forEach((a) => {
      const inter = readAccountInteractions(a.id)
      const pushFrom = (ids: number[], type: 'like' | 'coin' | 'fav') => {
        ids.forEach((id) => {
          const v = resolve(id)
          if (v)
            out.push({
              key: `${type}-${a.id}-${id}`,
              type,
              user: a.name,
              avatar: a.avatar,
              text: `${VERB[type]}《${v.title}》`,
              targetVideo: v,
            })
        })
      }
      pushFrom(inter.liked, 'like')
      pushFrom(inter.coined, 'coin')
      pushFrom(inter.faved, 'fav')
    })

    // 4) 我的关注行为
    followed.forEach((a) => {
      out.push({
        key: `follow-${a}`,
        type: 'follow',
        user: account.name,
        avatar: account.avatar,
        text: `关注了 @${a}`,
      })
    })

    // 5) 我的互动（点赞 / 投币 / 收藏）
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
  }, [allVideos, userUploads, liked, coined, faved, followed, account.name, account.avatar, social, activeId])

  // 朋友：仅互关（双向关注）账号的投稿（抖音「朋友」流）
  const friendsItems = useMemo<FItem[]>(() => {
    const out: FItem[] = []
    social.followingList(activeId ?? '').forEach((a) => {
      if (!social.mutualWith(a.id)) return
      readAccountUploads(a.id).forEach((v) => {
        out.push({
          key: `fr-${a.id}-${v.id}`,
          type: 'upload',
          user: a.name,
          avatar: a.avatar,
          text: `发布了新视频《${v.title}》`,
          targetVideo: v,
        })
      })
    })
    return out
  }, [social, activeId])

  // 推荐：未关注账号的投稿，按播放量排序的发现流（抖音「推荐」流）
  const recommendItems = useMemo<FItem[]>(() => {
    const followedSet = new Set(followed)
    const followedIds = new Set(social.followingList(activeId ?? '').map((a) => a.id))
    const myIds = new Set(userUploads.map((u) => u.id))
    return allVideos
      .filter(
        (v) =>
          !myIds.has(v.id) &&
          !followedSet.has(v.author) &&
          !(v.authorId != null && followedIds.has(v.authorId)),
      )
      .sort((a, b) => b.viewsNum - a.viewsNum)
      .slice(0, 24)
      .map((v) => ({
        key: `rec-${v.id}`,
        type: 'upload' as const,
        user: v.author,
        avatar: Array.from(v.author)[0] ?? 'U',
        text: `发布了新视频《${v.title}》`,
        targetVideo: v,
      }))
  }, [allVideos, userUploads, followed, social, activeId])

  const display = feedTab === 'friends' ? friendsItems : feedTab === 'recommend' ? recommendItems : items

  return (
    <main className="px-6 pb-20 pt-8">
      <h1 className="mb-1 text-2xl font-bold">📰 动态</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        根据你的关注、投稿与互动实时生成 · @{account.name}
      </p>

      {/* 抖音式三栏分流：关注 / 朋友(互关) / 推荐(发现) */}
      <div className="mb-6 flex gap-2">
        {([
          { k: 'follow', label: '关注' },
          { k: 'friends', label: '朋友' },
          { k: 'recommend', label: '推荐' },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setFeedTab(t.k)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              feedTab === t.k ? 'bg-red-600 text-white' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.k === 'friends' && social.followingList(activeId ?? '').filter((a) => social.mutualWith(a.id)).length > 0 && (
              <span className="ml-1 text-xs">·{social.followingList(activeId ?? '').filter((a) => social.mutualWith(a.id)).length}</span>
            )}
          </button>
        ))}
      </div>

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

      {display.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {feedTab === 'friends'
            ? '还没有互关的朋友。去视频详情页关注其他账号，对方也关注你后即出现在「朋友」流～'
            : feedTab === 'recommend'
              ? '暂时没有可推荐的视频，去关注几位 UP 主或发个视频吧～'
              : '还没有动态。去关注几位 UP 主、发个视频或点个赞，这里就会热闹起来～'}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-3">
          {display.map((item) => {
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
