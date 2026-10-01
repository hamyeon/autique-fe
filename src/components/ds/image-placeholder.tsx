import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export interface ImagePlaceholderProps {
  /** 없으면 부모 폭을 채웁니다. 숫자는 px입니다. */
  width?: number | string
  height?: number | string
  /** 가로 ÷ 세로. 상품 이미지는 1(정사각) */
  ratio?: number
  /** 실제 사진이 있으면 넘깁니다(object-fit: cover). */
  src?: string
  alt?: string
  className?: string
}

/** 이미지·일러스트가 들어갈 자리. gray1 바탕입니다. */
export function ImagePlaceholder({
  width,
  height,
  ratio,
  src,
  alt,
  className,
}: ImagePlaceholderProps) {
  /* 치수는 화면마다 달라 토큰이 없으므로 props 값을 그대로 인라인 스타일로 넘깁니다. */
  const style: CSSProperties = { width: width ?? '100%', height, aspectRatio: ratio }
  const classes = cn('bg-gray1 block shrink-0 object-cover', className)

  if (src) return <img className={classes} src={src} alt={alt ?? ''} style={style} />
  return <div className={classes} role={alt ? 'img' : undefined} aria-label={alt} style={style} />
}
