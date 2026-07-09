// VidSpark 本地数据备份 / 恢复 / 清空
// 把分散在各 localStorage 键 + IndexedDB 的视频 blob 汇总成一个 JSON 包，
// 解决"纯前端模拟器跨设备不共享、清空站点数据即丢失"的固有短板。

import { getAllBlobs, putBlobFromBase64, clearAllBlobs } from '@/lib/db'

/** 需要纳入备份的 localStorage 键（与各处 KEY 保持一致） */
const LS_KEYS = [
  'vidspark_account_v1',
  'vidspark_interactions_v1',
  'vidspark_uploads_v1',
  'vidspark_comments_v1',
  'vidspark_engagement_v1',
]

export type Backup = {
  app: 'VidSpark'
  version: 1
  exportedAt: string
  localStorage: Record<string, unknown>
  blobs: Record<string, string> // key -> base64
}

/** 生成一份完整备份包 */
export async function exportBackup(): Promise<Backup> {
  const localStorage: Record<string, unknown> = {}
  for (const k of LS_KEYS) {
    const raw = localStorageGet(k)
    if (raw != null) localStorage[k] = JSON.parse(raw)
  }
  const blobs = await getAllBlobs()
  return {
    app: 'VidSpark',
    version: 1,
    exportedAt: new Date().toISOString(),
    localStorage,
    blobs,
  }
}

/** 校验并恢复一份备份包。成功后调用方应 reload 让各 Provider 重新读取。 */
export async function importBackup(data: Backup): Promise<void> {
  if (data.app !== 'VidSpark' || data.version !== 1) {
    throw new Error('不是有效的 VidSpark 备份文件')
  }
  for (const k of LS_KEYS) {
    if (k in data.localStorage) {
      localStorageSet(k, JSON.stringify(data.localStorage[k]))
    }
  }
  for (const [key, b64] of Object.entries(data.blobs ?? {})) {
    try {
      await putBlobFromBase64(key, b64)
    } catch {
      /* 单个 blob 失败不阻断整体导入 */
    }
  }
}

/** 清空全部本地数据（localStorage 相关键 + IndexedDB blobs） */
export async function clearAllLocal(): Promise<void> {
  for (const k of LS_KEYS) localStorageRemove(k)
  await clearAllBlobs()
}

/** 估算本地数据占用（localStorage 字节 + blob 数量），用于设置页展示 */
export function localStats(): { lsBytes: number; keys: number; blobCount: number } {
  let lsBytes = 0
  let keys = 0
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && LS_KEYS.includes(k)) {
      lsBytes += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2
      keys++
    }
  }
  return { lsBytes, keys, blobCount: -1 } // blobCount 需异步获取，见 localBlobCount
}

export async function localBlobCount(): Promise<number> {
  const blobs = await getAllBlobs()
  return Object.keys(blobs).length
}

// 安全包装（隐私模式 / SSR 环境降级）
function localStorageGet(k: string): string | null {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function localStorageSet(k: string, v: string): void {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* 配额溢出忽略 */
  }
}
function localStorageRemove(k: string): void {
  try {
    localStorage.removeItem(k)
  } catch {
    /* 忽略 */
  }
}
