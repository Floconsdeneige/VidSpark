import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { loadJSON, saveJSON, deleteBlob } from '@/lib/db'
import { PRESET_COMMENTS, type Comment, type Video } from '@/data/mock'
import { useAccount } from '@/hooks/useAccount'
import { uploadsKey, commentsKey, engagementKey, LEGACY } from '@/lib/accountKeys'

type Engagement = { views: Record<number, number>; history: number[] }

const emptyEngage: Engagement = { views: {}, history: [] }

// 读取按账号键；默认账号 'me' 首次启动把旧全局键迁移到按账号键（保护老用户数据）。
function migrate(id: string | null, perKey: string, legacyKey: string): string | null {
  if (!id) return null
  try {
    const raw = localStorage.getItem(perKey)
    if (raw) return raw
    if (id === 'me') {
      const legacy = localStorage.getItem(legacyKey)
      if (legacy) {
        localStorage.setItem(perKey, legacy)
        localStorage.removeItem(legacyKey)
        return legacy
      }
    }
  } catch {
    /* 忽略 */
  }
  return null
}

function loadUploads(id: string | null): Video[] {
  return migrate(id, uploadsKey(id ?? ''), LEGACY.uploads) ? loadJSON<Video[]>(uploadsKey(id ?? ''), []) : []
}
function loadComments(id: string | null): Record<number, Comment[]> {
  return migrate(id, commentsKey(id ?? ''), LEGACY.comments)
    ? loadJSON<Record<number, Comment[]>>(commentsKey(id ?? ''), {})
    : {}
}
function loadEngage(id: string | null): Engagement {
  return migrate(id, engagementKey(id ?? ''), LEGACY.engagement)
    ? loadJSON<Engagement>(engagementKey(id ?? ''), emptyEngage)
    : emptyEngage
}

export type LibraryCtx = {
  /** 用户上传的视频（含持久化，按账号隔离） */
  userVideos: Video[]
  addUpload: (v: Video) => void
  removeUpload: (v: Video) => void
  /** 某视频的评论（持久化评论 + 预设评论，新评论在前） */
  getComments: (id: number) => Comment[]
  /** 仅用户持久化评论（可删除），新评论在前 */
  getUserComments: (id: number) => Comment[]
  addComment: (id: number, text: string, author?: string) => void
  /** 删除某视频的第 index 条用户评论（index 对应用户评论数组下标） */
  deleteComment: (id: number, index: number) => void
  /** 播放量 = 基础量 + 增量 */
  viewCount: (v: Video) => number
  /** 打开视频时调用：播放量 +1 并写入观看历史 */
  incrementView: (id: number) => void
  /** 观看历史（video id 列表，最新在前） */
  history: number[]
}

const Ctx = createContext<LibraryCtx | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { activeId } = useAccount()
  const skip = useRef(false)
  const [userVideos, setUserVideos] = useState<Video[]>(() => loadUploads(activeId))
  const [comments, setComments] = useState<Record<number, Comment[]>>(() => loadComments(activeId))
  const [engagement, setEngagement] = useState<Engagement>(() => loadEngage(activeId))

  // 切换账号：以新账号数据重载（skip 防止把旧账号数据误写进新账号键）
  useEffect(() => {
    skip.current = true
    setUserVideos(loadUploads(activeId))
    setComments(loadComments(activeId))
    setEngagement(loadEngage(activeId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  useEffect(() => {
    if (skip.current) {
      skip.current = false
      return
    }
    if (activeId) saveJSON(uploadsKey(activeId), userVideos)
  }, [userVideos, activeId])
  useEffect(() => {
    if (skip.current) {
      skip.current = false
      return
    }
    if (activeId) saveJSON(commentsKey(activeId), comments)
  }, [comments, activeId])
  useEffect(() => {
    if (skip.current) {
      skip.current = false
      return
    }
    if (activeId) saveJSON(engagementKey(activeId), engagement)
  }, [engagement, activeId])

  const addUpload = (v: Video) => setUserVideos((prev) => [v, ...prev])

  const removeUpload = (v: Video) => {
    setUserVideos((prev) => prev.filter((x) => x.id !== v.id))
    // 清理关联数据
    if (v.blobKey) deleteBlob(v.blobKey).catch(() => {})
    setComments((prev) => {
      if (!(v.id in prev)) return prev
      const next = { ...prev }
      delete next[v.id]
      return next
    })
    setEngagement((prev) => {
      const views = { ...prev.views }
      delete views[v.id]
      return { views, history: prev.history.filter((x) => x !== v.id) }
    })
  }

  const addComment = (id: number, text: string, author = '我') => {
    const item: Comment = {
      user: author,
      avatar: Array.from(author)[0] ?? '我',
      text: text.trim(),
      time: '刚刚',
    }
    setComments((prev) => ({ ...prev, [id]: [item, ...(prev[id] ?? [])] }))
  }

  const deleteComment = (id: number, index: number) => {
    setComments((prev) => {
      const arr = prev[id] ?? []
      if (index < 0 || index >= arr.length) return prev
      const next = arr.filter((_, i) => i !== index)
      const copy = { ...prev }
      if (next.length === 0) delete copy[id]
      else copy[id] = next
      return copy
    })
  }

  const getComments = (id: number): Comment[] => [...(comments[id] ?? []), ...PRESET_COMMENTS]
  const getUserComments = (id: number): Comment[] => comments[id] ?? []

  const viewCount = (v: Video) => v.viewsNum + (engagement.views[v.id] ?? 0)

  const incrementView = (id: number) =>
    setEngagement((prev) => ({
      views: { ...prev.views, [id]: (prev.views[id] ?? 0) + 1 },
      history: [id, ...prev.history.filter((x) => x !== id)].slice(0, 50),
    }))

  const ctx: LibraryCtx = {
    userVideos,
    addUpload,
    removeUpload,
    getComments,
    getUserComments,
    addComment,
    deleteComment,
    viewCount,
    incrementView,
    history: engagement.history,
  }

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export function useLibrary(): LibraryCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLibrary 必须在 LibraryProvider 内使用')
  return c
}
