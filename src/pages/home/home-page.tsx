import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  useAuctionsInfiniteQuery,
  useAuctionsQuery,
  useToggleAuctionLikeMutation,
} from '@/api/auctions'
import type { AuctionListItem } from '@/api/schemas/auctions'
import {
  FloatingActionButton,
  HomeHeader,
  ImagePlaceholder,
  LoadMoreButton,
  PageIndicator,
  TabBar,
} from '@/components/ds'
import {
  EmptyState,
  ErrorState,
  ProductCardSkeleton,
  ProductGridSkeleton,
} from '@/components/feedback'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { Screen } from '@/layouts/screen'
import { AuctionGrid } from '@/pages/home/auction-grid'

/** '지금 인기 있는 경매' 한 번에 불러올 개수(2열 × 4줄) */
const POPULAR_PAGE_SIZE = 8

/** 홈 탭: 배너 → 나에게 딱 맞는 상품 → 지금 인기 있는 경매(무한 스크롤) + 상품 등록 버튼 + 탭바 (Figma 572:7790) */
export function HomePage() {
  const navigate = useNavigate()
  const recommended = useAuctionsQuery({ sort: 'recommended', size: 4 })
  const popular = useAuctionsInfiniteQuery({ sort: 'popular', size: POPULAR_PAGE_SIZE })
  const toggleLike = useToggleAuctionLikeMutation()

  const onToggleLike = (item: AuctionListItem) =>
    toggleLike.mutate({ auctionId: item.auctionId, liked: !item.isLiked })

  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled: popular.hasNextPage && !popular.isFetchingNextPage && !popular.isFetchNextPageError,
    onLoadMore: () => popular.fetchNextPage(),
  })

  const recommendedItems = recommended.data?.items ?? []
  const popularItems = popular.data?.pages.flatMap((page) => page.items) ?? []

  let content: ReactNode
  if (recommended.isPending || popular.isPending) {
    content = (
      <>
        <HomeSection title="나에게 딱 맞는 상품">
          <ProductGridSkeleton />
        </HomeSection>
        <HomeSection title="지금 인기 있는 경매">
          <ProductGridSkeleton />
        </HomeSection>
      </>
    )
  } else if (recommended.isLoadingError || popular.isLoadingError) {
    // 처음 불러오기 실패만 화면 전체 에러. 다음 페이지 실패는 목록 끝에서 따로 보여줍니다.
    content = (
      <ErrorState
        title="경매 목록을 불러오지 못했어요"
        retrying={recommended.isRefetching || popular.isRefetching}
        onRetry={() => {
          if (recommended.isLoadingError) recommended.refetch()
          if (popular.isLoadingError) popular.refetch()
        }}
      />
    )
  } else if (recommendedItems.length === 0 && popularItems.length === 0) {
    content = (
      <EmptyState
        title="아직 열린 경매가 없어요"
        description="새 경매가 등록되면 여기에서 보여드릴게요."
      />
    )
  } else {
    content = (
      <>
        {recommendedItems.length > 0 && (
          <HomeSection title="나에게 딱 맞는 상품">
            <AuctionGrid items={recommendedItems} onToggleLike={onToggleLike} />
          </HomeSection>
        )}
        {popularItems.length > 0 && (
          <HomeSection title="지금 인기 있는 경매">
            <AuctionGrid items={popularItems} onToggleLike={onToggleLike}>
              {popular.isFetchingNextPage && (
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
            {popular.isFetchNextPageError && (
              <ErrorState
                title="더 불러오지 못했어요"
                description={null}
                onRetry={() => popular.fetchNextPage()}
                className="py-0"
              />
            )}
            {!popular.hasNextPage && (
              <LoadMoreButton onClick={() => navigate('/products')}>
                더 많은 경매 보러가기
              </LoadMoreButton>
            )}
          </HomeSection>
        )}
      </>
    )
  }

  return (
    <Screen
      top="none"
      header={<HomeHeader />}
      bottom={
        <>
          {/* 탭바 위 오른쪽에 떠 있습니다. bottom 슬롯(sticky)을 기준으로 위치를 잡습니다. */}
          <FloatingActionButton
            onClick={() => navigate('/register')}
            className="right-layout-gutter mb-space-20 absolute bottom-full"
          />
          <TabBar active="home" />
        </>
      }
    >
      <HomeBanner />
      <div className="mt-layout-section gap-layout-section flex flex-col">{content}</div>
    </Screen>
  )
}

/** 상단 배너. 배너 API가 명세에 없어 이미지 자리와 위치 표시만 둡니다. */
function HomeBanner() {
  return (
    <div className="-mx-layout-gutter relative">
      <ImagePlaceholder ratio={1} alt="이벤트 배너" />
      <PageIndicator
        count={4}
        current={0}
        className="bottom-space-20 absolute left-1/2 -translate-x-1/2"
      />
    </div>
  )
}

/** 섹션 제목(head02) → 16 → 내용 */
function HomeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="gap-space-16 flex flex-col">
      <h2 className="text-head02 text-black0">{title}</h2>
      {children}
    </section>
  )
}
