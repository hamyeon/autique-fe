import { endpoints } from '@/api/endpoints'
import type { MockAuction } from '@/mocks/data/auctions'
import {
  BUSY_RIVAL_BID_INTERVAL_MS,
  ENDING_SCENARIO_MS,
  RIVAL_BID_INTERVAL_MS,
  auctions,
  cannotBidReasonOf,
  createAuctionId,
  currentPriceOf,
  extendIfClosing,
  findAuction,
  isSeller,
  minNextBidOf,
  placeManualBid,
  placeRivalBid,
  runProxyBidding,
  saveAuctionState,
  statusOf,
  tickRivals,
  toBid,
  toDetail,
  toCard,
  toLive,
  toRecommended,
  toSimilar,
} from '@/mocks/data/auctions'
import { HOUR, kst } from '@/mocks/data/common'
import { addPenalty } from '@/mocks/data/me'
import { findOrder, resultOverrides, toResult } from '@/mocks/data/orders'
import type { MockScenario } from '@/mocks/define'
import { idParam, mockEndpoint, pageParams, paginate } from '@/mocks/define'
import type { MockError } from '@/mocks/errors'
import { invalidAuctionTime, mockErrors } from '@/mocks/errors'

/** 직접 입찰 불가 사유 → 명세 오류 */
const CANNOT_BID_ERROR: Record<NonNullable<ReturnType<typeof cannotBidReasonOf>>, MockError> = {
  AUCTION_NOT_STARTED: mockErrors.AUCTION_NOT_STARTED,
  AUCTION_CLOSED: mockErrors.AUCTION_CLOSED,
  SELLER_CANNOT_BID: mockErrors.SELLER_CANNOT_BID,
  PENALTY_RESTRICTED: mockErrors.PENALTY_RESTRICTED,
  ALREADY_HIGHEST_BIDDER: mockErrors.ALREADY_HIGHEST_BIDDER,
}

/* ───────── 실시간 흉내 (?mock=ending · busy · quiet · bid-outbid) ───────── */

/** 페이지를 연 동안 이미 적용한 경매 */
const endingApplied = new Set<number>()
const bidOutbidApplied = new Set<number>()

/** 실시간 화면이 폴링할 때마다: ending이면 30초 뒤 종료로 당기고, quiet가 아니면 다른 입찰자를 움직입니다. */
function simulateLive(a: MockAuction, scenario: MockScenario | null) {
  if (scenario === 'ending' && !endingApplied.has(a.auctionId) && statusOf(a) === 'LIVE') {
    endingApplied.add(a.auctionId)
    a.endsAt = Math.min(a.endsAt, Date.now() + ENDING_SCENARIO_MS)
  }
  if (scenario === 'quiet') return
  tickRivals(a, scenario === 'busy' ? BUSY_RIVAL_BID_INTERVAL_MS : RIVAL_BID_INTERVAL_MS)
}

/** 예정 · 진행 중 경매(목록 · 인기 · 추천 대상) */
const isOpen = (a: MockAuction) => ['SCHEDULED', 'LIVE'].includes(statusOf(a))

/** 마이페이지 목록의 state(기본 current) */
const matchesState = (a: MockAuction, query: URLSearchParams) =>
  isOpen(a) === (query.get('state') !== 'past')

/** 경매 생성 최신순(목은 id가 클수록 최근) */
const latestFirst = (x: MockAuction, y: MockAuction) => y.auctionId - x.auctionId

/**
 * 목에서 홈 · 상품 찾기에 보이는 경매: 홈 상품(1~4) + 목에서 새로 등록한 경매(id 100~).
 * 나머지 목 경매(11~22)는 상세 · 결과 화면 테스트용이라 목록에는 넣지 않습니다.
 */
const listed = () => auctions.filter((a) => isOpen(a) && (a.auctionId <= 4 || a.auctionId >= 100))

