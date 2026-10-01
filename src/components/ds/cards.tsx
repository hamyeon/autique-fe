import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Divider } from './divider'
import type { InfoRowData } from './info-row'
import { InfoRow } from './info-row'
import { ProgressBar } from './progress-bar'
import { Tag } from './tag'

/* 카드 공통: 패딩 16, 행 간격 8, radius-sm, 1px 테두리 */
const CARD = 'gap-card-row p-card-padding flex w-full flex-col rounded-sm border'
const CARD_TONE = {
  default: 'border-gray2 bg-white0',
  primary: 'border-primary2 bg-primary4',
  error: 'border-error2 bg-error4',
} as const

function Rows({ rows }: { rows: InfoRowData[] }) {
  return rows.map((row, i) => <InfoRow key={i} {...row} />)
}

export interface SummaryCardProps {
  /** primary = '나와 관련된' 정보(primary4 바탕) */
  tone?: 'default' | 'primary'
  /** 최대 4행 */
  rows: InfoRowData[]
  /** 구분선 앞에 올 행 수(Figma는 2) */
  dividerAfter?: number
  className?: string
}

/** 라벨–값 목록 카드(결과·결제·정보 확인·상세 요약) */
export function SummaryCard({ tone = 'default', rows, dividerAfter, className }: SummaryCardProps) {
  const cut = dividerAfter && dividerAfter < rows.length ? dividerAfter : undefined
  return (
    <section className={cn(CARD, CARD_TONE[tone], className)}>
      <Rows rows={cut ? rows.slice(0, cut) : rows} />
      {cut && (
        <>
          <Divider tone={tone} />
          <Rows rows={rows.slice(cut)} />
        </>
      )}
    </section>
  )
}

export interface PriceCardProps {
  /** 기본 'AI 적정 시세' */
  tag?: string
  price: string
  rows?: InfoRowData[]
  className?: string
}

/** AI가 산정한 가격 카드: 태그 + title02 primary1 금액, 구분선 아래 행 */
export function PriceCard({ tag = 'AI 적정 시세', price, rows = [], className }: PriceCardProps) {
  return (
    <section className={cn(CARD, CARD_TONE.default, className)}>
      <div className="gap-space-8 flex items-center justify-between">
        <Tag size="md">{tag}</Tag>
        <p className="text-title02 text-primary1">{price}</p>
      </div>
      {rows.length > 0 && (
        <>
          <Divider />
          <Rows rows={rows} />
        </>
      )}
    </section>
  )
}

export interface AuctionStatusCardProps {
  /** leading 내가 최고 입찰자(블루 + 진행 바), exceeded 상한가 초과(레드), watching 참여 전(흰 카드) */
  status?: 'leading' | 'exceeded' | 'watching'
  /** 기본: leading·watching '현재가', exceeded '현재 최고 입찰가' */
  priceLabel?: string
  price: string
  /** 상태 태그(sm). watching에는 쓰지 않습니다. */
  badge?: string
  rows?: InfoRowData[]
  /** 구분선 아래 행(내 자동 입찰 상한가 등) */
  extraRows?: InfoRowData[]
  /** 현재가 ÷ 상한가(0~1). leading에서만 진행 바로 보입니다. */
  progress?: number
  /** 진행 바 아래 캡션(caption02 gray4) */
  caption?: ReactNode
  className?: string
}

/** 내가 참여 중인 실시간 경매의 상태 카드 */
export function AuctionStatusCard({
  status = 'leading',
  priceLabel,
  price,
  badge,
  rows = [],
  extraRows = [],
  progress,
  caption,
  className,
}: AuctionStatusCardProps) {
  if (status === 'watching') {
    return (
      <section className={cn(CARD, CARD_TONE.default, className)}>
        <InfoRow label={priceLabel ?? '현재가'} value={price} emphasis="total" />
        <Rows rows={rows} />
        {extraRows.length > 0 && (
          <>
            <Divider />
            <Rows rows={extraRows} />
          </>
        )}
      </section>
    )
  }

  const exceeded = status === 'exceeded'
  const tone = exceeded ? 'error' : 'primary'

  return (
    <section className={cn(CARD, CARD_TONE[tone], className)}>
      <div className="gap-space-8 flex items-start justify-between">
        <div className="gap-stack-tight flex flex-col">
          <p className="text-body05 text-gray5">
            {priceLabel ?? (exceeded ? '현재 최고 입찰가' : '현재가')}
          </p>
          <p className={cn('text-title02', exceeded ? 'text-black0' : 'text-primary1')}>{price}</p>
        </div>
        {badge && (
          <Tag size="sm" tone={tone}>
            {badge}
          </Tag>
        )}
      </div>
      <Rows rows={rows} />
      {extraRows.length > 0 && (
        <>
          <Divider tone={tone} />
          <Rows rows={extraRows} />
        </>
      )}
      {!exceeded && progress !== undefined && (
        <ProgressBar value={progress} label="상한가 대비 현재가" />
      )}
      {caption && <p className="text-caption02 text-gray4">{caption}</p>}
    </section>
  )
}
