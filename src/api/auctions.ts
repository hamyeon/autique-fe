import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  AuctionCard,
  AuctionDetail,
  AuctionList,
  AuctionListQuery,
  AuctionLive,
  BidList,
  BidListQuery,
  LikedAuctionListQuery,
  MyAuctionListQuery,
  MyAuctionState,
  PlaceBidRequest,
  PopularAuctions,
  RecommendedAuctions,
  RelistAuctionRequest,
  SimilarAuctions,
  UpdateStartPriceRequest,
} from '@/api/schemas/auctions'
import { meKeys } from '@/api/me'

export const auctionKeys = {
  all: ['auctions'] as const,
  /** 카드 목록 전부. 관심 등록이 바로 반영되도록 카드 목록은 모두 이 키 아래에 둡니다. */
  lists: () => [...auctionKeys.all, 'list'] as const,
  /** 상품 찾기 최신순(무한 스크롤) */
  infiniteList: (query: Omit<AuctionListQuery, 'page'>) =>
    [...auctionKeys.lists(), 'infinite', query] as const,
  /** 인기 경매(홈 4개 · 상품 찾기 인기순 20개) */
  popular: (limit: number) => [...auctionKeys.lists(), 'popular', limit] as const,
  /** 추천 경매(홈 '나에게 딱 맞는 상품') */
  recommended: (limit: number) => [...auctionKeys.lists(), 'recommended', limit] as const,
  /** 검색 결과(무한 스크롤) */
  search: (keyword: string) => [...auctionKeys.lists(), 'search', keyword] as const,
  /** 내가 참여한 경매(마이페이지) */
  participatingList: (query: Omit<MyAuctionListQuery, 'page'>) =>
    [...auctionKeys.lists(), 'participating', query] as const,
  /** 내가 판매 등록한 경매(마이페이지) */
  sellingList: (query: Omit<MyAuctionListQuery, 'page'>) =>
    [...auctionKeys.lists(), 'selling', query] as const,
  /** 관심 목록(마이페이지) */
  likedList: (query: Omit<LikedAuctionListQuery, 'page'> = {}) =>
    [...auctionKeys.lists(), 'liked', query] as const,
  detail: (auctionId: number) => [...auctionKeys.all, 'detail', auctionId] as const,
  live: (auctionId: number) => [...auctionKeys.all, 'live', auctionId] as const,
  bidLists: (auctionId: number) => [...auctionKeys.all, 'bids', auctionId] as const,
  bids: (auctionId: number, query: Omit<BidListQuery, 'page'> = {}) =>
    [...auctionKeys.bidLists(auctionId), query] as const,
  /** 실시간 화면의 최신 입찰 한 페이지(폴링) */
  latestBids: (auctionId: number) => [...auctionKeys.bidLists(auctionId), 'latest'] as const,
  recommendation: (auctionId: number) => [...auctionKeys.all, 'recommendation', auctionId] as const,
  result: (auctionId: number) => [...auctionKeys.all, 'result', auctionId] as const,
  similar: (auctionId: number) => [...auctionKeys.all, 'similar', auctionId] as const,
}

/** 실시간 상태 폴링 기본 간격 */
const LIVE_POLL_MS = 3000

/* ───────── API 함수 ───────── */

/** 예정 · 진행 중 경매(최신순). page는 0부터 */
export function getAuctions(query: AuctionListQuery = {}, signal?: AbortSignal) {
  return request(endpoints.getAuctions, { query, signal })
}

export function getPopularAuctions(limit: number, signal?: AbortSignal) {
  return request(endpoints.getPopularAuctions, { query: { limit }, signal })
}

export function getRecommendedAuctions(limit: number, signal?: AbortSignal) {
  return request(endpoints.getRecommendedAuctions, { query: { limit }, signal })
}

/** 내가 구매자로 참여한 경매 */
export function getMyAuctions(query: MyAuctionListQuery, signal?: AbortSignal) {
  return request(endpoints.getMyAuctions, { query, signal })
}

/** 내가 판매 등록한 경매 */
export function getMySellingAuctions(query: MyAuctionListQuery, signal?: AbortSignal) {
  return request(endpoints.getMySellingAuctions, { query, signal })
}

