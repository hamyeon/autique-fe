import { endpoints } from '@/api/endpoints'
import {
  createAutoBidSettingId,
  currentPriceOf,
  findAuction,
  isMyHighest,
  isSeller,
  minNextBidOf,
  runProxyBidding,
  statusOf,
} from '@/mocks/data/auctions'
import { kst } from '@/mocks/data/common'
import { idParam, mockEndpoint } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

const isOpen = (status: string) => status === 'SCHEDULED' || status === 'LIVE'

export const autoBidHandlers = [
  /** 시작 전 RESERVED, 진행 중이면 ACTIVE(즉시 응찰 가능) 또는 CAP_REACHED */
  mockEndpoint(endpoints.createAutoBid, {
    error: mockErrors.CAP_TOO_LOW,
    resolve: ({ params, body, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
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
    resolve: ({ params, body, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      const setting = a.myAutoBid
      if (!setting || setting.status === 'CANCELED') return fail(mockErrors.AUTO_BID_NOT_FOUND)
      if (!isOpen(statusOf(a))) return fail(mockErrors.AUCTION_CLOSED)
      if (setting.status !== 'RESERVED' && body.maxAmount <= setting.maxAmount) {
        return fail(mockErrors.CAP_NOT_INCREASED)
      }
      if (body.maxAmount < minNextBidOf(a)) return fail(mockErrors.CAP_TOO_LOW)

      setting.maxAmount = body.maxAmount
      if (setting.status === 'CAP_REACHED') setting.status = 'ACTIVE'
      const { myLastAutoBid } =
        setting.status === 'ACTIVE' ? runProxyBidding(a) : { myLastAutoBid: null }

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
    resolve: ({ params, ok, fail }) => {
      const a = findAuction(idParam(params, 'auctionId'))
      if (!a) return fail(mockErrors.AUCTION_NOT_FOUND)
      if (!a.myAutoBid || a.myAutoBid.status === 'CANCELED')
        return fail(mockErrors.AUTO_BID_NOT_FOUND)
      a.myAutoBid.status = 'CANCELED'
      return ok({
        autoBidSettingId: a.myAutoBid.autoBidSettingId,
        status: 'CANCELED',
        canceledAt: kst(Date.now()),
      })
    },
  }),
]
