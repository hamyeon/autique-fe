import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  usePopularAuctionsQuery,
  useRecommendedAuctionsQuery,
  useToggleAuctionLikeMutation,
} from '@/api/auctions'
import { useHasUnreadNotifications } from '@/api/notifications'
import type { AuctionCard } from '@/api/schemas/auctions'
import {
  FloatingActionButton,
  HomeHeader,
  LoadMoreButton,
  PromoBanner,
  TabBar,
} from '@/components/ds'
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/feedback'
import { Screen } from '@/layouts/screen'
import { AuctionGrid } from '@/components/auction-grid'
import { ImageCarousel } from '@/components/image-carousel'
import promotionImage01 from '@/assets/illustrations/img_promotion_01.png'
import promotionImage02 from '@/assets/illustrations/img_promotion_02.png'

/** 홈 섹션마다 보여줄 카드 수(2열 × 2줄). 명세: 홈은 limit=4 */
const HOME_CARD_LIMIT = 4

/**
 * 홈 탭: 배너 → AI 추천 배너 → 나에게 딱 맞는 상품 → 지금 인기 있는 경매 + 상품 등록 버튼 + 탭바 (Figma 572:7790).
 * 인기 API는 페이지가 없어 4개만 보여주고, 더 보기는 상품 찾기 탭으로 보냅니다.
 * 서버가 끝난 경매를 빼고 채우지 않아 섹션마다 4개보다 적을 수 있습니다.
 */
export function HomePage() {
  const navigate = useNavigate()
  const recommended = useRecommendedAuctionsQuery(HOME_CARD_LIMIT)
  const popular = usePopularAuctionsQuery(HOME_CARD_LIMIT)
  const toggleLike = useToggleAuctionLikeMutation()
  const hasUnread = useHasUnreadNotifications()

  const onToggleLike = (item: AuctionCard) =>
    toggleLike.mutate({ auctionId: item.auctionId, liked: !item.isLiked })

  const recommendedItems = recommended.data?.items ?? []
  const popularItems = popular.data?.items ?? []

  let content: ReactNode
  if (recommended.isPending || popular.isPending) {
    content = (
      <>
        <HomeSection title="나에게 딱 맞는 상품">
          <ProductGridSkeleton count={HOME_CARD_LIMIT} />
        </HomeSection>
        <HomeSection title="지금 인기 있는 경매">
          <ProductGridSkeleton count={HOME_CARD_LIMIT} />
        </HomeSection>
      </>
    )
  } else if (recommended.isError || popular.isError) {
    content = (
      <ErrorState
        title="경매 목록을 불러오지 못했어요"
        retrying={recommended.isRefetching || popular.isRefetching}
        onRetry={() => {
          if (recommended.isError) recommended.refetch()
          if (popular.isError) popular.refetch()
        }}
      />
    )
  } else if (recommendedItems.length === 0 && popularItems.length === 0) {
    content = (
      <EmptyState
        title="아직 열린 경매가 없어요"
        description="새 경매가 등록되면 여기에서 보여드릴게요"
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
            <AuctionGrid items={popularItems} onToggleLike={onToggleLike} />
            <LoadMoreButton onClick={() => navigate('/products')}>
              더 많은 경매 보러가기
            </LoadMoreButton>
          </HomeSection>
        )}
      </>
    )
  }

  return (
    <Screen
      top="none"
      header={<HomeHeader hasUnread={hasUnread} />}
      bottom={
        <>
          {/* 탭바 위 오른쪽에 떠 있습니다. bottom 슬롯(sticky)을 기준으로 위치를 잡습니다. 펼치면 딤이 헤더 · 탭바까지 덮습니다. */}
          <FloatingActionButton
            actions={[
              // Figma 1112:3833 순서 · 문구 그대로
              { label: '상품 등록하기', onClick: () => navigate('/register') },
              { label: '쇼핑 메이트 PIKI', onClick: () => navigate('/agent') },
            ]}
            className="right-layout-gutter mb-space-20 absolute bottom-full"
          />
          <TabBar active="home" />
        </>
      }
    >
      <HomeBanner />
      <PromoBanner
        href="/agent"
        className="-mx-layout-gutter w-auto"
        caption="꼭 실시간 경매를 보고 있지 않아도,"
        title={
          <>
            AI로 나에게 더 딱 맞는 상품 추천받고
            <br />
            자동 입찰하러 가기
          </>
        }
      />
      {/* 상단 이미지(배너) 아래 첫 콘텐츠 24 — design-system/README.md 화면 여백 규칙 */}
      <div className="mt-layout-section gap-layout-section flex flex-col">{content}</div>
    </Screen>
  )
}

/** 상단 배너 이미지(로컬) */
const BANNER_IMAGES = [promotionImage01, promotionImage02]

/**
 * 배너 자동 넘김 간격. 두 줄 제목 + 설명을 읽을 시간(3초는 빠듯)이면서 넘어가는 걸 알아챌 수 있는 4초(사용자 위임, 2026-11-05)
 */
const BANNER_AUTOPLAY_MS = 4000

/** 상단 배너: 화면 폭 정사각 이미지, 좌우 스와이프 + PageIndicator + 4초 자동 넘김. 링크 없음(Figma 프로토타입에 없음) */
function HomeBanner() {
  return (
    <ImageCarousel images={BANNER_IMAGES} alt="프로모션 배너" autoPlayMs={BANNER_AUTOPLAY_MS} />
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
