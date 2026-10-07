import { useIsMutating, useQuery } from '@tanstack/react-query'
import { auctionKeys, getAuctionBids, getAuctionLive, placeBidMutationKey } from '@/api/auctions'
import { useNow } from '@/hooks/use-now'
import { getRemainingMs } from '@/lib/remaining-time'

/*
 * 실시간 경매 데이터. 화면은 이 훅만 씁니다.
 * 명세는 폴링 방식이라(GET /live는 '가벼운 polling API', 입찰 내역은 GET /bids를 함께 호출)
 * TanStack Query refetchInterval로 두 API를 같은 간격으로 다시 불러옵니다.
 * 나중에 WebSocket · SSE로 바뀌면 이 파일 안에서 받은 값을 같은 쿼리 캐시에 넣도록만 바꾸면 됩니다.
 */

/** 폴링 간격 */
export const LIVE_POLL_MS = 3000
/** 카운트다운이 0이 된 뒤 서버의 종료 확인을 기다리는 동안의 간격 */
export const LIVE_ENDING_POLL_MS = 1000
/** 입찰 내역은 최신 한 페이지만 */
export const LIVE_BID_PAGE_SIZE = 20

export function useLiveAuction(auctionId: number, { enabled = true } = {}) {
  /* 직접 입찰 응답을 기다리는 동안에는 폴링이 낙관적으로 넣은 내 입찰을 덮지 않게 잠시 멈춥니다. */
  const placing = useIsMutating({ mutationKey: placeBidMutationKey(auctionId) }) > 0
  const now = useNow(1000)

  /*
   * refetchInterval은 탭이 백그라운드면 멈춥니다(refetchIntervalInBackground 기본 false).
   * 돌아오면 refetchOnWindowFocus: 'always'로 바로 한 번 다시 불러옵니다(앱 전체 기본값은 false).
   * 화면을 떠나면 쿼리 구독이 끝나 폴링이, 언마운트로 useNow 타이머가 정리됩니다.
   */
  const live = useQuery({
    queryKey: auctionKeys.live(auctionId),
    queryFn: ({ signal }) => getAuctionLive(auctionId, signal),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: 'always',
    refetchInterval: (query) => {
      if (placing) return false
      const data = query.state.data
      if (data && data.status !== 'LIVE') return false
      return timeUp(data, query.state.dataUpdatedAt, Date.now())
        ? LIVE_ENDING_POLL_MS
        : LIVE_POLL_MS
    },
  })

  const bids = useQuery({
    queryKey: auctionKeys.latestBids(auctionId),
    queryFn: ({ signal }) =>
      getAuctionBids(auctionId, { page: 0, size: LIVE_BID_PAGE_SIZE }, signal),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: 'always',
    refetchInterval: placing || live.data?.status !== 'LIVE' ? false : LIVE_POLL_MS,
  })

  const remainingMs = live.data ? remainingOf(live.data, live.dataUpdatedAt, now) : null

  return {
    live,
    bids,
    /** 서버 시각 기준 남은 시간(ms). 아직 모르면 null */
    remainingMs,
    /** 카운트다운이 0이 됨. 서버가 종료(ENDED)를 확인하기 전까지는 연장될 수도 있습니다. */
    timeUp: remainingMs !== null && remainingMs <= 0,
  }
}

interface LiveClock {
  endsAt: string
  serverTime: string
}

/**
 * 기기 시계가 아니라 서버 시각 기준 남은 시간.
 * 응답을 받은 순간(receivedAt, 기기 시각)의 서버 시각이 serverTime이므로, 지금 서버 시각 = serverTime + (now - receivedAt)
 */
function remainingOf(clock: LiveClock, receivedAt: number, now: number) {
  const serverNow = Date.parse(clock.serverTime) + (now - receivedAt)
  return getRemainingMs(Date.parse(clock.endsAt), serverNow)
}

function timeUp(clock: LiveClock | undefined, receivedAt: number, now: number) {
  return !!clock && remainingOf(clock, receivedAt, now) <= 0
}
