import type { CSSProperties } from 'react'

/**
 * 统一封面渲染：
 * - 渐变/纯色字符串（如 'linear-gradient(...)'）直接用 background
 * - data URL / http(s) 图片用 backgroundImage，避免 `background: data:...` 失效
 */
export function coverStyle(cover: string): CSSProperties {
  if (cover.startsWith('data:') || cover.startsWith('http://') || cover.startsWith('https://')) {
    return {
      backgroundImage: `url("${cover}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return { background: cover }
}
