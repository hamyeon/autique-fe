import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TONE_CLASS = {
  primary: 'border-primary2 text-primary1',
  error: 'border-error2 text-error1',
} as const

const SIZE_CLASS = {
  md: 'text-caption02',
  sm: 'text-label01',
} as const

export interface TagProps {
  /** primary = 나·AI 관련, error = 초과·위험 */
  tone?: 'primary' | 'error'
  /** md = 카드 머리 AI 태그, sm = 상태 배지 */
  size?: 'md' | 'sm'
  children: ReactNode
  className?: string
}

/** 흰 바탕 아웃라인 태그. 채워진 상태 라벨은 Chip을 씁니다. */
export function Tag({ tone = 'primary', size = 'md', children, className }: TagProps) {
  return (
    <span
      className={cn(
        'bg-white0 px-space-8 py-space-4 inline-flex shrink-0 items-center rounded-sm border whitespace-nowrap',
        TONE_CLASS[tone],
        SIZE_CLASS[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
