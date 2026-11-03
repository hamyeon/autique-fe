import {
  useLikedAuctionsInfiniteQuery,
  useMyAuctionsInfiniteQuery,
  useMySellingAuctionsInfiniteQuery,
} from '@/api/auctions'
import { Header } from '@/components/ds'
import { AuctionListScreen } from '@/pages/auction-list/auction-list-screen'

/*
 * 마이페이지 하위 목록 3개. 디자인이 같아 AuctionListScreen에 제목 헤더만 바꿔 넣습니다. TabBar 없음.
 * 판매 · 참여 목록은 진행 중(예정 · 진행 중) 경매를 먼저, 이어서 종료(종료 · 취소) 경매를 한 목록으로 보여줍니다(사용자 결정, 2026-11-03).
 */

const PAGE_SIZE = 10

/** 내가 판매했던 상품: 내가 판매 등록한 경매. 종료에는 유찰 · 취소도 들어갑니다. */
export function MySellingAuctionsPage() {
  const query = useMySellingAuctionsInfiniteQuery({ size: PAGE_SIZE })
  return (
    <AuctionListScreen
      header={<Header title="내가 판매했던 상품" />}
      query={query}
      emptyTitle="판매한 경매가 없어요"
      emptyDescription="상품을 등록하면 여기에서 볼 수 있어요"
      errorTitle="판매한 경매를 불러오지 못했어요"
    />
  )
}

/** 내가 참여했던 상품: 내가 입찰했거나 자동입찰을 걸어 둔 경매. 종료에는 낙찰 · 패찰 · 경매 취소가 모두 들어갑니다. */
export function MyParticipatingAuctionsPage() {
  const query = useMyAuctionsInfiniteQuery({ size: PAGE_SIZE })
  return (
    <AuctionListScreen
      header={<Header title="내가 참여했던 상품" />}
      query={query}
      emptyTitle="참여한 경매가 없어요"
      emptyDescription="입찰하거나 자동 입찰을 걸어 둔 경매가 여기에 보여요"
      errorTitle="참여한 경매를 불러오지 못했어요"
    />
  )
}

/** 위시리스트(Figma 관심 목록 957:3328): 관심 등록한 경매(종료 · 취소 포함) */
export function LikedAuctionsPage() {
  const query = useLikedAuctionsInfiniteQuery({ size: PAGE_SIZE })
  return (
    <AuctionListScreen
      header={<Header title="위시리스트" />}
      query={query}
      emptyTitle="위시리스트가 비어 있어요"
      emptyDescription="하트를 눌러 관심 있는 상품을 모아 보세요"
      errorTitle="위시리스트를 불러오지 못했어요"
    />
  )
}
