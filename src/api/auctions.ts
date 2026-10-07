import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  AuctionDetail,
  AuctionList,
  AuctionListQuery,
  BidListQuery,
  PlaceBidRequest,
  RelistAuctionRequest,
  SimilarAuctions,
  UpdateStartPriceRequest,
} from '@/api/schemas/auctions'
import { meKeys } from '@/api/me'

export const auctionKeys = {
  all: ['auctions'] as const,
  lists: () => [...auctionKeys.all, 'list'] as const,
  /** 한 페이지만 (홈 '나에게 딱 맞는 상품') */
  list: (query: AuctionListQuery) => [...auctionKeys.lists(), 'page', query] as const,
  /** 무한 스크롤 (홈 '지금 인기 있는 경매') */
  infiniteList: (query: Omit<AuctionListQuery, 'page'>) =>
    [...auctionKeys.lists(), 'infinite', query] as const,
  detail: (auctionId: number) => [...auctionKeys.all, 'detail', auctionId] as const,
  live: (auctionId: number) => [...auctionKeys.all, 'live', auctionId] as const,
  bidLists: (auctionId: number) => [...auctionKeys.all, 'bids', auctionId] as const,
  bids: (auctionId: number, query: Omit<BidListQuery, 'page'> = {}) =>
    [...auctionKeys.bidLists(auctionId), query] as const,
  recommendation: (auctionId: number) => [...auctionKeys.all, 'recommendation', auctionId] as const,
  result: (auctionId: number) => [...auctionKeys.all, 'result', auctionId] as const,
  similar: (auctionId: number) => [...auctionKeys.all, 'similar', auctionId] as const,
}

/** 실시간 상태 폴링 기본 간격 */
const LIVE_POLL_MS = 3000

/* ───────── API 함수 ───────── */

/** [ASSUMED] 명세에 없는 경매 목록 API (홈) */
export function getAuctions(query: AuctionListQuery = {}, signal?: AbortSignal) {
  return request(endpoints.getAuctions, { query, signal })
}

export function getAuctionDetail(auctionId: number, signal?: AbortSignal) {
  return request(endpoints.getAuctionDetail, { params: { auctionId }, signal })
}

export function getAuctionBids(auctionId: number, query: BidListQuery = {}, signal?: AbortSignal) {
  return request(endpoints.getAuctionBids, { params: { auctionId }, query, signal })
}

/** idempotencyKey: 같은 입찰을 다시 보낼 때만 넘기세요. */
export function placeBid(auctionId: number, body: PlaceBidRequest, idempotencyKey?: string) {
  return request(endpoints.placeBid, { params: { auctionId }, body, idempotencyKey })
}

export function getAuctionLive(auctionId: number, signal?: AbortSignal) {
  return request(endpoints.getAuctionLive, { params: { auctionId }, signal })
}

export function getAutoBidRecommendation(auctionId: number, signal?: AbortSignal) {
  return request(endpoints.getAutoBidRecommendation, { params: { auctionId }, signal })
}

export function getAuctionResult(auctionId: number, signal?: AbortSignal) {
  return request(endpoints.getAuctionResult, { params: { auctionId }, signal })
}

export function forfeitAward(auctionId: number) {
  return request(endpoints.forfeitAward, { params: { auctionId } })
}

export function getSimilarAuctions(auctionId: number, signal?: AbortSignal) {
  return request(endpoints.getSimilarAuctions, { params: { auctionId }, signal })
}

export function likeAuction(auctionId: number) {
  return request(endpoints.likeAuction, { params: { auctionId } })
}

export function unlikeAuction(auctionId: number) {
  return request(endpoints.unlikeAuction, { params: { auctionId } })
}

export function relistAuction(previousAuctionId: number, body: RelistAuctionRequest) {
  return request(endpoints.relistAuction, { params: { previousAuctionId }, body })
}

export function cancelAuction(auctionId: number) {
  return request(endpoints.cancelAuction, { params: { auctionId } })
}

export function updateStartPrice(auctionId: number, body: UpdateStartPriceRequest) {
  return request(endpoints.updateStartPrice, { params: { auctionId }, body })
}

/* ───────── 조회 훅 ───────── */

/** [ASSUMED] 명세에 없는 경매 목록 API (홈). page는 0부터 */
export function useAuctionsQuery(query: AuctionListQuery = {}) {
  return useQuery({
    queryKey: auctionKeys.list(query),
    queryFn: ({ signal }) => getAuctions(query, signal),
  })
}