/** 관심 목록 */
export function getLikedAuctions(query: LikedAuctionListQuery = {}, signal?: AbortSignal) {
  return request(endpoints.getLikedAuctions, { query, signal })
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

/** 상품 찾기 최신순. page는 0부터 */
export function useAuctionsInfiniteQuery(query: Omit<AuctionListQuery, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: auctionKeys.infiniteList(query),
    queryFn: ({ pageParam, signal }) => getAuctions({ ...query, page: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}

/** 홈 '지금 인기 있는 경매' */
export function usePopularAuctionsQuery(limit: number) {
  return useQuery({
    queryKey: auctionKeys.popular(limit),
    queryFn: ({ signal }) => getPopularAuctions(limit, signal),
  })
}

/**
 * 상품 찾기 인기순. 인기 API는 페이지가 없어(최대 20개) 한 페이지짜리 목록으로 바꿔
 * 최신순과 같은 목록 화면(무한 스크롤 쿼리)을 그대로 씁니다.
 */
export function usePopularAuctionsInfiniteQuery(limit: number) {
  return useInfiniteQuery({
    queryKey: [...auctionKeys.popular(limit), 'infinite'],
    queryFn: async ({ signal }): Promise<AuctionList> => {
      const { items } = await getPopularAuctions(limit, signal)
      return { items, page: 0, size: limit, hasNext: false }
    },
    initialPageParam: 0,
    getNextPageParam: () => undefined,
  })
}

/** 홈 '나에게 딱 맞는 상품'. 로그인 상태에 따라 개인화 · 대체 추천이 달라집니다. */
export function useRecommendedAuctionsQuery(limit: number) {
  return useQuery({
    queryKey: auctionKeys.recommended(limit),
    queryFn: ({ signal }) => getRecommendedAuctions(limit, signal),
  })
}

/** 검색에서 한 번에 훑는 경매 수(목록 API 최대) */
const SEARCH_SCAN_SIZE = 50

/** 브랜드 · 상품 표시명에 검색어가 들어 있는지(대소문자 · 띄어쓰기 무시) */
function matchesKeyword(item: AuctionCard, keyword: string) {
  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '')
  const target = normalize(keyword)
  return [item.brand ?? '', item.name].some((text) => normalize(text).includes(target))
}

/**
 * 검색. 서버에 검색 API가 없어(명세: 검색 기능 없음) 상품 찾기 목록(GET /api/auctions)을 훑으며 화면에서 거릅니다.
 * 한 번 부를 때 결과가 1개 이상 나오거나 목록 끝까지 서버 페이지를 이어 읽고, page에는 마지막으로 읽은 서버 페이지를 담습니다.
 * 목록 API가 예정 · 진행 중 경매만 주므로 끝난 경매는 검색되지 않습니다.
 */
export function useAuctionSearchInfiniteQuery(keyword: string) {
  return useInfiniteQuery({
    queryKey: auctionKeys.search(keyword),
    queryFn: async ({ pageParam, signal }): Promise<AuctionList> => {
      let page = pageParam
      for (;;) {
        const result = await getAuctions({ page, size: SEARCH_SCAN_SIZE }, signal)
        const items = result.items.filter((item) => matchesKeyword(item, keyword))
        if (items.length > 0 || !result.hasNext) return { ...result, items }
        page += 1
      }
    },
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}

/** 진행 중 → 종료 순으로 이어 읽을 다음 위치 */
interface StatePageParam {
  state: MyAuctionState
  page: number
}

/** 한 번 불러온 결과 + 다음에 읽을 위치(없으면 끝) */
type ChainedAuctionList = AuctionList & { next: StatePageParam | null }

/**
 * 마이페이지 판매 · 참여 목록: 진행 중(state=current)을 끝까지 읽은 뒤 종료(state=past)를 이어 읽어 한 목록으로 보여줍니다.
 * 빈 페이지가 나오면(진행 중이 하나도 없는 등) 같은 호출에서 다음 위치를 이어 읽어, 화면이 빈 목록으로 멈추지 않게 합니다.
 */
function useChainedStateInfiniteQuery(
  queryKey: readonly unknown[],
  fetchPage: (query: MyAuctionListQuery, signal: AbortSignal) => Promise<AuctionList>,
  size: number,
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }): Promise<ChainedAuctionList> => {
      let at = pageParam
      for (;;) {
        const result = await fetchPage({ ...at, size }, signal)
        const next: StatePageParam | null = result.hasNext
          ? { state: at.state, page: at.page + 1 }
          : at.state === 'current'
            ? { state: 'past', page: 0 }
            : null
        if (result.items.length > 0 || !next) return { ...result, hasNext: next !== null, next }
        at = next
      }
    },
    initialPageParam: { state: 'current', page: 0 } as StatePageParam,
    getNextPageParam: (last) => last.next ?? undefined,
  })
}

