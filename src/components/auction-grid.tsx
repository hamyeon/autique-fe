import type { ReactNode } from 'react'
import type { SimilarAuction } from '@/api/schemas/auctions'
import type { AuctionStatus } from '@/api/schemas/common'
import type { ProductCardProps } from '@/components/ds'
import { ProductCard } from '@/components/ds'
import { formatGrade, formatNumber, formatPrice } from '@/lib/format'

const CARD_STATUS: Record<AuctionStatus, Pick<ProductCardProps, 'status' | 'statusLabel'>> = {
  SCHEDULED: { status: 'planned' },
  LIVE: { status: 'live' },
  ENDED: { status: 'ended' },
  CANCELED: { status: 'ended', statusLabel: '경매 취소' },
}

export interface AuctionGridProps {
  items: SimilarAuction[]
  onToggleLike: (item: SimilarAuction) => void
  /** 그리드 끝에 덧붙일 칸(다음 페이지 스켈레톤 등) */
  children?: ReactNode
}

/** 경매 카드 목록(홈 목록 · 비슷한 상품) → ProductCard 2열 그리드(열 12 · 행 20). 카드를 누르면 /products/:auctionId */
export function AuctionGrid({ items, onToggleLike, children }: AuctionGridProps) {
  return (
    <ul className="gap-x-space-12 gap-y-space-20 grid grid-cols-2">
      {items.map((item) => (
        <li key={item.auctionId} className="min-w-0">
          <ProductCard
            {...CARD_STATUS[item.status]}
            href={`/products/${item.auctionId}`}
            image={item.thumbnailUrl}
            grade={formatGrade(item.grade)}
            brand={item.brand}
            name={item.name}
            price={formatPrice(item.price)}
            meta={`관심 ${formatNumber(item.likeCount)}`}
            favorited={item.isLiked}
            onFavorite={() => onToggleLike(item)}
          />
        </li>
      ))}
      {children}
    </ul>
  )
}
