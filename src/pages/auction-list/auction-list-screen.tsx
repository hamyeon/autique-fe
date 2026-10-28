import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useToggleAuctionLikeMutation } from '@/api/auctions'
import type { AuctionList, SimilarAuction } from '@/api/schemas/auctions'
import { AuctionGrid } from '@/components/auction-grid'
import {
  EmptyState,
  ErrorState,
  ProductCardSkeleton,
  ProductGridSkeleton,
} from '@/components/feedback'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { Screen } from '@/layouts/screen'

export interface AuctionListScreenProps {
  /** 화면마다 다른 부분. 경매 리스트는 정렬 탭 헤더, 마이페이지 하위 목록은 제목 헤더 */
  header: ReactNode
  /** TabBar 등. 없으면 하단 safe-area만 */
  bottom?: ReactNode
  /** 무한 스크롤 목록 쿼리 */
  query: UseInfiniteQueryResult<InfiniteData<AuctionList>>
  emptyTitle: ReactNode
  emptyDescription?: ReactNode
  /** 처음 불러오기 실패 제목 */
  errorTitle: ReactNode
}

/**
 * 상품 목록 화면 골격(Figma 경매 리스트 551:3556 · 현재 경매 중인 상품 957:3014 · 과거 경매했던 상품 957:3180 · 관심 목록 957:3328).
 * 헤더 → (위 24) ProductCard 2열 그리드(무한 스크롤) → bottom. 네 화면이 헤더·데이터만 바꿔 씁니다.
 */
export function AuctionListScreen({
  header,
  bottom,
  query,
  emptyTitle,
  emptyDescription,
  errorTitle,
}: AuctionListScreenProps) {
  const toggleLike = useToggleAuctionLikeMutation()
  const onToggleLike = (item: SimilarAuction) =>
    toggleLike.mutate({ auctionId: item.auctionId, liked: !item.isLiked })

  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled: query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError,
    onLoadMore: () => query.fetchNextPage(),
  })

  const items = query.data?.pages.flatMap((page) => page.items) ?? []

  let content: ReactNode
  if (query.isPending) {
    content = <ProductGridSkeleton count={6} />
  } else if (query.isLoadingError) {
    // 처음 불러오기 실패만 화면 전체 에러. 다음 페이지 실패는 목록 끝에서 따로 보여줍니다.
    content = (
      <ErrorState title={errorTitle} retrying={query.isRefetching} onRetry={() => query.refetch()} />
    )
  } else if (items.length === 0) {
    content = <EmptyState title={emptyTitle} description={emptyDescription} />
  } else {
    content = (
      <div className="gap-space-16 flex flex-col">
        <AuctionGrid items={items} onToggleLike={onToggleLike}>
          {query.isFetchingNextPage && (
            <>
              <li>
                <ProductCardSkeleton />
              </li>
              <li>
                <ProductCardSkeleton />
              </li>
            </>
          )}
        </AuctionGrid>
        <div ref={loadMoreRef} aria-hidden />
        {query.isFetchNextPageError && (
          <ErrorState
            title="더 불러오지 못했어요"
            description={null}
            onRetry={() => query.fetchNextPage()}
            className="py-0"
          />
        )}
      </div>
    )
  }

  return (
    <Screen top="section" header={header} bottom={bottom}>
      {content}
    </Screen>
  )
}
