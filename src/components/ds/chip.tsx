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
  /**
   * sm 높이 18(label01 · 좌우 8 · 위아래 2, Figma 1108:2979) · md 높이 22(label01 · 좌우 8 · 위아래 4, Figma 1112:3013)
   * · lg 높이 27(caption01 · 좌우 12 · 위아래 4, Figma 1116:4544). 기본 sm
   */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const AI_CHIP_SIZE = {
  sm: 'text-label01 px-space-8 py-0.5',
  md: 'text-label01 px-space-8 py-1',
  lg: 'text-caption01 px-space-12 py-1',
} as const

/**
 * AI 기능 표시(Figma AIChip 1112:3012): radius-lg, 바탕 grad/primary(bg-grad-primary, 승인된 그라데이션 예외), 글자 white0 "AI".
 * 예: sm 마이페이지 '쇼핑메이트 PIKI' 옆, md 경매 등록 StepHeader 제목 옆 · 플로팅 버튼 메뉴, lg 아직 쓰는 화면 없음
 */
export function AIChip({ size = 'sm', className }: AIChipProps) {
  return (
    <span
      className={cn(
        'bg-grad-primary text-white0 inline-flex shrink-0 items-center rounded-lg whitespace-nowrap',
        AI_CHIP_SIZE[size],
        className,
      )}
    >
      AI
    </span>
  )
}
