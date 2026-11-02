import { z } from 'zod'
import { dateTimeSchema, productSummarySchema } from '@/api/schemas/common'

/** PAYMENT_PENDING → PAID / PAYMENT_EXPIRED / CANCELED (뒤의 셋은 terminal) */
export const orderStatusSchema = z.enum(['PAYMENT_PENDING', 'PAID', 'PAYMENT_EXPIRED', 'CANCELED'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

/** WINNER: 최초 낙찰 / BACKUP_ACCEPT: 차순위 제안 수락. 유형을 알 수 없는 예전 주문은 null(일반 문구 사용) */
export const orderTypeSchema = z.enum(['WINNER', 'BACKUP_ACCEPT'])
export type OrderType = z.infer<typeof orderTypeSchema>

/* ───────── GET /api/orders/{orderId} ───────── */

export const orderSchema = z.object({
  orderId: z.number().int(),
  auctionId: z.number().int(),
  status: orderStatusSchema,
  product: productSummarySchema,
  /** 최초 낙찰자 = 원 경매 finalPrice, 차순위 수락자 = 차순위 구매 가능 금액 */
  purchasePrice: z.number().int(),
  shippingFee: z.number().int(),
  totalAmount: z.number().int(),
  paymentDeadline: dateTimeSchema,
  serverTime: dateTimeSchema,
  /** 미결제면 null */
  paidAt: dateTimeSchema.nullish(),
  orderType: orderTypeSchema.nullish(),
})
export type Order = z.infer<typeof orderSchema>

/* ───────── POST /api/orders/{orderId}/pay (Mock 결제, 멱등) ───────── */

export const payOrderResponseSchema = z.object({
  orderId: z.number().int(),
  status: z.literal('PAID'),
  paidAt: dateTimeSchema,
})
export type PayOrderResponse = z.infer<typeof payOrderResponseSchema>
