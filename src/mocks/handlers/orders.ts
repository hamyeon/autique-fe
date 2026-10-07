import { endpoints } from '@/api/endpoints'
import { addPenalty } from '@/mocks/data/me'
import { findOrder, resultOverrides, toOrder } from '@/mocks/data/orders'
import { idParam, mockEndpoint } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

/** 결제 기한이 지난 결제 대기 주문을 만료 처리합니다(서버 scheduler 흉내). */
function expireIfOverdue(order: NonNullable<ReturnType<typeof findOrder>>) {
  if (order.status === 'PAYMENT_PENDING' && order.paymentDeadline <= Date.now()) {
    order.status = 'PAYMENT_EXPIRED'
    resultOverrides[order.auctionId] = 'PAYMENT_EXPIRED'
    addPenalty('PAYMENT_EXPIRED', order.auctionId)
  }
}

export const orderHandlers = [
  mockEndpoint(endpoints.getOrder, {
    error: mockErrors.ORDER_NOT_FOUND,
    resolve: ({ params, ok, fail }) => {
      const order = findOrder(idParam(params, 'orderId'))
      if (!order) return fail(mockErrors.ORDER_NOT_FOUND)
      expireIfOverdue(order)
      return ok(toOrder(order))
    },
  }),

  /** PAYMENT_PENDING → PAID, 이미 PAID면 기존 paidAt 그대로 200 */
  mockEndpoint(endpoints.payOrder, {
    error: mockErrors.PAYMENT_EXPIRED,
    resolve: ({ params, ok, fail }) => {
      const order = findOrder(idParam(params, 'orderId'))
      if (!order) return fail(mockErrors.ORDER_NOT_FOUND)
      expireIfOverdue(order)
      if (order.status === 'PAYMENT_EXPIRED') return fail(mockErrors.PAYMENT_EXPIRED)
      if (order.status === 'CANCELED') return fail(mockErrors.ORDER_CANCELED)
      if (order.status === 'PAYMENT_PENDING') {
        order.status = 'PAID'
        order.paidAt = Date.now()
      }
      return ok({ orderId: order.orderId, status: 'PAID', paidAt: toOrder(order).paidAt! })
    },
  }),
]
