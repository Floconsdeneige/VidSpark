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

  // —— 收藏夹（组合 useInteractions.faved 与 useAccount.favFolders，保持两者一致） ——
  const favFolders = acc.favFolders
  const isFaved = (id: number) => inter.isFaved(id)
  /** 收藏到默认收藏夹 */
  const fav = (id: number) => {
    if (!inter.isFaved(id)) inter.toggleFav(id)
    acc.favFolderAdd(id, 'default')
  }
  /** 取消收藏（从 faved 与所有收藏夹移除） */
  const unfav = (id: number) => {
    if (inter.isFaved(id)) inter.toggleFav(id)
    acc.favClearAll(id)
  }
  /** 在指定收藏夹中切换该视频（同步 faved 集合） */
  const toggleFolder = (id: number, folderId: string) => {
    const folder = acc.favFolders.find((f) => f.id === folderId)
    const inFolder = folder?.videoIds.includes(id) ?? false
    if (inFolder) {
      acc.favFolderRemove(id, folderId)
      const still = acc.favFolders.some((f) => f.id !== folderId && f.videoIds.includes(id))
      if (!still && inter.isFaved(id)) inter.toggleFav(id)
    } else {
      acc.favFolderAdd(id, folderId)
      if (!inter.isFaved(id)) inter.toggleFav(id)
    }
  }
  const inFolder = (id: number, folderId: string) =>
    acc.favFolders.find((f) => f.id === folderId)?.videoIds.includes(id) ?? false
  const createFavFolder = (name: string) => acc.createFavFolder(name)

  // —— 一键三连（B站签名）：确保点赞 + 投币 + 收藏全开，返回是否产生了变化 ——
  const triple = (id: number) => {
    let changed = false
    if (!inter.isLiked(id)) {
      inter.toggleLike(id)
      changed = true
    }
    if (!inter.isCoined(id)) {
      inter.toggleCoin(id)
      changed = true
    }
    if (!inter.isFaved(id)) {
      inter.toggleFav(id)
      acc.favFolderAdd(id, 'default')
      changed = true
    }
    return changed
  }

  return {
    follow,
    isFollowed,
    // 收藏夹
    favFolders,
    isFaved,
    fav,
    unfav,
    toggleFolder,
    inFolder,
    createFavFolder,
    // 一键三连
    triple,
    // 社交关系图
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
    // 私信（DM）
    sendDM: acc.sendDM,
    dmConversations: acc.dmConversations,
    dmUnreadCount: acc.dmUnreadCount,
    markDMRead: acc.markDMRead,
    getConversation: acc.getConversation,
  }
}
