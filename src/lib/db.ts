// VidSpark 持久化基础设施
// - 安全的 localStorage JSON 读写（隐私模式 / 配额溢出时静默降级）
// - 全局唯一 id 生成
// - IndexedDB 存取用户上传的视频 Blob（localStorage 放不下大文件，且刷新后 blob: URL 失效）

/** 读取 JSON，失败或不存在时返回 fallback */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** 写入 JSON，失败静默忽略 */
export function saveJSON(key: string, val: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* 隐私模式 / 配额溢出：忽略，功能降级但不崩溃 */
  }
}

/** 全局唯一 id（数字，便于做 React key 与互动映射）。
 *  以时间戳为主、随机数为辅，跨会话不会与已持久化 id 撞车。 */
export function uid(): number {
  return Math.floor(Date.now() % 1e10) * 1000 + Math.floor(Math.random() * 1000)
}

// ---- IndexedDB：视频 Blob 存储 ----

const DB_NAME = 'vidspark'
const STORE = 'blobs'
const VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 保存视频文件，key 一般为 `vid-<id>` */
export async function putBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDB()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(blob, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

/** 读取视频文件，不存在返回 null */
export async function getBlob(key: string): Promise<Blob | null> {
  const db = await openDB()
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

/** 删除视频文件 */
export async function deleteBlob(key: string): Promise<void> {
  const db = await openDB()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}
