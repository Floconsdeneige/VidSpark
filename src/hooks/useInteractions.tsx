import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

export type Interactions = {
  liked: number[]
  coined: number[]
  faved: number[]
  followed: string[]
}

const KEY = 'vidspark_interactions_v1'
const empty: Interactions = { liked: [], coined: [], faved: [], followed: [] }

function load(): Interactions {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    const p = JSON.parse(raw) as Partial<Interactions>
    return {
      liked: p.liked ?? [],
      coined: p.coined ?? [],
      faved: p.faved ?? [],
      followed: p.followed ?? [],
    }
  } catch {
    return empty
  }
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
  liked: number[]
  coined: number[]
  faved: number[]
  followed: string[]
  likes: (base: number, id: number) => number
  coins: (base: number, id: number) => number
  favs: (base: number, id: number) => number
}

const Ctx = createContext<InteractionsCtx | null>(null)

export function InteractionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Interactions>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* 忽略存储异常 */
    }
  }, [state])

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
    liked: state.liked,
    coined: state.coined,
    faved: state.faved,
    followed: state.followed,
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
