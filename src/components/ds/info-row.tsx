import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* emphasis → 값 스타일 (README 표) */
const EMPHASIS_CLASS = {
  default: 'text-body03 text-black0',
  regular: 'text-body04 text-black0',
  primary: 'text-body03 text-primary1',
  danger: 'text-body03 text-error1',
  total: 'text-head02 text-primary1',
  totalDanger: 'text-head02 text-error1',
  hero: 'text-title02 text-primary1',
} as const

export type Emphasis = keyof typeof EMPHASIS_CLASS

/** 라벨–값 한 줄 데이터. 카드의 rows에 그대로 넘깁니다. */
export interface InfoRowData {
  label: ReactNode
  value: ReactNode
  emphasis?: Emphasis
  /** emphasis의 예전 이름 */
  tone?: 'danger' | 'primary'
}

export interface InfoRowProps extends InfoRowData {
  className?: string
}

/** 라벨(body05 gray5)–값 한 줄. 양 끝 정렬, 사이 최소 8 */
export function InfoRow({ label, value, emphasis, tone, className }: InfoRowProps) {
  const e = emphasis ?? tone ?? 'default'
  return (
    <div className={cn('gap-space-8 flex w-full items-center justify-between', className)}>
      <p className="text-body05 text-gray5 shrink-0">{label}</p>
      <p className={cn('min-w-0 text-right break-keep', EMPHASIS_CLASS[e])}>{value}</p>
    </div>
  )
}
