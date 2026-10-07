import { endpoints } from '@/api/endpoints'
import type { MockAuction } from '@/mocks/data/auctions'
import {
  createAutoBidSettingId,
  currentPriceOf,
  findAuction,
  isMyHighest,
  isSeller,
  minNextBidOf,
  placeRivalBid,
  runProxyBidding,
  saveAuctionState,
  statusOf,
} from '@/mocks/data/auctions'
import { HOUR, kst } from '@/mocks/data/common'
import type { MockScenario } from '@/mocks/define'
import { idParam, mockEndpoint } from '@/mocks/define'
import type { MockError } from '@/mocks/errors'
import { mockErrors } from '@/mocks/errors'

const isOpen = (status: string) => status === 'SCHEDULED' || status === 'LIVE'

/* ───────── 자동 입찰 시트 확인용 시나리오 (?mock=autobid-*) ───────── */

/** 페이지를 연 동안 이미 한 번 적용한 경매. 다시 제출하면 정상 처리합니다. */
const outbidDone = new Set<number>()
const errorDone = new Set<number>()

/** maxAmount 이상이 되도록 입찰 단위에 맞춰 올린 금액 */
function alignedAbove(a: MockAuction, base: number, maxAmount: number) {
  const steps = Math.max(1, Math.ceil((maxAmount - base) / a.bidIncrement))
  return base + steps * a.bidIncrement
}

/**
 * 시나리오가 있으면 명세 오류를 돌려줍니다.
 * - autobid-outbid: 경매 중이면 다른 사람이 상한가 이상으로 입찰하고, 시작 전이면 판매자가 시작가를 올린 것처럼
 *   현재가를 올린 뒤 CAP_TOO_LOW (경매마다 한 번)
 * - autobid-ended: 경매를 지금 끝내고 AUCTION_CLOSED
 * - autobid-error: 첫 요청만 500
 */
function applyScenario(
  scenario: MockScenario | null,
  a: MockAuction,
  maxAmount: number | null,
): MockError | null {
  if (scenario === 'autobid-error' && !errorDone.has(a.auctionId)) {
    errorDone.add(a.auctionId)
    return mockErrors.INTERNAL_SERVER_ERROR
  }
  if (scenario === 'autobid-ended' && isOpen(statusOf(a))) {
    const now = Date.now()
    a.startsAt = Math.min(a.startsAt, now - HOUR)
    a.endsAt = now - 1000
    return mockErrors.AUCTION_CLOSED
  }
  if (scenario === 'autobid-outbid' && maxAmount !== null && !outbidDone.has(a.auctionId)) {
    outbidDone.add(a.auctionId)
    if (statusOf(a) === 'LIVE') {
      placeRivalBid(a, alignedAbove(a, currentPriceOf(a), maxAmount))
    } else {
      a.startPrice = alignedAbove(a, a.startPrice, maxAmount)
    }
    saveAuctionState()
    return mockErrors.CAP_TOO_LOW
  }
  return null
}

