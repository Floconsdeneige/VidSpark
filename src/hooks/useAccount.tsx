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

export type Account = { id: string; name: string; avatar: string; bio: string }

type Store = { accounts: Account[]; activeId: string | null }

const KEY = 'vidspark_accounts_v1'
const DEFAULT_ID = 'me'

const GUEST: Account = { id: '', name: '我', avatar: '😎', bio: '' }

function newId(): string {
  return `acc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

// 首次启动：若已是新格式则直接返回；否则用旧单账号键(vidspark_account_v1)迁移，
// 或从无到有播种一个默认账号（自动登录，保持"打开即用"的体验）。
function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Store
      if (Array.isArray(s.accounts) && s.accounts.length) {
        const active = s.accounts.some((a) => a.id === s.activeId) ? s.activeId : s.accounts[0].id
        return { accounts: s.accounts, activeId: active }
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

  const setAccountsStore = (next: Store) => setStore(next)

  const ctx: AccountCtx = {
    accounts,
    activeId,
    activeAccount,
    account: activeAccount ?? GUEST,
    isLoggedIn: activeId != null,
    login: (id) =>
      setAccountsStore({ accounts, activeId: accounts.some((a) => a.id === id) ? id : activeId }),
    logout: () => setAccountsStore({ accounts, activeId: null }),
    register: (name, avatar, bio = '') => {
      const acc: Account = { id: newId(), name: (name.trim() || '我').slice(0, 16), avatar, bio: bio.slice(0, 80) }
      const next = [...accounts, acc]
      setAccountsStore({ accounts: next, activeId: acc.id })
      return acc.id
    },
    switchAccount: (id) =>
      setAccountsStore({ accounts, activeId: accounts.some((a) => a.id === id) ? id : activeId }),
    deleteAccount: (id) => {
      const remaining = accounts.filter((a) => a.id !== id)
      setAccountsStore({
        accounts: remaining,
        activeId: activeId === id ? (remaining[0]?.id ?? null) : activeId,
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
      setAccountsStore({
        accounts: accounts.map((a) => (a.id === activeId ? { ...a, ...patch } : a)),
        activeId,
      })
    },
    setName: (name) => ctx.updateActive({ name: name.trim() || '我' }),
    setAvatar: (avatar) => ctx.updateActive({ avatar }),
    setBio: (bio) => ctx.updateActive({ bio }),
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
