import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { saveJSON } from '@/lib/db'
import { useAccount } from '@/hooks/useAccount'
import { interactionsKey, LEGACY } from '@/lib/accountKeys'

export type Interactions = {
  liked: number[]
  coined: number[]
  faved: number[]
  followed: string[]
  watchLater: number[]
}

const empty: Interactions = { liked: [], coined: [], faved: [], followed: [], watchLater: [] }

function parse(raw: string): Interactions {
  const p = JSON.parse(raw) as Partial<Interactions>
  return {
    liked: p.liked ?? [],
    coined: p.coined ?? [],
    faved: p.faved ?? [],
    followed: p.followed ?? [],
    watchLater: p.watchLater ?? [],
  }
}

// 按账号读取；默认账号 'me' 首次启动时把旧全局键迁移到按账号键，避免老用户数据丢失。
function load(id: string | null): Interactions {
  if (!id) return empty
  const key = interactionsKey(id)
  try {
    const raw = localStorage.getItem(key)
    if (raw) return parse(raw)
    if (id === 'me') {
      const legacy = localStorage.getItem(LEGACY.interactions)
      if (legacy) {
        localStorage.setItem(key, legacy)
        localStorage.removeItem(LEGACY.interactions)
        return parse(legacy)
      }
    }
  } catch {
    /* 忽略 */
  }
  return empty
}

export type InteractionsCtx = {
  isLiked: (id: number) => boolean
  toggleLike: (id: number) => void
  isCoined: (id: number) => boolean
  toggleCoin: (id: number) => void
  isFaved: (id: number) => boolean
  toggleFav: (id: number) => void
  isFollowed: (author: string) => boolean
  toggleFollow: (author: string) => void
  isWatchLater: (id: number) => boolean
  toggleWatchLater: (id: number) => void
  liked: number[]
  coined: number[]
  faved: number[]
  followed: string[]
  watchLater: number[]
  likes: (base: number, id: number) => number
  coins: (base: number, id: number) => number
  favs: (base: number, id: number) => number
}

const Ctx = createContext<InteractionsCtx | null>(null)

export function InteractionsProvider({ children }: { children: ReactNode }) {
  const { activeId } = useAccount()
  const [state, setState] = useState<Interactions>(() => load(activeId))
  // 切换账号瞬间：先以新账号数据重载，再阻止一次"把旧账号数据写进新账号键"的误写
  const skipSave = useRef(false)

  useEffect(() => {
    skipSave.current = true
    setState(load(activeId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    if (activeId) saveJSON(interactionsKey(activeId), state)
  }, [state, activeId])

  const toggle = (key: keyof Interactions, val: number | string) => {
    setState((s) => {
      const arr = s[key] as (number | string)[]
      const has = arr.includes(val)
      const next = has ? arr.filter((x) => x !== val) : [...arr, val]
      return { ...s, [key]: next }
    })
  }

  const ctx: InteractionsCtx = {
    isLiked: (id) => state.liked.includes(id),
    toggleLike: (id) => toggle('liked', id),
    isCoined: (id) => state.coined.includes(id),
    toggleCoin: (id) => toggle('coined', id),
    isFaved: (id) => state.faved.includes(id),
    toggleFav: (id) => toggle('faved', id),
    isFollowed: (a) => state.followed.includes(a),
    toggleFollow: (a) => toggle('followed', a),
    isWatchLater: (id) => state.watchLater.includes(id),
    toggleWatchLater: (id) => toggle('watchLater', id),
    liked: state.liked,
    coined: state.coined,
    faved: state.faved,
    followed: state.followed,
    watchLater: state.watchLater,
    likes: (base, id) => base + (state.liked.includes(id) ? 1 : 0),
    coins: (base, id) => base + (state.coined.includes(id) ? 1 : 0),
    favs: (base, id) => base + (state.faved.includes(id) ? 1 : 0),
  }

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export function useInteractions(): InteractionsCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useInteractions 必须在 InteractionsProvider 内使用')
  return c
}
