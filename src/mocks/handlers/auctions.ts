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
  toLive,
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

export const auctionHandlers = [
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
      // Figma처럼 4장. 홈 상품(1~4)을 먼저, 모자라면 다른 예정 · 진행 중 경매로 채웁니다.
      const candidates = auctions.filter(
        (a) => a.auctionId !== auctionId && ['SCHEDULED', 'LIVE', 'ENDED'].includes(statusOf(a)),
      )
      const isHome = (id: number) => id >= 1 && id <= 4
      const items = [
        ...candidates.filter((a) => isHome(a.auctionId)),
        ...candidates.filter((a) => !isHome(a.auctionId) && statusOf(a) !== 'ENDED'),
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
