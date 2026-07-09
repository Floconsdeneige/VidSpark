import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { saveJSON, loadJSON, deleteBlob } from '@/lib/db'
import { type Video } from '@/data/mock'
import {
  interactionsKey,
  uploadsKey,
  commentsKey,
  engagementKey,
  LEGACY,
} from '@/lib/accountKeys'

export type Notification = {
  id: string
  type: 'follow' | 'comment' | 'reply' | 'like' | 'coin' | 'fav'
  fromId?: string
  fromName: string
  text: string
  ts: number
  read: boolean
  videoId?: number
  videoTitle?: string
}

/** 收藏夹（B站式：收藏可按命名文件夹分组管理） */
export type FavFolder = {
  id: string
  name: string
  videoIds: number[]
}

export type Account = {
  id: string
  name: string
  avatar: string
  bio: string
  /** 关注的账号 id 列表（双向社交图的一面） */
  following: string[]
  /** 关注本账号的账号 id 列表（社交图的另一面 = 粉丝） */
  followers: string[]
  /** 本账号收到的通知（关注 / 评论 / 回复 / 点赞 / 投币 / 收藏） */
  notifications: Notification[]
  /** 收藏夹列表；每个账号至少含一个「默认收藏夹」 */
  favFolders: FavFolder[]
}

type Store = { accounts: Account[]; activeId: string | null }

const KEY = 'vidspark_accounts_v1'
const DEFAULT_ID = 'me'

const GUEST: Account = {
  id: '',
  name: '我',
  avatar: '😎',
  bio: '',
  following: [],
  followers: [],
  notifications: [],
  favFolders: [{ id: 'default', name: '默认收藏夹', videoIds: [] }],
}