export const auctionHandlers = [
  /** 경매 생성 최신순(목은 id가 클수록 최근) */
  mockEndpoint(endpoints.getAuctions, {
    error: mockErrors.INVALID_REQUEST,
    empty: ({ query, ok }) => ok({ items: [], ...pageParams(query), hasNext: false }),
    resolve: ({ query, ok }) => {
      const { page, size } = pageParams(query)
      const sorted = listed().sort(latestFirst)
      return ok(paginate(sorted.map(toCard), page, size))
    },
  }),

  /** 실제 입찰 기록 수 많은 순 → 종료 임박순 → id 순. 경매 상세(/api/auctions/{auctionId})보다 먼저 등록해야 합니다. */
  mockEndpoint(endpoints.getPopularAuctions, {
    error: mockErrors.INVALID_REQUEST,
    empty: ({ ok }) => ok({ items: [] }),
    resolve: ({ query, ok }) => {
      const limit = Number(query.get('limit') ?? 4) || 4
      const sorted = listed().sort(
        (x, y) => y.bids.length - x.bids.length || x.endsAt - y.endsAt || x.auctionId - y.auctionId,
      )
      return ok({ items: sorted.slice(0, limit).map(toCard) })
    },
  }),

  /**
   * 내가 참여한 경매: 내 실제 입찰이 있거나 취소되지 않은 자동입찰이 있는 경매(판매자라는 이유만으로는 넣지 않음).
   * current = 예정 · 진행 중, past = 종료 · 취소. 최신순
   */
  mockEndpoint(endpoints.getMyAuctions, {
    error: mockErrors.INVALID_REQUEST,
    empty: ({ query, ok }) => ok({ items: [], ...pageParams(query), hasNext: false }),
    resolve: ({ query, ok }) => {
      const participated = (a: MockAuction) =>
        a.bids.some((b) => b.isMine) || (a.myAutoBid !== null && a.myAutoBid.status !== 'CANCELED')
      const items = auctions
        .filter((a) => participated(a) && matchesState(a, query))
        .sort(latestFirst)
      const { page, size } = pageParams(query)
      return ok(paginate(items.map(toCard), page, size))
    },
  }),

  /** 내가 판매 등록한 경매. current = 예정 · 진행 중, past = 종료(유찰 포함) · 취소. 최신순 */
  mockEndpoint(endpoints.getMySellingAuctions, {
    error: mockErrors.INVALID_REQUEST,
    empty: ({ query, ok }) => ok({ items: [], ...pageParams(query), hasNext: false }),
    resolve: ({ query, ok }) => {
      const items = auctions.filter((a) => isSeller(a) && matchesState(a, query)).sort(latestFirst)
      const { page, size } = pageParams(query)
      return ok(paginate(items.map(toCard), page, size))
    },
  }),

  /** 관심 등록한 경매(종료 · 취소 포함). 목 데이터에 등록 시각이 없어 최근 등록된 경매순 */
  mockEndpoint(endpoints.getLikedAuctions, {
    error: mockErrors.INVALID_REQUEST,
    empty: ({ query, ok }) => ok({ items: [], ...pageParams(query), hasNext: false }),
    resolve: ({ query, ok }) => {
      const items = auctions.filter((a) => a.isLiked).sort(latestFirst)
      const { page, size } = pageParams(query)
      return ok(paginate(items.map(toCard), page, size))
    },
  }),

  /** 목은 늘 대체 추천(personalized=false): 마감 임박순 */
  mockEndpoint(endpoints.getRecommendedAuctions, {
    error: mockErrors.INTERNAL_SERVER_ERROR,
    empty: ({ ok }) =>
      ok({ personalized: false, reason: '추천할 경매가 아직 없습니다.', items: [] }),
    resolve: ({ query, ok }) => {
      const requested = Number(query.get('limit') ?? 10) || 10
      const limit = requested <= 0 ? 10 : Math.min(requested, 50)
      const sorted = listed().sort((x, y) => x.endsAt - y.endsAt || x.auctionId - y.auctionId)
      return ok({
        personalized: false,
        reason: '아직 취향을 파악할 정보가 부족해 마감 임박·인기 경매를 보여드립니다.',
        items: sorted.slice(0, limit).map(toRecommended),
      })
    },
  }),

  /** ?mock=error는 명세의 다른 오류(401)로 돌려줘, 없는 id(404)와 구분해 확인할 수 있게 합니다. */
  mockEndpoint(endpoints.getAuctionDetail, {
    error: mockErrors.UNAUTHORIZED,
    resolve: ({ params, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      return a ? ok(toDetail(a)) : fail(mockErrors.AUCTION_NOT_FOUND)
    },
  }),

  mockEndpoint(endpoints.getAuctionBids, {
    error: mockErrors.AUCTION_NOT_FOUND,
    empty: ({ query, ok }) => ok({ bids: [], ...pageParams(query), hasNext: false }),
    resolve: ({ params, query, scenario, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      simulateLive(a, scenario)
      const bids = a.bids.map(toBid)
      if (query.get('order') === 'oldest') bids.reverse()
      const { page, size } = pageParams(query)
      const { items, ...meta } = paginate(bids, page, size)
      return ok({ bids: items, ...meta })
    },
  }),

  /** 명세의 Validation 순서대로 검사하고, 다른 사람 자동입찰이 있으면 즉시 반격합니다. */
  mockEndpoint(endpoints.placeBid, {
    error: mockErrors.BID_AMOUNT_TOO_LOW,
    resolve: ({ params, body, scenario, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      const reason = cannotBidReasonOf(a)
      if (reason) return fail(CANNOT_BID_ERROR[reason])
      // ?mock=bid-outbid: 제출 직전에 다른 사람이 제출 금액 이상으로 입찰(경매마다 한 번)
      if (scenario === 'bid-outbid' && !bidOutbidApplied.has(a.auctionId)) {
        bidOutbidApplied.add(a.auctionId)
        const steps = Math.max(1, Math.ceil((body.amount - currentPriceOf(a)) / a.bidIncrement))
        placeRivalBid(a, currentPriceOf(a) + steps * a.bidIncrement)
        saveAuctionState()
      }
      if (body.amount < minNextBidOf(a)) return fail(mockErrors.BID_AMOUNT_TOO_LOW)
      if ((body.amount - currentPriceOf(a)) % a.bidIncrement !== 0)
        return fail(mockErrors.BID_NOT_ALIGNED)

      // 자동입찰 사용 중 직접 입찰하면 자동입찰은 취소됩니다.
      const autoBidCanceled = !!a.myAutoBid && a.myAutoBid.status !== 'CANCELED'
      if (a.myAutoBid && autoBidCanceled) a.myAutoBid.status = 'CANCELED'

      const bid = placeManualBid(a, body.amount)
      extendIfClosing(a) // 연장은 사용자 요청 1회 기준
      const { rivalResponded } = runProxyBidding(a)
      saveAuctionState()

      return ok(
        {
          bidId: bid.bidId,
          submittedAmount: body.amount,
          currentPrice: currentPriceOf(a),
          minNextBidAmount: minNextBidOf(a),
          highestBidderMasked: a.bids[0].bidderMasked,
          isHighestBidder: a.bids[0].isMine,
          autoBidCanceled,
          proxyResponded: rivalResponded,
          endsAt: kst(a.endsAt),
          extensionCount: a.extensionCount,
        },
        201,
      )
    },
  }),

  /** ?mock=error는 서버 오류(공통 오류 코드표 50001)로, 없는 id(404 '경매를 찾을 수 없어요')와 구분해 확인합니다. */
  mockEndpoint(endpoints.getAuctionLive, {
    error: mockErrors.INTERNAL_SERVER_ERROR,
    resolve: ({ params, scenario, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      simulateLive(a, scenario)
      return ok(toLive(a))
    },
  }),

  mockEndpoint(endpoints.getAutoBidRecommendation, {
    error: mockErrors.AUCTION_NOT_FOUND,
    resolve: ({ params, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      const minCapAmount = minNextBidOf(a)
      return ok({
        auctionId: a.auctionId,
        aiRecommendedCap: Math.max(a.aiEstimatedPrice ?? 0, minCapAmount),
        currentPrice: currentPriceOf(a),
        minCapAmount,
        bidIncrement: a.bidIncrement,
      })
    },
  }),

  mockEndpoint(endpoints.getAuctionResult, {
    error: mockErrors.AUCTION_NOT_FOUND,
    resolve: ({ params, ok, fail }) => {
      const result = toResult(idParam(params, 'auctionId'))
      return result ? ok(result) : fail(mockErrors.AUCTION_NOT_FOUND)
    },
  }),

  /** 결제 대기 주문은 CANCELED, 페널티 FORFEITED 1건 */
  mockEndpoint(endpoints.forfeitAward, {
    error: mockErrors.ALREADY_PAID,
    resolve: ({ params, ok, fail }) => {
      const auctionId = idParam(params, 'auctionId')
      const result = toResult(auctionId)
      if (!result) return fail(mockErrors.AUCTION_NOT_FOUND)
      if (result.result === 'PAYMENT_EXPIRED') return fail(mockErrors.PAYMENT_EXPIRED)
      if (result.result !== 'WON' || result.orderId == null) return fail(mockErrors.NOT_AWARDEE)

      const order = findOrder(result.orderId)!
      if (order.status === 'PAID') return fail(mockErrors.ALREADY_PAID)
      if (order.status === 'PAYMENT_EXPIRED') return fail(mockErrors.PAYMENT_EXPIRED)
      order.status = 'CANCELED'
      resultOverrides[auctionId] = 'FORFEITED'
      addPenalty('FORFEITED', auctionId)
      return ok({ auctionId, result: 'FORFEITED' })
    },
  }),

  mockEndpoint(endpoints.getSimilarAuctions, {
    error: mockErrors.AUCTION_NOT_FOUND,
    empty: ({ ok }) => ok({ items: [] }),
    resolve: ({ params, ok, fail }) => {
      const auctionId = idParam(params, 'auctionId')
      if (!findAuction(auctionId)) return fail(mockErrors.AUCTION_NOT_FOUND)
      // 명세는 같은 브랜드만이지만, 목은 Figma처럼 4장이 보이도록 홈 상품(1~4)을 먼저, 모자라면 다른 예정 · 진행 중 경매로 채웁니다.
      const candidates = auctions.filter((a) => a.auctionId !== auctionId && isOpen(a))
      const isHome = (id: number) => id >= 1 && id <= 4
      const items = [
        ...candidates.filter((a) => isHome(a.auctionId)),
        ...candidates.filter((a) => !isHome(a.auctionId)),
      ]
        .slice(0, 4)
        .map(toSimilar)
      return ok({ items })
    },
  }),

  mockEndpoint(endpoints.likeAuction, {
    error: mockErrors.AUCTION_NOT_FOUND,
    resolve: ({ params, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      if (!a.isLiked) a.likeCount += 1
      a.isLiked = true
      return ok({ liked: true, likeCount: a.likeCount })
    },
  }),

  mockEndpoint(endpoints.unlikeAuction, {
    error: mockErrors.AUCTION_NOT_FOUND,
    resolve: ({ params, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      if (a.isLiked) a.likeCount -= 1
      a.isLiked = false
      return ok({ liked: false, likeCount: a.likeCount })
    },
  }),

  /** 유찰(ENDED, 입찰 0건)이거나 시작 전 취소된 경매만, 상품당 최대 2회 */
  mockEndpoint(endpoints.relistAuction, {
    error: mockErrors.RELIST_NOT_ALLOWED(15),
    invalid: invalidAuctionTime,
    resolve: ({ params, body, ok, fail }) => {
      const previousAuctionId = idParam(params, 'previousAuctionId')
      const prev = findAuction(previousAuctionId)
      if (!prev) return fail(mockErrors.AUCTION_NOT_FOUND)
      if (!isSeller(prev)) return fail(mockErrors.NOT_PRODUCT_OWNER(previousAuctionId))

      const sameProduct = auctions.filter((a) => a.productId === prev.productId)
      if (sameProduct.some((a) => ['SCHEDULED', 'LIVE'].includes(statusOf(a)))) {
        return fail(mockErrors.ACTIVE_AUCTION_EXISTS)
      }
      if (sameProduct.length >= 2) return fail(mockErrors.RELIST_LIMIT_EXCEEDED)
      const status = statusOf(prev)
      const relistable = status === 'CANCELED' || (status === 'ENDED' && prev.bids.length === 0)
      if (!relistable) return fail(mockErrors.RELIST_NOT_ALLOWED(previousAuctionId))

      const startsAt = Date.parse(body.startAt)
      const endsAt = Date.parse(body.endAt)
      const next = {
        ...prev,
        auctionId: createAuctionId(),
        startPrice: body.startPrice,
        startsAt,
        endsAt,
        canceled: false,
        likeCount: 0,
        isLiked: false,
        bids: [],
        extensionCount: 0,
        myAutoBid: null,
      }
      auctions.unshift(next)
      return ok(
        {
          auctionId: next.auctionId,
          previousAuctionId,
          productId: next.productId,
          startPrice: next.startPrice,
          bidIncrement: next.bidIncrement,
          startAt: kst(startsAt),
          endAt: kst(endsAt),
          status: 'SCHEDULED',
        },
        201,
      )
    },
  }),

  /** 판매자 본인 · SCHEDULED · 시작 전에만 */
  mockEndpoint(endpoints.cancelAuction, {
    error: mockErrors.CANCEL_NOT_ALLOWED(15),
    resolve: ({ params, ok, fail }) => {
      const auctionId = idParam(params, 'auctionId')
      const a = findAuction(auctionId)
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      if (!isSeller(a)) return fail(mockErrors.NOT_AUCTION_OWNER)
      if (statusOf(a) !== 'SCHEDULED') return fail(mockErrors.CANCEL_NOT_ALLOWED(auctionId))
      a.canceled = true
      return ok({ auctionId, status: 'CANCELED' })
    },
  }),

  /** 판매자 본인 · SCHEDULED · 시작 1시간 전까지 */
  mockEndpoint(endpoints.updateStartPrice, {
    error: mockErrors.START_PRICE_EDIT_CLOSED(15),
    invalid: () => mockErrors.START_PRICE_INVALID,
    resolve: ({ params, body, ok, fail }) => {
      const auctionId = idParam(params, 'auctionId')
      const a = findAuction(auctionId)
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      if (!isSeller(a)) return fail(mockErrors.NOT_AUCTION_OWNER)
      if (statusOf(a) !== 'SCHEDULED' || a.startsAt - Date.now() < HOUR) {
        return fail(mockErrors.START_PRICE_EDIT_CLOSED(auctionId))
      }
      a.startPrice = body.startPrice
      return ok({ auctionId, startPrice: a.startPrice })
    },
  }),
]
