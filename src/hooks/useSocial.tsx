import { useAccount } from '@/hooks/useAccount'
import { useInteractions } from '@/hooks/useInteractions'

/**
 * 社交操作统一入口：把「按名字的内容过滤关注」(useInteractions.followed)
 * 与「真实账号间的双向关系图 + 通知」(useAccount) 组合成一个动作。
 *
 * 设计要点（第一性）：
 * - 关注一个「真实账号」= 同时 (a) 把其名字加入 followed（让「只看关注的人」/动态聚合生效）
 *   与 (b) 在账号关系图里建立双向边 + 向对方推送关注通知。
 * - 关注一个「mock 作者」（仅名字、无账号）→ 只更新 followed，保持内容过滤可用。
 * 这样内容过滤（依赖作者名）与社交图谱（依赖账号 id）各司其职、互不破坏。
 */
export function useSocial() {
  const acc = useAccount()
  const inter = useInteractions()

  /** 关注/取关：name 为作者名（用于内容过滤），id 为真实账号 id（用于关系图，可选） */
  const follow = (name: string, id?: string) => {
    inter.toggleFollow(name)
    if (id) acc.socialFollow(id)
  }

  const isFollowed = (name: string) => inter.isFollowed(name)

  return {
    follow,
    isFollowed,
    isFollowingAccount: acc.isFollowingAccount,
    mutualWith: acc.mutualWith,
    followersList: acc.followersList,
    followingList: acc.followingList,
    followersCount: (id: string) => acc.followersList(id).length,
    followingCount: (id: string) => acc.followingList(id).length,
    pushNotification: acc.pushNotification,
    notifications: acc.notifications,
    unreadCount: acc.unreadCount,
    markNotificationsRead: acc.markNotificationsRead,
  }
}
