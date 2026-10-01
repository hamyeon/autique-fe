import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const KIND_CLASS = {
  plan: 'bg-black0 text-white0',
  finish: 'bg-gray5 text-white0',
  live: 'bg-error1 text-white0',
  level: 'bg-gray1 text-gray6',
  best: 'bg-primary1 text-white0',
  worst: 'bg-error1 text-white0',
  caution: 'border-error2 bg-white0 text-error1',
  recommend: 'border-primary2 bg-white0 text-primary1',
} as const

export type ChipKind = keyof typeof KIND_CLASS

export interface ChipProps {
  /** plan 경매 예정·낙찰, finish 경매 종료, live 실시간, level 등급, best 내가 최고가, worst 내가 밀림,
   *  caution 문제 상태, recommend 기회 */
  kind?: ChipKind
  /** 명사형 2~8자 */
  children: ReactNode
  className?: string
}

/** 상품·경매·입찰 상태를 짧은 말로 보여주는 22px 라벨 */
export function Chip({ kind = 'plan', children, className }: ChipProps) {
  return (
    <span
      className={cn(
        'text-label01 px-space-8 inline-flex h-5.5 shrink-0 items-center gap-1.25 rounded-sm border border-transparent whitespace-nowrap',
        KIND_CLASS[kind],
        className,
      )}
    >
      {kind === 'live' && <span aria-hidden className="bg-white0 size-1.25 rounded-full" />}
      {children}
    </span>
  )
}
