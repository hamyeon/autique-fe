import { useLikedAuctionsInfiniteQuery, useMyAuctionsInfiniteQuery } from '@/api/auctions'
import { Header } from '@/components/ds'
import { AuctionListScreen } from '@/pages/auction-list/auction-list-screen'

/*
 * 마이페이지 하위 목록 3개. 디자인이 같아 AuctionListScreen에 제목 헤더만 바꿔 넣습니다.
 * 헤더는 Figma trailing=none(뒤로 가기 + 제목), TabBar 없음.
 */

const PAGE_SIZE = 10

/** 현재 경매 중인 상품(Figma 957:3014): 내가 올린 경매 중 예정 · 진행 중 */
export function MyOngoingAuctionsPage() {
  const query = useMyAuctionsInfiniteQuery({ status: 'ONGOING', size: PAGE_SIZE })
  return (
    <AuctionListScreen
      header={<Header title="현재 경매 중인 상품" />}
      query={query}
      emptyTitle="경매 중인 상품이 없어요"
      emptyDescription="상품을 등록하면 여기에서 볼 수 있어요"
      errorTitle="경매 중인 상품을 불러오지 못했어요"
    />
  )
}

/** 과거 경매했던 상품(Figma 957:3180): 내가 올린 경매 중 종료 · 취소 */
export function MyEndedAuctionsPage() {
  const query = useMyAuctionsInfiniteQuery({ status: 'ENDED', size: PAGE_SIZE })
  return (
    <AuctionListScreen
      header={<Header title="과거 경매했던 상품" />}
      query={query}
      emptyTitle="지난 경매가 없어요"
      emptyDescription="경매가 끝난 상품이 여기에 모여요"
      errorTitle="지난 경매를 불러오지 못했어요"
    />
  )
}

/** 관심 목록(Figma 957:3328): 관심 등록한 경매 */
export function LikedAuctionsPage() {
  const query = useLikedAuctionsInfiniteQuery({ size: PAGE_SIZE })
  return (
    <AuctionListScreen
      header={<Header title="관심 상품" />}
      query={query}
      emptyTitle="관심 상품이 없어요"
      emptyDescription="하트를 눌러 관심 상품을 모아 보세요"
      errorTitle="관심 목록을 불러오지 못했어요"
    />
  )
}