function newId(): string {
  return `id-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

// 归一化：兼容旧账号（无 following/followers/notifications/favFolders 字段）默认补空，避免读 undefined。
function normalize(a: Partial<Account> & { id: string }): Account {
  const ff = Array.isArray(a.favFolders) ? a.favFolders.filter((f) => f && f.id) : []
  // 每个账号至少保留一个「默认收藏夹」，保证收藏动作有落点
  const favFolders: FavFolder[] = ff.some((f) => f.id === 'default')
    ? ff
    : [{ id: 'default', name: '默认收藏夹', videoIds: [] }, ...ff]
  return {
    id: a.id,
    name: (a.name ?? '').trim() || '我',
    avatar: a.avatar || '😎',
    bio: a.bio ?? '',
    following: Array.isArray(a.following) ? a.following : [],
    followers: Array.isArray(a.followers) ? a.followers : [],
    notifications: Array.isArray(a.notifications) ? a.notifications.map((n) => ({ ...n })) : [],
    favFolders,
  }
}

// 首次启动：若已是新格式则直接返回；否则用旧单账号键(vidspark_account_v1)迁移，
// 或从无到有播种一个默认账号（自动登录，保持"打开即用"的体验）。
function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Store
      if (Array.isArray(s.accounts) && s.accounts.length) {
        const accounts = s.accounts.map(normalize)
        const active = accounts.some((a) => a.id === s.activeId) ? s.activeId : accounts[0].id
        return { accounts, activeId: active }
      }
    }
  } catch {
    /* 损坏则回退到播种 */
  }
  // 迁移旧单账号
  const old = loadJSON<Partial<Account>>(LEGACY.account, {})
  const seeded: Account = {
    id: DEFAULT_ID,
    name: (old.name ?? '').trim() || '我',
    avatar: old.avatar || '😎',
    bio: '',
    following: [],
    followers: [],
    notifications: [],
    favFolders: [{ id: 'default', name: '默认收藏夹', videoIds: [] }],
  }
  const store: Store = { accounts: [seeded], activeId: DEFAULT_ID }
  try {
    if (localStorage.getItem(LEGACY.account) != null) localStorage.removeItem(LEGACY.account)
  } catch {
    /* 忽略 */
  }
  return store
}

export type AccountCtx = {
  accounts: Account[]
  activeId: string | null
  activeAccount: Account | null
  /** 兼容旧调用方：未登录时退回 GUEST，调用方在登录网关内不会用到 */
  account: Account
  isLoggedIn: boolean
  login: (id: string) => void
  logout: () => void
  register: (name: string, avatar: string, bio?: string) => string
  switchAccount: (id: string) => void
  deleteAccount: (id: string) => void
  updateActive: (patch: Partial<Omit<Account, 'id'>>) => void
  setName: (name: string) => void
  setAvatar: (avatar: string) => void
  setBio: (bio: string) => void
  // —— 收藏夹（B站式） ——
  /** 当前账号的收藏夹列表 */
  favFolders: FavFolder[]
  /** 新建收藏夹，返回新 folder id */
  createFavFolder: (name: string) => string
  /** 把视频加入某收藏夹 */
  favFolderAdd: (videoId: number, folderId: string) => void
  /** 把视频从某收藏夹移除 */
  favFolderRemove: (videoId: number, folderId: string) => void
  /** 把视频从所有收藏夹移除（取消收藏时调用） */
  favClearAll: (videoId: number) => void
  // —— 社交关系图 ——
  /** 当前账号是否关注了 targetId（真实账号） */
  isFollowingAccount: (targetId: string) => boolean
  /** 切换与 targetId 的关注关系；关注成功时向对方推送「关注了你」通知 */
  socialFollow: (targetId: string) => void
  /** 与 targetId 是否互关 */
  mutualWith: (targetId: string) => boolean
  /** targetId 的粉丝（真实账号）列表 */
  followersList: (targetId: string) => Account[]
  /** targetId 关注的人（真实账号）列表 */
  followingList: (targetId: string) => Account[]
  /** 向 targetId 推送一条通知（评论 / 回复等） */
  pushNotification: (targetId: string, n: Omit<Notification, 'id' | 'ts' | 'read'>) => void
  // —— 通知收件箱（当前账号） ——
  notifications: Notification[]
  unreadCount: number
  markNotificationsRead: () => void
}

const Ctx = createContext<AccountCtx | null>(null)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(load)

  useEffect(() => {
    saveJSON(KEY, store)
  }, [store])

  const accounts = store.accounts
  const activeId = store.activeId
  const activeAccount = accounts.find((a) => a.id === activeId) ?? null

  const ctx: AccountCtx = {
    accounts,
    activeId,
    activeAccount,
    account: activeAccount ?? GUEST,
    isLoggedIn: activeId != null,
    login: (id) =>
      setStore((s) => ({ accounts: s.accounts, activeId: s.accounts.some((a) => a.id === id) ? id : s.activeId })),
    logout: () => setStore((s) => ({ accounts: s.accounts, activeId: null })),
    register: (name, avatar, bio = '') => {
    const acc: Account = {
      id: `acc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: (name.trim() || '我').slice(0, 16),
      avatar,
      bio: bio.slice(0, 80),
      following: [],
      followers: [],
      notifications: [],
      favFolders: [{ id: 'default', name: '默认收藏夹', videoIds: [] }],
    }
      setStore((s) => ({ accounts: [...s.accounts, acc], activeId: acc.id }))
      return acc.id
    },
    switchAccount: (id) =>
      setStore((s) => ({ accounts: s.accounts, activeId: s.accounts.some((a) => a.id === id) ? id : s.activeId })),
    deleteAccount: (id) => {
      const remaining = accounts.filter((a) => a.id !== id)
      // 清理其他账号关系图中对本账号的引用，避免悬空 id
      const cleaned = remaining.map((a) => ({
        ...a,
        following: a.following.filter((x) => x !== id),
        followers: a.followers.filter((x) => x !== id),
      }))
      setStore({
        accounts: cleaned,
        activeId: activeId === id ? (cleaned[0]?.id ?? null) : activeId,
      })
      // 清理该账号的持久化数据（含上传视频的 IndexedDB blob）
      const ups = loadJSON<Video[]>(uploadsKey(id), [])
      ups.forEach((v) => {
        if (v.blobKey) deleteBlobSafe(v.blobKey)
      })
      for (const k of [interactionsKey(id), uploadsKey(id), commentsKey(id), engagementKey(id)]) {
        try {
          localStorage.removeItem(k)
        } catch {
          /* 忽略 */
        }
      }
    },
    updateActive: (patch) => {
      if (!activeId) return
      setStore((s) => ({
        accounts: s.accounts.map((a) => (a.id === activeId ? { ...a, ...patch } : a)),
        activeId,
      }))
    },
    setName: (name) => ctx.updateActive({ name: name.trim() || '我' }),
    setAvatar: (avatar) => ctx.updateActive({ avatar }),
    setBio: (bio) => ctx.updateActive({ bio }),

    // —— 收藏夹 ——
    favFolders: activeAccount?.favFolders ?? GUEST.favFolders,
    createFavFolder: (name) => {
      if (!activeId) return 'default'
      const id = `fav-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
      setStore((s) => ({
        ...s,
        accounts: s.accounts.map((a) =>
          a.id === activeId
            ? { ...a, favFolders: [...a.favFolders, { id, name: (name.trim() || '新建收藏夹').slice(0, 12), videoIds: [] }] }
            : a,
        ),
      }))
      return id
    },
    favFolderAdd: (videoId, folderId) => {
      if (!activeId) return
      setStore((s) => ({
        ...s,
        accounts: s.accounts.map((a) =>
          a.id === activeId
            ? {
                ...a,
                favFolders: a.favFolders.map((f) =>
                  f.id === folderId && !f.videoIds.includes(videoId)
                    ? { ...f, videoIds: [videoId, ...f.videoIds] }
                    : f,
                ),
              }
            : a,
        ),
      }))
    },
    favFolderRemove: (videoId, folderId) => {
      if (!activeId) return
      setStore((s) => ({
        ...s,
        accounts: s.accounts.map((a) =>
          a.id === activeId
            ? {
                ...a,
                favFolders: a.favFolders.map((f) =>
                  f.id === folderId ? { ...f, videoIds: f.videoIds.filter((x) => x !== videoId) } : f,
                ),
              }
            : a,
        ),
      }))
    },
    favClearAll: (videoId) => {
      if (!activeId) return
      setStore((s) => ({
        ...s,
        accounts: s.accounts.map((a) =>
          a.id === activeId
            ? { ...a, favFolders: a.favFolders.map((f) => ({ ...f, videoIds: f.videoIds.filter((x) => x !== videoId) })) }
            : a,
        ),
      }))
    },

    // —— 社交关系图 ——
    isFollowingAccount: (targetId) => !!activeAccount?.following.includes(targetId),
    socialFollow: (targetId) => {
      if (!activeId || targetId === activeId) return
      setStore((s) => {
        const me = s.accounts.find((a) => a.id === activeId)
        const target = s.accounts.find((a) => a.id === targetId)
        if (!me || !target) return s
        const was = me.following.includes(targetId)
        let next = s.accounts.map((a) => {
          if (a.id === activeId)
            return { ...a, following: was ? a.following.filter((x) => x !== targetId) : [...a.following, targetId] }
          if (a.id === targetId)
            return { ...a, followers: was ? a.followers.filter((x) => x !== activeId) : [...a.followers, activeId] }
          return a
        })
        if (!was) {
          const notif: Notification = {
            id: newId(),
            type: 'follow',
            fromId: activeId,
            fromName: me.name,
            text: '关注了你',
            ts: Date.now(),
            read: false,
          }
          next = next.map((a) => (a.id === targetId ? { ...a, notifications: [notif, ...a.notifications].slice(0, 100) } : a))
        }
        return { ...s, accounts: next }
      })
    },
    mutualWith: (targetId) => {
      const me = activeAccount
      const t = accounts.find((a) => a.id === targetId)
      return !!me && !!t && me.following.includes(targetId) && t.following.includes(activeId!)
    },
    followersList: (targetId) => accounts.filter((a) => a.followers.includes(targetId)),
    followingList: (targetId) => accounts.filter((a) => a.following.includes(targetId)),
    pushNotification: (targetId, n) => {
      setStore((s) => ({
        ...s,
        accounts: s.accounts.map((a) =>
          a.id === targetId
            ? { ...a, notifications: [{ id: newId(), ts: Date.now(), read: false, ...n }, ...a.notifications].slice(0, 100) }
            : a,
        ),
      }))
    },

    // —— 通知收件箱 ——
    notifications: activeAccount?.notifications ?? [],
    unreadCount: (activeAccount?.notifications ?? []).filter((n) => !n.read).length,
    markNotificationsRead: () => {
      if (!activeId) return
      setStore((s) => ({
        ...s,
        accounts: s.accounts.map((a) =>
          a.id === activeId ? { ...a, notifications: a.notifications.map((n) => ({ ...n, read: true })) } : a,
        ),
      }))
    },
  }

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

// 删除账号时安全清理其上传视频的 IndexedDB blob
function deleteBlobSafe(key: string) {
  deleteBlob(key).catch(() => {})
}

export function useAccount(): AccountCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAccount 必须在 AccountProvider 内使用')
  return c
}
