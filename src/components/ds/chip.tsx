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

export interface AIChipProps {
  /** md 높이 18(위아래 2, Figma 1108:2979) · lg 높이 22(위아래 4, Figma 1112:3013). 기본 md */
  size?: 'md' | 'lg'
  className?: string
}

/**
 * AI 기능 표시(Figma AIChip 1112:3012): label01 + 좌우 8, radius-lg,
 * 바탕 grad/primary(bg-grad-primary, 승인된 그라데이션 예외), 글자 white0 "AI".
 * 예: md 마이페이지 '쇼핑메이트 PIKI' 옆, lg 경매 등록 StepHeader 제목 옆
 */
export function AIChip({ size = 'md', className }: AIChipProps) {
  return (
    <span
      className={cn(
        'bg-grad-primary text-label01 text-white0 px-space-8 inline-flex shrink-0 items-center rounded-lg whitespace-nowrap',
        size === 'lg' ? 'py-1' : 'py-0.5',
        className,
      )}
    >
      AI
    </span>
  )
}