/** [ASSUMED] 명세에 없는 경매 목록 API (홈). page는 0부터, 페이지 방식은 입찰 이력과 같음 */
export function useAuctionsInfiniteQuery(query: Omit<AuctionListQuery, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: auctionKeys.infiniteList(query),
    queryFn: ({ pageParam, signal }) => getAuctions({ ...query, page: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}

export function useAuctionDetailQuery(auctionId: number) {
  return useQuery({
    queryKey: auctionKeys.detail(auctionId),
    queryFn: ({ signal }) => getAuctionDetail(auctionId, signal),
  })
}

/** 입찰 이력. page는 0부터, 기본 latest */
export function useAuctionBidsInfiniteQuery(
  auctionId: number,
  query: Omit<BidListQuery, 'page'> = {},
) {
  return useInfiniteQuery({
    queryKey: auctionKeys.bids(auctionId, query),
    queryFn: ({ pageParam, signal }) =>
      getAuctionBids(auctionId, { ...query, page: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}

/** 가벼운 polling API. 실시간 화면에서 입찰 이력과 함께 씁니다. */
export function useAuctionLiveQuery(
  auctionId: number,
  { refetchInterval = LIVE_POLL_MS }: { refetchInterval?: number | false } = {},
) {
  return useQuery({
    queryKey: auctionKeys.live(auctionId),
    queryFn: ({ signal }) => getAuctionLive(auctionId, signal),
    staleTime: 0,
    refetchInterval,
  })
}

/** 자동입찰 상한가 바텀시트의 초기값 · 최소값 */
export function useAutoBidRecommendationQuery(auctionId: number) {
  return useQuery({
    queryKey: auctionKeys.recommendation(auctionId),
    queryFn: ({ signal }) => getAutoBidRecommendation(auctionId, signal),
    staleTime: 0,
  })
}

/** 결제 기한 만료 화면은 이 결과 + usePenaltiesQuery 두 번 호출로 구성합니다. */
export function useAuctionResultQuery(auctionId: number) {
  return useQuery({
    queryKey: auctionKeys.result(auctionId),
    queryFn: ({ signal }) => getAuctionResult(auctionId, signal),
  })
}

export function useSimilarAuctionsQuery(auctionId: number) {
  return useQuery({
    queryKey: auctionKeys.similar(auctionId),
    queryFn: ({ signal }) => getSimilarAuctions(auctionId, signal),
  })
}

/* ───────── 변경 훅 ───────── */

/** 40904(BID_AMOUNT_TOO_LOW)를 받으면 live를 다시 불러 최신 금액을 반영합니다. 여기서는 성공·실패 모두 다시 불러옵니다. */
export function usePlaceBidMutation(auctionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: PlaceBidRequest; idempotencyKey?: string }) =>
      placeBid(auctionId, body, idempotencyKey),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: auctionKeys.live(auctionId) }),
        queryClient.invalidateQueries({ queryKey: auctionKeys.bidLists(auctionId) }),
        queryClient.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) }),
      ]),
  })
}

interface LikeState {
  isLiked: boolean
  likeCount: number
}

/** 목록(한 페이지 · 무한) · 비슷한 상품 · 상세 캐시에서 해당 경매의 관심 상태를 바꿉니다. 바꾸기 전 값을 돌려줍니다. */
function setLikeInCaches(
  queryClient: QueryClient,
  auctionId: number,
  next: (prev: LikeState) => LikeState,
) {
  let before: LikeState | undefined
  const update = <T extends { auctionId: number } & LikeState>(item: T): T => {
    if (item.auctionId !== auctionId) return item
    before ??= { isLiked: item.isLiked, likeCount: item.likeCount }
    return { ...item, ...next(item) }
  }

  queryClient.setQueriesData<AuctionList | InfiniteData<AuctionList>>(
    { queryKey: auctionKeys.lists() },
    (data) => {
      if (!data) return data
      if ('pages' in data) {
        return { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map(update) })) }
      }
      return { ...data, items: data.items.map(update) }
    },
  )
  queryClient.setQueriesData<SimilarAuctions>(
    { queryKey: [...auctionKeys.all, 'similar'] },
    (data) => (data ? { ...data, items: data.items.map(update) } : data),
  )
  queryClient.setQueryData<AuctionDetail>(auctionKeys.detail(auctionId), (data) =>
    data ? update(data) : data,
  )
  return before
}

/**
 * 관심 등록/해제. 누르는 즉시 모든 캐시에 반영하고(낙관적 업데이트),
 * 성공하면 서버의 likeCount로 맞추고, 실패하면 누르기 전 값으로 되돌립니다.
 */
export function useToggleAuctionLikeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ auctionId, liked }: { auctionId: number; liked: boolean }) =>
      liked ? likeAuction(auctionId) : unlikeAuction(auctionId),
    onMutate: async ({ auctionId, liked }) => {
      await queryClient.cancelQueries({ queryKey: auctionKeys.all })
      const before = setLikeInCaches(queryClient, auctionId, (prev) => ({
        isLiked: liked,
        likeCount: prev.isLiked === liked ? prev.likeCount : prev.likeCount + (liked ? 1 : -1),
      }))
      return { before }
    },
    onSuccess: ({ liked, likeCount }, { auctionId }) => {
      setLikeInCaches(queryClient, auctionId, () => ({ isLiked: liked, likeCount }))
    },
    onError: (_error, { auctionId }, context) => {
      const before = context?.before
      if (before) setLikeInCaches(queryClient, auctionId, () => before)
    },
  })
}

/** 페널티는 응답에 없으므로 내 페널티를 다시 불러옵니다. */
export function useForfeitAwardMutation(auctionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => forfeitAward(auctionId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: auctionKeys.result(auctionId) }),
        queryClient.invalidateQueries({ queryKey: meKeys.penalties() }),
      ]),
  })
}

export function useRelistAuctionMutation(previousAuctionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: RelistAuctionRequest) => relistAuction(previousAuctionId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: auctionKeys.all }),
  })
}

export function useCancelAuctionMutation(auctionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cancelAuction(auctionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: auctionKeys.all }),
  })
}

export function useUpdateStartPriceMutation(auctionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateStartPriceRequest) => updateStartPrice(auctionId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) }),
  })
}
