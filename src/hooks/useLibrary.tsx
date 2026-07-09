import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { loadJSON, saveJSON, deleteBlob } from '@/lib/db'
import { PRESET_COMMENTS, type Comment, type Video } from '@/data/mock'

const UPLOAD_KEY = 'vidspark_uploads_v1'
const COMMENT_KEY = 'vidspark_comments_v1'
const ENGAGE_KEY = 'vidspark_engagement_v1'

type Engagement = { views: Record<number, number>; history: number[] }

const emptyEngage: Engagement = { views: {}, history: [] }

export type LibraryCtx = {
  /** 用户上传的视频（含持久化） */
  userVideos: Video[]
  addUpload: (v: Video) => void
  removeUpload: (v: Video) => void
  /** 某视频的评论（持久化评论 + 预设评论，新评论在前） */
  getComments: (id: number) => Comment[]
  addComment: (id: number, text: string, author?: string) => void
  /** 播放量 = 基础量 + 增量 */
  viewCount: (v: Video) => number
  /** 打开视频时调用：播放量 +1 并写入观看历史 */
  incrementView: (id: number) => void
  /** 观看历史（video id 列表，最新在前） */
  history: number[]
}

const Ctx = createContext<LibraryCtx | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [userVideos, setUserVideos] = useState<Video[]>(() => loadJSON(UPLOAD_KEY, []))
  const [comments, setComments] = useState<Record<number, Comment[]>>(() => loadJSON(COMMENT_KEY, {}))
  const [engagement, setEngagement] = useState<Engagement>(() => loadJSON(ENGAGE_KEY, emptyEngage))

  useEffect(() => saveJSON(UPLOAD_KEY, userVideos), [userVideos])
  useEffect(() => saveJSON(COMMENT_KEY, comments), [comments])
  useEffect(() => saveJSON(ENGAGE_KEY, engagement), [engagement])

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

  const getComments = (id: number): Comment[] => [...(comments[id] ?? []), ...PRESET_COMMENTS]

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
    addComment,
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
