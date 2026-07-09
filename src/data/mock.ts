export type CategoryKey =
  | 'music' | 'game' | 'knowledge' | 'funny' | 'food' | 'life' | 'movie'

export type Video = {
  id: number
  title: string
  author: string
  views: string
  viewsNum: number
  duration: string
  cover: string
  category: CategoryKey
  publishedAt: string
  tags?: string[]
  desc?: string
  /** 是否本机用户上传（可删除、可真实播放） */
  isLocal?: boolean
  /** IndexedDB 中视频 Blob 的键，形如 `vid-<id>` */
  blobKey?: string
  /** 真实视频时长（秒），用于真实播放进度 */
  realDurationSec?: number
}

/** 评论条目 */
export type Comment = {
  user: string
  avatar: string
  text: string
  time: string
}

export type Category = {
  key: CategoryKey
  name: string
  icon: string
  desc: string
  cover: string
}

export const categories: Category[] = [
  { key: 'music', name: '音乐', icon: '🎵', desc: '纯音 · 翻唱 · 演奏', cover: 'linear-gradient(135deg,#f6d365,#fda085)' },
  { key: 'game', name: '游戏', icon: '🎮', desc: '实况 · 攻略 · 速通', cover: 'linear-gradient(135deg,#43cea2,#185a9d)' },
  { key: 'knowledge', name: '知识', icon: '📚', desc: '科普 · 教程 · 硬核', cover: 'linear-gradient(135deg,#0f2027,#2c5364)' },
  { key: 'funny', name: '搞笑', icon: '😂', desc: '整活 · 沙雕 · 名场面', cover: 'linear-gradient(135deg,#ff9a9e,#fecfef)' },
  { key: 'food', name: '美食', icon: '🍜', desc: '家常 · 探店 · 烘焙', cover: 'linear-gradient(135deg,#ee0979,#ff6a00)' },
  { key: 'life', name: '生活', icon: '🏍', desc: 'vlog · 改造 · 出行', cover: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { key: 'movie', name: '影视', icon: '🎬', desc: '解说 · 混剪 · 二创', cover: 'linear-gradient(135deg,#41295a,#2f0743)' },
]

export const videos: Video[] = [
  { id: 1, title: '雨夜老城区漫步', author: '城市漫游者', views: '12.4万', viewsNum: 124000, duration: '08:24', cover: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'life', publishedAt: '2天前', tags: ['治愈', 'citywalk', '雨夜'], desc: '撑伞走过湿漉漉的青石板路，霓虹在积水里碎成一片紫红。BGM 是雨声白噪音。' },
  { id: 2, title: '30分钟吉他指弹纯享', author: '弦外之音', views: '8.7万', viewsNum: 87000, duration: '30:12', cover: 'linear-gradient(135deg,#f6d365,#fda085)', category: 'music', publishedAt: '5天前', tags: ['吉他', '纯音乐', '指弹'], desc: '暖黄灯光下的一把木吉他，适合睡前循环。' },
  { id: 3, title: '猫咪大战吸尘器', author: '喵星观察局', views: '202万', viewsNum: 2020000, duration: '03:41', cover: 'linear-gradient(135deg,#ff9a9e,#fecfef)', category: 'funny', publishedAt: '1天前', tags: ['猫咪', '搞笑', '名场面'], desc: '一只炸毛橘猫誓死不从吸尘器的全过程，弹幕全是哈哈哈。' },
  { id: 4, title: '三分钟看懂黑洞熵', author: '硬核科普菌', views: '56万', viewsNum: 560000, duration: '05:58', cover: 'linear-gradient(135deg,#0f2027,#2c5364)', category: 'knowledge', publishedAt: '3天前', tags: ['科普', '物理', '黑洞'], desc: '深蓝星云中一个被光环包裹的黑色圆洞，粒子螺旋坠入。' },
  { id: 5, title: '赛博朋克城市夜骑', author: '夜行者NEON', views: '33万', viewsNum: 330000, duration: '12:07', cover: 'linear-gradient(135deg,#1f4037,#99f2c8)', category: 'life', publishedAt: '4天前', tags: ['骑行', '赛博朋克', '夜景'], desc: '第一视角机车把手，两侧楼宇流光拉成蓝色线条。' },
  { id: 6, title: '外婆的拿手菜：红烧肉', author: '老饭骨传人', views: '91万', viewsNum: 910000, duration: '15:33', cover: 'linear-gradient(135deg,#ee0979,#ff6a00)', category: 'food', publishedAt: '6天前', tags: ['美食', '家常菜', '红烧肉'], desc: '砂锅里油亮酱红的肉块，热气朦胧了镜头。' },
  { id: 7, title: '电子木鱼：赛博功德+1', author: '佛系青年', views: '45万', viewsNum: 450000, duration: '02:10', cover: 'linear-gradient(135deg,#11998e,#38ef7d)', category: 'funny', publishedAt: '2天前', tags: ['解压', '整活', '电子木鱼'], desc: '敲一下，功德+1。赛博佛系青年的日常。' },
  { id: 8, title: '用代码画一朵樱花', author: '程序员小鹿', views: '23万', viewsNum: 230000, duration: '09:45', cover: 'linear-gradient(135deg,#ffafbd,#ffc3a0)', category: 'knowledge', publishedAt: '1周前', tags: ['编程', '前端', 'canvas'], desc: '从 0 到 1 用 canvas 画出飘落的樱花，附源码。' },
  { id: 9, title: '原神枫丹跑图BGM钢琴版', author: '琴键上的旅人', views: '178万', viewsNum: 1780000, duration: '04:33', cover: 'linear-gradient(135deg,#36d1dc,#5b86e5)', category: 'music', publishedAt: '3天前', tags: ['钢琴', '原神', '翻弹'], desc: '枫丹的水边旋律，钢琴独奏版，单曲循环警告。' },
  { id: 10, title: '出租屋爆改电竞房', author: '装修刺客', views: '66万', viewsNum: 660000, duration: '18:20', cover: 'linear-gradient(135deg,#cc2b5e,#753a88)', category: 'life', publishedAt: '5天前', tags: ['改造', '电竞', '出租屋'], desc: '3000 块把出租屋改成电竞房，房东看了想加租。' },
  { id: 11, title: '10分钟搞定一周减脂餐', author: '健身餐研究所', views: '54万', viewsNum: 540000, duration: '10:02', cover: 'linear-gradient(135deg,#f7971e,#ffd200)', category: 'food', publishedAt: '4天前', tags: ['减脂', '美食', '教程'], desc: '备餐一次吃一周，低卡又顶饱。' },
  { id: 12, title: '复古街机厅巡礼', author: '像素考古学家', views: '39万', viewsNum: 390000, duration: '11:48', cover: 'linear-gradient(135deg,#8e2de2,#4a00e0)', category: 'game', publishedAt: '6天前', tags: ['街机', '怀旧', '游戏'], desc: '藏在老商场地下室的街机厅，手柄都包浆了。' },
]

/** 搜索匹配：标题 / UP主 / 分区名 / 标签 / 简介 */
export function matchVideo(v: Video, q: string, catName: (k: CategoryKey) => string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return true
  return (
    v.title.toLowerCase().includes(s) ||
    v.author.toLowerCase().includes(s) ||
    catName(v.category).toLowerCase().includes(s) ||
    (v.tags ?? []).some((t) => t.toLowerCase().includes(s)) ||
    (v.desc ?? '').toLowerCase().includes(s)
  )
}

/** 把数字观看量格式化为「万 / 亿」中文单位 */
export function formatViews(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

/** 默认视频的预设评论（与用户持久化评论合并展示） */
export const PRESET_COMMENTS: Comment[] = [
  { user: '路人甲', avatar: '路', text: '看完直接关注了，质量真高', time: '2小时前' },
  { user: '弹幕护卫', avatar: '弹', text: '这弹幕密度，妥妥的爆款相', time: '5小时前' },
  { user: '夜猫子', avatar: '夜', text: '半夜刷到，救命好上头', time: '昨天' },
]

export type FeedItem = {
  id: number
  type: 'upload' | 'like' | 'comment' | 'follow' | 'live' | 'collect'
  user: string
  avatar: string
  text: string
  target?: string
  time: string
}

export const feed: FeedItem[] = [
  { id: 1, type: 'upload', user: '城市漫游者', avatar: '城', text: '发布了新视频《雨夜老城区漫步》', target: '雨夜老城区漫步', time: '2分钟前' },
  { id: 2, type: 'live', user: '硬核科普菌', avatar: '硬', text: '正在直播：黑洞专题答疑，速来', target: '三分钟看懂黑洞熵', time: '12分钟前' },
  { id: 3, type: 'like', user: '弦外之音', avatar: '弦', text: '赞了你的视频', target: '30分钟吉他指弹纯享', time: '25分钟前' },
  { id: 4, type: 'upload', user: '喵星观察局', avatar: '喵', text: '投稿《猫咪大战吸尘器》冲上全站热榜第3', target: '猫咪大战吸尘器', time: '1小时前' },
  { id: 5, type: 'comment', user: '夜行者NEON', avatar: '夜', text: '评论了《赛博朋克城市夜骑》：这运镜绝了', target: '赛博朋克城市夜骑', time: '3小时前' },
  { id: 6, type: 'follow', user: '你', avatar: '我', text: '关注了 老饭骨传人', target: '外婆的拿手菜：红烧肉', time: '5小时前' },
  { id: 7, type: 'collect', user: '佛系青年', avatar: '佛', text: '收藏了《电子木鱼：赛博功德+1》', target: '电子木鱼：赛博功德+1', time: '昨天' },
]

export const feedTypeMeta: Record<FeedItem['type'], { icon: string; color: string; label: string }> = {
  upload: { icon: '📹', color: '#ef4444', label: '投稿' },
  like: { icon: '❤️', color: '#ec4899', label: '点赞' },
  comment: { icon: '💬', color: '#3b82f6', label: '评论' },
  follow: { icon: '➕', color: '#10b981', label: '关注' },
  live: { icon: '🔴', color: '#f43f5e', label: '直播' },
  collect: { icon: '⭐', color: '#f59e0b', label: '收藏' },
}