/** 내가 참여한 경매(마이페이지). 진행 중 → 종료 순 */
export function useMyAuctionsInfiniteQuery({ size = 20 }: { size?: number } = {}) {
  return useChainedStateInfiniteQuery(auctionKeys.participatingList({ size }), getMyAuctions, size)
}

/** 내가 판매 등록한 경매(마이페이지). 진행 중 → 종료 순 */
export function useMySellingAuctionsInfiniteQuery({ size = 20 }: { size?: number } = {}) {
  return useChainedStateInfiniteQuery(auctionKeys.sellingList({ size }), getMySellingAuctions, size)
}

/** 관심 목록(마이페이지). page는 0부터 */
export function useLikedAuctionsInfiniteQuery(query: Omit<LikedAuctionListQuery, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: auctionKeys.likedList(query),
    queryFn: ({ pageParam, signal }) => getLikedAuctions({ ...query, page: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}

/** 목록 · 비슷한 상품 캐시에서 이 경매의 카드 정보를 찾습니다(상세를 열 때 먼저 그릴 값). */
export function findAuctionPreview(queryClient: QueryClient, auctionId: number) {
  const cached = queryClient.getQueriesData<
    | AuctionList
    | InfiniteData<AuctionList>
    | PopularAuctions
    | RecommendedAuctions
    | SimilarAuctions
  >({
    predicate: ({ queryKey }) =>
      queryKey[0] === 'auctions' && ['list', 'similar'].includes(queryKey[1] as string),
  })
  for (const [, data] of cached) {
    if (!data) continue
    const items = 'pages' in data ? data.pages.flatMap((p) => p.items) : data.items
    const found = items.find((item) => item.auctionId === auctionId)
    if (found) return found
  }
  return undefined
}

/**
 * 카드 정보로 만든 임시 상세. isPlaceholderData일 때 화면은 상단(이미지 · 칩 · 상품명)만 이 값으로 그리고
 * 나머지는 스켈레톤으로 둡니다. 카드에 없는 필드는 빈 값이라 화면에서 읽지 않습니다.
 */
function previewToDetail(preview: AuctionCard): AuctionDetail {
  return {
    auctionId: preview.auctionId,
    status: preview.status,
    product: {
      productId: preview.productId,
      name: preview.name,
      brand: preview.brand ?? '',
      subName: '',
      grade: preview.grade ?? 'UNKNOWN',
      imageUrls: preview.thumbnailUrl ? [preview.thumbnailUrl] : [],
    },
    seller: { sellerId: 0, nickname: '', profileImageUrl: null, completedSalesCount: 0 },
    description: '',
    startPrice: preview.startPrice,
    currentPrice: preview.currentPrice,
    bidIncrement: 0,
    minNextBidAmount: 0,
    minCapAmount: 0,
    startsAt: '',
    endsAt: '',
    serverTime: '',
    bidCount: 0,
    isLiked: preview.isLiked,
    likeCount: preview.likeCount,
    myState: { isSeller: false, isHighestBidder: false, canBid: false },
  }
}

/** 홈 목록 · 비슷한 상품에서 들어오면 그 카드 정보로 먼저 그리고(placeholderData), 응답이 오면 채웁니다. */
export function useAuctionDetailQuery(auctionId: number, { enabled = true } = {}) {
  const queryClient = useQueryClient()
  return useQuery<AuctionDetail, Error, AuctionDetail, ReturnType<typeof auctionKeys.detail>>({
    queryKey: auctionKeys.detail(auctionId),
    queryFn: ({ signal }) => getAuctionDetail(auctionId, signal),
    enabled,
    placeholderData: () => {
      const preview = findAuctionPreview(queryClient, auctionId)
      return preview ? previewToDetail(preview) : undefined
    },
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

export const placeBidMutationKey = (auctionId: number) => ['place-bid', auctionId] as const

/**
 * 직접 입찰. 응답을 기다리는 동안 최신 입찰 목록 맨 위에 내 입찰을 먼저 넣고(낙관적), 실패하면 되돌립니다.
 * 성공하면 응답 값으로 실시간 상태를 바로 고친 뒤 실시간 · 입찰 이력 · 상세를 다시 불러옵니다.
 * 40904(BID_AMOUNT_TOO_LOW)도 live를 다시 불러 최신 금액을 반영합니다(명세).
 */
export function usePlaceBidMutation(auctionId: number) {
  const queryClient = useQueryClient()
  const latestKey = auctionKeys.latestBids(auctionId)
  const liveKey = auctionKeys.live(auctionId)
  return useMutation({
    mutationKey: placeBidMutationKey(auctionId),
    mutationFn: ({ body, idempotencyKey }: { body: PlaceBidRequest; idempotencyKey?: string }) =>
      placeBid(auctionId, body, idempotencyKey),
    onMutate: async ({ body }) => {
      // 진행 중인 폴링 응답이 낙관적 행을 덮어쓰지 않게 먼저 취소합니다.
      await queryClient.cancelQueries({ queryKey: latestKey })
      const before = queryClient.getQueryData<BidList>(latestKey)
      if (before) {
        queryClient.setQueryData<BidList>(latestKey, {
          ...before,
          bids: [
            {
              bidId: -Date.now(), // 응답 전 임시 id. 다시 불러오면 서버 입찰로 바뀝니다.
              bidderMasked: '',
              isMine: true,
              amount: body.amount,
              bidType: 'MANUAL',
              bidAt: new Date().toISOString(),
              isHighest: true,
            },
            ...before.bids.map((bid) => ({ ...bid, isHighest: false })),
          ],
        })
      }
      return { before }
    },
    onError: (_error, _variables, context) => {
      if (context?.before) queryClient.setQueryData(latestKey, context.before)
    },
    onSuccess: (result) => {
      // serverTime은 그대로라, 받은 시각(updatedAt)도 그대로 둬야 서버 시각 기준 카운트다운이 어긋나지 않습니다.
      const receivedAt = queryClient.getQueryState(liveKey)?.dataUpdatedAt
      queryClient.setQueryData<AuctionLive>(
        liveKey,
        (live) =>
          live
            ? {
                ...live,
                currentPrice: result.currentPrice,
                minNextBidAmount: result.minNextBidAmount,
                highestBidderMasked: result.highestBidderMasked,
                isMine: result.isHighestBidder,
                endsAt: result.endsAt,
                extensionCount: result.extensionCount,
                ...(result.autoBidCanceled && { myAutoBidStatus: null, myCap: null }),
              }
            : live,
        { updatedAt: receivedAt },
      )
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: liveKey }),
        queryClient.invalidateQueries({ queryKey: auctionKeys.bidLists(auctionId) }),
        queryClient.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) }),
      ]),
  })
}

interface CardList {
  items: AuctionCard[]
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

  // 목록 · 인기 · 추천 · 검색 캐시는 모두 카드 목록({ items })이거나 그 무한 스크롤 페이지들입니다.
  queryClient.setQueriesData<CardList | InfiniteData<CardList>>(
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
      /* 관심 목록에 넣거나 빼야 하므로 다시 불러옵니다. 보고 있는 관심 목록은 바로 다시 부르지 않아,
         하트를 실수로 눌러도 카드가 사라지지 않고 다시 누를 수 있습니다(다음에 열 때 반영). */
      queryClient.invalidateQueries({
        queryKey: [...auctionKeys.lists(), 'liked'],
        refetchType: 'inactive',
      })
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
