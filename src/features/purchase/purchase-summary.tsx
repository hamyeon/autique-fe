import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { ProductSummary as ProductSummaryData } from '@/api/schemas/common'
import type { ChipKind, InfoRowData } from '@/components/ds'
import { Chip, InfoBanner, ProductSummary, SummaryCard } from '@/components/ds'
import { Skeleton } from '@/components/feedback'
import { usePressed } from '@/hooks/use-pressed'

/*
 * 낙찰 이후 화면(경매 결과 · 결제 · 차순위 구매 기회) 공통 위쪽(Figma 396:5865 · 396:6204 · 396:6406 · 396:6776 · 396:6814).
 * 상태 칩 → 12 → 제목(head01) → 24 → 상품 요약 → 16 → 금액 카드 → 16 → 안내
 * 상품 요약을 누르면 그 경매의 상품 상세로 갑니다(사용자 결정, 2026-11-03).
 */

export interface PurchaseSummaryProps {
  chip?: { kind: ChipKind; label: string }
  /** 줄바꿈(\n)은 그대로 보입니다. 금액 강조는 text-primary1 span으로 넘깁니다. */
  title?: ReactNode
  product: ProductSummaryData
  /** 상품 요약을 누르면 갈 상품 상세(/products/:auctionId) */
  auctionId: number
  rows?: InfoRowData[]
  /** 금액 카드에서 구분선 앞 행 수 */
  dividerAfter?: number
  notice?: ReactNode
  noticeTone?: 'default' | 'error'
}

export function PurchaseSummary({
  chip,
  title,
  product,
  auctionId,
  rows,
  dividerAfter,
  notice,
  noticeTone,
}: PurchaseSummaryProps) {
  const { pressed, handlers } = usePressed()
  return (
    <div className="gap-layout-section flex flex-col">
      {(chip || title) && (
        <div className="gap-stack-related flex flex-col items-start">
          {chip && <Chip kind={chip.kind}>{chip.label}</Chip>}
          {title && <h2 className="text-head01 text-black0 whitespace-pre-line">{title}</h2>}
        </div>
      )}
      <div className="gap-form-field flex flex-col">
        <Link
          to={`/products/${auctionId}`}
          aria-label={`${product.name} 상품 상세 보기`}
          data-pressed={pressed ? '' : undefined}
          {...handlers}
          className="data-pressed:bg-gray0 focus-visible:outline-primary1 block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ProductSummary
            name={product.name}
            subName={product.subName}
            image={product.imageUrl ?? undefined}
          />
        </Link>
        {rows && rows.length > 0 && <SummaryCard rows={rows} dividerAfter={dividerAfter} />}
        {notice && <InfoBanner tone={noticeTone}>{notice}</InfoBanner>}
      </div>
    </div>
  )
}

/** 불러오는 동안: 칩 · 제목 · 상품 · 카드 자리 */
export function PurchaseSummarySkeleton() {
  return (
    <div aria-hidden className="gap-layout-section flex flex-col">
      <div className="gap-stack-related flex flex-col">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-7 w-3/4" />
      </div>
      <div className="gap-form-field flex flex-col">
        <div className="gap-space-8 flex items-center">
          <Skeleton className="size-12 shrink-0" />
          <div className="gap-space-4 flex flex-1 flex-col">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}
