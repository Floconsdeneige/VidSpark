import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { saveJSON } from '@/lib/db'

export type Account = { name: string; avatar: string }

const KEY = 'vidspark_account_v1'
const def: Account = { name: '我', avatar: '😎' }

function load(): Account {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return def
    const p = JSON.parse(raw) as Partial<Account>
    return { name: (p.name ?? '').trim() || '我', avatar: p.avatar || '😎' }
  } catch {
    return def
  }
}

export type AccountCtx = {
  account: Account
  setName: (name: string) => void
  setAvatar: (avatar: string) => void
}

const Ctx = createContext<AccountCtx | null>(null)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account>(load)

  useEffect(() => {
    saveJSON(KEY, account)
  }, [account])

  const ctx: AccountCtx = {
    account,
    setName: (name) => setAccount((prev) => ({ ...prev, name: name.trim() || '我' })),
    setAvatar: (avatar) => setAccount((prev) => ({ ...prev, avatar })),
  }

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export function useAccount(): AccountCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAccount 必须在 AccountProvider 内使用')
  return c
}
