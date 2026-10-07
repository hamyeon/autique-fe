import { endpoints } from '@/api/endpoints'
import { kst } from '@/mocks/data/common'
import { createOrder, findBackupOffer, resultOverrides, toBackupOffer } from '@/mocks/data/orders'
import { idParam, mockEndpoint } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

export const backupOfferHandlers = [
  mockEndpoint(endpoints.getBackupOffer, {
    error: mockErrors.BACKUP_OFFER_NOT_FOUND,
    resolve: ({ params, ok, fail }) => {
      const offer = findBackupOffer(idParam(params, 'backupOfferId'))
      return offer ? ok(toBackupOffer(offer)) : fail(mockErrors.BACKUP_OFFER_NOT_FOUND)
    },
  }),

  /** 수락하면 주문을 만들고, 결제 기한은 수락 시각 + 24시간 */
  mockEndpoint(endpoints.acceptBackupOffer, {
    error: mockErrors.BACKUP_OFFER_EXPIRED,
    resolve: ({ params, ok, fail }) => {
      const offer = findBackupOffer(idParam(params, 'backupOfferId'))
      if (!offer) return fail(mockErrors.BACKUP_OFFER_NOT_FOUND)
      const { status } = toBackupOffer(offer)
      if (status === 'EXPIRED') return fail(mockErrors.BACKUP_OFFER_EXPIRED)
      if (status !== 'WAITING') return fail(mockErrors.BACKUP_OFFER_ALREADY_RESOLVED)

      offer.status = 'ACCEPTED'
      const order = createOrder(offer.auctionId, offer.purchasePrice)
      // 수락한 뒤 경매 결과는 낙찰(WON)로 보이고 이 주문으로 결제합니다.
      resultOverrides[offer.auctionId] = 'WON'
      return ok(
        {
          backupOfferId: offer.backupOfferId,
          status: 'ACCEPTED',
          orderId: order.orderId,
          totalAmount: toBackupOffer(offer).totalAmount,
          paymentDeadline: kst(order.paymentDeadline),
        },
        201,
      )
    },
  }),

  mockEndpoint(endpoints.declineBackupOffer, {
    error: mockErrors.BACKUP_OFFER_ALREADY_RESOLVED,
    resolve: ({ params, ok, fail }) => {
      const offer = findBackupOffer(idParam(params, 'backupOfferId'))
      if (!offer) return fail(mockErrors.BACKUP_OFFER_NOT_FOUND)
      if (toBackupOffer(offer).status !== 'WAITING')
        return fail(mockErrors.BACKUP_OFFER_ALREADY_RESOLVED)
      offer.status = 'DECLINED'
      resultOverrides[offer.auctionId] = 'LOST'
      return ok({ backupOfferId: offer.backupOfferId, status: 'DECLINED' })
    },
  }),
]
