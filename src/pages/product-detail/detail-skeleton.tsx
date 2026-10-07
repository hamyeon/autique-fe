import { Skeleton } from '@/components/feedback'

/** 상세 상단(이미지 · 칩 · 상품명) 자리. 목록 카드 정보 없이 바로 들어왔을 때 */
export function DetailTopSkeleton() {
  return (
    <>
      <Skeleton className="-mx-layout-gutter aspect-square rounded-none" />
      <div className="mt-layout-section gap-space-8 flex flex-col">
        <Skeleton className="h-5.5 w-24" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </>
  )
}

/** 상세 본문(정보 행 · 카드 · 설명) 자리. 상단은 카드 정보로 먼저 그리고 나머지를 기다릴 때 */
export function DetailBodySkeleton() {
  return (
    <div
      role="status"
      aria-label="상품 정보를 불러오는 중"
      className="gap-layout-section flex flex-col"
    >
      <div className="gap-space-8 flex flex-col">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-34 w-full" />
      <div className="gap-space-8 flex flex-col">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}
