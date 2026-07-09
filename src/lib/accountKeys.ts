// 按账号命名空间的 localStorage 键构造器
// 让互动 / 库数据（点赞、收藏、关注、上传、评论、播放历史）与具体账号绑定，
// 切换账号即切换数据视图，多个本地账号互不串台。
// 同时导出 LEGACY 旧全局键，供首次启动把老用户数据迁移到默认账号(_me)。

export const interactionsKey = (id: string) => `vidspark_interactions_v1_${id}`
export const uploadsKey = (id: string) => `vidspark_uploads_v1_${id}`
export const commentsKey = (id: string) => `vidspark_comments_v1_${id}`
export const engagementKey = (id: string) => `vidspark_engagement_v1_${id}`

export const LEGACY = {
  account: 'vidspark_account_v1',
  interactions: 'vidspark_interactions_v1',
  uploads: 'vidspark_uploads_v1',
  comments: 'vidspark_comments_v1',
  engagement: 'vidspark_engagement_v1',
} as const

/** 备份/清空时扫描用的前缀集合（含旧全局键，确保迁移前的数据也能被纳入） */
export const DATA_PREFIXES = [
  'vidspark_accounts_v1',
  LEGACY.account,
  interactionsKey(''),
  uploadsKey(''),
  commentsKey(''),
  engagementKey(''),
]

/** 判断某个 localStorage 键是否属于 VidSpark 的账号/数据范畴 */
export function isDataKey(key: string): boolean {
  return DATA_PREFIXES.some((p) => key.startsWith(p))
}
