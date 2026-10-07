import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
}

/** 불러오는 동안 자리를 잡아 두는 gray1 블록. 크기는 className으로 정합니다. */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden className={cn('bg-gray1 animate-pulse rounded-sm', className)} />
}

/** ProductCard와 같은 모양: 정사각 이미지 → 12 → 브랜드 · 상품명 · 가격 · 관심 수 */
export function ProductCardSkeleton({ className }: SkeletonProps) {
  return (
    <div aria-hidden className={cn('gap-space-12 flex min-w-0 flex-col', className)}>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="gap-space-8 py-space-4 flex flex-col">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}

export interface ProductGridSkeletonProps {
  /** 카드 수. 기본 4(2열 × 2줄) */
  count?: number
  className?: string
}

/** ProductCard 2열 그리드(열 12 · 행 20) 자리 */
export function ProductGridSkeleton({ count = 4, className }: ProductGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="상품을 불러오는 중"
      className={cn('gap-x-space-12 gap-y-space-20 grid grid-cols-2', className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