export const autoBidHandlers = [
  /** 시작 전 RESERVED, 진행 중이면 ACTIVE(즉시 응찰 가능) 또는 CAP_REACHED */
  mockEndpoint(endpoints.createAutoBid, {
    error: mockErrors.CAP_TOO_LOW,
    resolve: ({ params, body, scenario, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      const forced = applyScenario(scenario, a, body.maxAmount)
      if (forced) return fail(forced)
      const status = statusOf(a)
      if (!isOpen(status)) return fail(mockErrors.AUCTION_CLOSED)
      if (isSeller(a)) return fail(mockErrors.SELLER_CANNOT_BID)
      if (a.myAutoBid && a.myAutoBid.status !== 'CANCELED')
        return fail(mockErrors.AUTO_BID_ALREADY_EXISTS)
      if (body.maxAmount < minNextBidOf(a)) return fail(mockErrors.CAP_TOO_LOW)

      // CANCELED는 terminal이라 새 설정을 만듭니다.
      a.myAutoBid = {
        autoBidSettingId: createAutoBidSettingId(),
        status: status === 'LIVE' ? 'ACTIVE' : 'RESERVED',
        maxAmount: body.maxAmount,
      }
      const { myLastAutoBid } = status === 'LIVE' ? runProxyBidding(a) : { myLastAutoBid: null }
      saveAuctionState()

      return ok(
        {
          autoBidSettingId: a.myAutoBid.autoBidSettingId,
          auctionId: a.auctionId,
          status: a.myAutoBid.status as 'RESERVED' | 'ACTIVE' | 'CAP_REACHED',
          maxAmount: a.myAutoBid.maxAmount,
          currentPrice: currentPriceOf(a),
          minNextBidAmount: minNextBidOf(a),
          minCapAmount: minNextBidOf(a),
          startsAt: kst(a.startsAt),
          bidOccurred: myLastAutoBid !== null,
          resultingBidAmount: myLastAutoBid,
          isHighestBidder: isMyHighest(a),
        },
        201,
      )
    },
  }),

  mockEndpoint(endpoints.getMyAutoBid, {
    error: mockErrors.AUTO_BID_NOT_FOUND,
    resolve: ({ params, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      if (!a.myAutoBid) return fail(mockErrors.AUTO_BID_NOT_FOUND)
      const editable = a.myAutoBid.status !== 'CANCELED' && isOpen(statusOf(a))
      return ok({
        autoBidSettingId: a.myAutoBid.autoBidSettingId,
        auctionId: a.auctionId,
        status: a.myAutoBid.status,
        maxAmount: a.myAutoBid.maxAmount,
        currentPrice: currentPriceOf(a),
        minCapAmount: minNextBidOf(a),
        startsAt: kst(a.startsAt),
        serverTime: kst(Date.now()),
        canModify: editable,
        canCancel: editable,
      })
    },
  }),

  /** RESERVED: 자유롭게 수정 / ACTIVE · CAP_REACHED: 상향만 (40907) */
  mockEndpoint(endpoints.updateMyAutoBid, {
    error: mockErrors.CAP_NOT_INCREASED,
    resolve: ({ params, body, scenario, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      const setting = a.myAutoBid
      if (!setting || setting.status === 'CANCELED') return fail(mockErrors.AUTO_BID_NOT_FOUND)
      const forced = applyScenario(scenario, a, body.maxAmount)
      if (forced) return fail(forced)
      if (!isOpen(statusOf(a))) return fail(mockErrors.AUCTION_CLOSED)
      if (setting.status !== 'RESERVED' && body.maxAmount <= setting.maxAmount) {
        return fail(mockErrors.CAP_NOT_INCREASED)
      }
      if (body.maxAmount < minNextBidOf(a)) return fail(mockErrors.CAP_TOO_LOW)

      setting.maxAmount = body.maxAmount
      if (setting.status === 'CAP_REACHED') setting.status = 'ACTIVE'
      const { myLastAutoBid } =
        setting.status === 'ACTIVE' ? runProxyBidding(a) : { myLastAutoBid: null }
      saveAuctionState()

      return ok({
        autoBidSettingId: setting.autoBidSettingId,
        status: setting.status as 'RESERVED' | 'ACTIVE' | 'CAP_REACHED',
        maxAmount: setting.maxAmount,
        currentPrice: currentPriceOf(a),
        minCapAmount: minNextBidOf(a),
        bidOccurred: myLastAutoBid !== null,
        resultingBidAmount: myLastAutoBid,
        isHighestBidder: isMyHighest(a),
      })
    },
  }),

  mockEndpoint(endpoints.cancelMyAutoBid, {
    error: mockErrors.AUTO_BID_NOT_FOUND,
    resolve: ({ params, scenario, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      if (!a.myAutoBid || a.myAutoBid.status === 'CANCELED')
        return fail(mockErrors.AUTO_BID_NOT_FOUND)
      const forced = applyScenario(scenario, a, null)
      if (forced) return fail(forced)
      a.myAutoBid.status = 'CANCELED'
      saveAuctionState()
      return ok({
        autoBidSettingId: a.myAutoBid.autoBidSettingId,
        status: 'CANCELED',
        canceledAt: kst(Date.now()),
      })
    },
  }),
]
