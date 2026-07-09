import { useState, useEffect } from 'react'
import {
  exportBackup,
  importBackup,
  clearAllLocal,
  localStats,
  localBlobCount,
  type Backup,
} from '@/lib/backup'

export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [stats, setStats] = useState<{ lsBytes: number; keys: number; blobCount: number }>({
    lsBytes: 0,
    keys: 0,
    blobCount: 0,
  })

  const refreshStats = async () => {
    const s = localStats()
    const blobCount = await localBlobCount()
    setStats({ ...s, blobCount })
  }

  useEffect(() => {
    void refreshStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }

  const fmtBytes = (n: number) => {
    if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`
    if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${n} B`
  }

  const onExport = async () => {
    setBusy(true)
    try {
      const data = await exportBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vidspark-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('已导出备份文件 💾')
    } catch {
      showToast('导出失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  const onImport = (file: File) => {
    setBusy(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const data = JSON.parse(String(reader.result)) as Backup
        await importBackup(data)
        showToast('导入成功，正在刷新…')
        window.setTimeout(() => window.location.reload(), 900)
      } catch (e) {
        showToast(`导入失败：${(e as Error).message}`)
        setBusy(false)
      }
    }
    reader.onerror = () => {
      showToast('读取文件失败')
      setBusy(false)
    }
    reader.readAsText(file)
  }

  const onClear = async () => {
    if (!window.confirm('确定清空全部本地数据吗？\n包括账号、关注、点赞、收藏、上传视频与观看历史。此操作不可恢复！')) return
    setBusy(true)
    try {
      await clearAllLocal()
      showToast('已清空，正在刷新…')
      window.setTimeout(() => window.location.reload(), 900)
    } catch {
      showToast('清空失败')
      setBusy(false)
    }
  }

  return (
    <main className="px-6 pb-20 pt-8">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-muted-foreground transition hover:text-foreground"
      >
        ← 返回
      </button>

      <h1 className="mb-1 text-2xl font-bold">⚙️ 设置 · 数据中心</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        VidSpark 是纯前端模拟器，所有数据保存在「此浏览器」。用下面功能可备份迁移、或彻底清空。
      </p>

      {/* 存储概览 */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">📊 本地存储概览</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold">{stats.keys}</div>
            <div className="text-xs text-muted-foreground">数据项</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{fmtBytes(stats.lsBytes)}</div>
            <div className="text-xs text-muted-foreground">localStorage</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.blobCount}</div>
            <div className="text-xs text-muted-foreground">上传视频文件</div>
          </div>
        </div>
      </section>

      {/* 数据操作 */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
          <div>
            <div className="font-medium">导出备份</div>
            <div className="text-xs text-muted-foreground">下载一份 JSON（含账号/互动/上传视频文件），可迁移到其它设备</div>
          </div>
          <button
            onClick={onExport}
            disabled={busy}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            💾 导出
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
          <div>
            <div className="font-medium">从备份恢复</div>
            <div className="text-xs text-muted-foreground">选择一个 VidSpark 备份 JSON，恢复后自动刷新页面</div>
          </div>
          <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-background disabled:opacity-50">
            📥 选择文件
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImport(f)
              }}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-card p-5">
          <div>
            <div className="font-medium text-red-500">清空全部本地数据</div>
            <div className="text-xs text-muted-foreground">删除账号、关注、点赞、收藏、上传视频与历史，不可恢复</div>
          </div>
          <button
            onClick={onClear}
            disabled={busy}
            className="rounded-full border border-red-500 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
          >
            🗑 清空
          </button>
        </div>
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        提示：上传的真实视频文件存于浏览器 IndexedDB，导出备份会一并带走；换设备导入即可继续观看。
      </p>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  )
}
