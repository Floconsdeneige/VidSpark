import { useState, useRef, useEffect } from 'react'
import { categories, type CategoryKey, type Video } from '@/data/mock'
import { uid, putBlob } from '@/lib/db'

const coverOptions = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f6d365,#fda085)',
  'linear-gradient(135deg,#ee0979,#ff6a00)',
  'linear-gradient(135deg,#0f2027,#2c5364)',
  'linear-gradient(135deg,#43cea2,#185a9d)',
  'linear-gradient(135deg,#ff9a9e,#fecfef)',
]

function fmtDuration(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '00:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function UploadPage({
  onPublish,
  onGoHome,
  onPlay,
}: {
  onPublish: (v: Video) => void
  onGoHome: () => void
  onPlay: (v: Video) => void
}) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [category, setCategory] = useState<CategoryKey>('life')
  const [cover, setCover] = useState<string>(coverOptions[0])
  const [touched, setTouched] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [published, setPublished] = useState<Video | null>(null)

  // 真实文件信息
  const [fileName, setFileName] = useState('')
  const [realDuration, setRealDuration] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  // 保留选中的视频文件，发布时存入 IndexedDB 以便真实播放
  const videoFileRef = useRef<File | null>(null)
  const timerRef = useRef<number | null>(null)
  const finalizedRef = useRef(false)

  const titleError = !title.trim()

  const pickVideo = (file: File) => {
    videoFileRef.current = file
    setFileName(file.name)
    // 用隐藏 video 读取真实时长
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      setRealDuration(fmtDuration(v.duration))
      URL.revokeObjectURL(url)
    }
    v.src = url
  }

  const pickCover = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setCover(dataUrl)
      setCoverPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const duration = realDuration ?? '00:00'

  const handlePublish = () => {
    setTouched(true)
    if (titleError) return
    setProgress(0)
    finalizedRef.current = false
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        const next = (p ?? 0) + Math.floor(Math.random() * 18) + 8
        return next >= 100 ? 100 : next
      })
    }, 180)
  }

  // 进度满 100 时落库（唯一 id + 真实视频文件存入 IndexedDB），再发布
  useEffect(() => {
    if (progress !== 100 || finalizedRef.current) return
    finalizedRef.current = true
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    void (async () => {
      const id = uid()
      let blobKey: string | undefined
      if (videoFileRef.current) {
        blobKey = `vid-${id}`
        try {
          await putBlob(blobKey, videoFileRef.current)
        } catch {
          blobKey = undefined
        }
      }
      const tags = tagsRaw
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
      const v: Video = {
        id,
        title: title.trim(),
        author: '我',
        views: '0',
        viewsNum: 0,
        duration,
        cover,
        category,
        publishedAt: '刚刚',
        tags: tags.length ? tags : ['新人投稿'],
        desc: desc.trim() || 'UP主暂未填写简介',
        isLocal: !!blobKey,
        blobKey,
      }
      onPublish(v)
      setPublished(v)
      setProgress(null)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  // 卸载时清理计时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (published) {
    return (
      <main className="px-6 pb-20 pt-16">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-4 text-xl font-bold">发布成功！</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            《{published.title}》已经出现在你的主页、分区、热门和动态里啦
          </p>
          <div className="mt-4 h-32 rounded-xl" style={{ background: published.cover }} />
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => onPlay(published)}
              className="flex-1 rounded-full border border-border px-4 py-2 font-medium transition hover:bg-background"
            >
              ▶ 立即观看
            </button>
            <button
              onClick={onGoHome}
              className="flex-1 rounded-full bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-500"
            >
              去首页 →
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="px-6 pb-20 pt-8">
      <h1 className="mb-1 text-2xl font-bold">📤 发布视频</h1>
      <p className="mb-6 text-sm text-muted-foreground">让 VidSpark 的慧眼替你照看每一位观众</p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        {/* 预览 */}
        <div>
          <div className="relative h-44 rounded-2xl border border-border" style={{ background: cover }}>
            <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
              {duration}
            </span>
            <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              预览
            </span>
            {coverPreview && (
              <span className="absolute right-2 top-2 rounded bg-emerald-600/90 px-1.5 py-0.5 text-xs text-white">
                已用图片封面
              </span>
            )}
          </div>
          <div className="mt-3 text-sm font-medium line-clamp-2">{title || '视频标题预览'}</div>
          <div className="text-sm text-muted-foreground">@我</div>

          {fileName && (
            <div className="mt-2 truncate rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground" title={fileName}>
              🎞 {fileName}
              {realDuration && ` · ${realDuration}`}
            </div>
          )}

          <div className="mt-4">
            <div className="mb-2 text-xs text-muted-foreground">封面底色（或上传图片）</div>
            <div className="flex flex-wrap items-center gap-2">
              {coverOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCover(c)
                    setCoverPreview(null)
                  }}
                  className={`h-9 w-9 rounded-lg border-2 ${cover === c && !coverPreview ? 'border-red-500' : 'border-transparent'}`}
                  style={{ background: c }}
                  aria-label="选择封面"
                />
              ))}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="h-9 rounded-lg border border-border bg-card px-2 text-xs text-muted-foreground transition hover:text-foreground"
              >
                🖼 上传图
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) pickCover(f)
                }}
              />
            </div>
          </div>

          {progress !== null && (
            <div className="mt-5">
              <div className="mb-1 text-xs text-muted-foreground">上传中… {progress}%</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-red-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 表单 */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="给视频起个抓人眼球的名字"
              className={`w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-red-500 ${
                touched && titleError ? 'border-red-500' : 'border-border'
              }`}
            />
            {touched && titleError && (
              <div className="mt-1 text-xs text-red-500">标题不能为空哦</div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">简介</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="说说这个视频讲了什么…"
              rows={4}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">标签</label>
            <input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="用逗号或空格分隔，如：vlog, 治愈, 猫"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">分区</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-red-500"
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 选择视频文件（真实接入） */}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) pickVideo(f)
            }}
          />
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground transition hover:border-red-500 hover:text-foreground"
          >
            <span className="text-2xl">📁</span>
            {fileName ? '点击重新选择视频文件' : '点击选择视频文件（读取真实时长）'}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={progress !== null}
            className="w-full rounded-full bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {progress !== null ? `上传中 ${progress}%` : '发布视频'}
          </button>
          {!fileName && (
            <p className="text-center text-xs text-muted-foreground">
              未选择文件时将以演示时长发布
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
