import { z } from 'zod'
import { dateTimeSchema, productSummarySchema } from '@/api/schemas/common'

export const backupOfferStatusSchema = z.enum(['WAITING', 'ACCEPTED', 'DECLINED', 'EXPIRED'])
export type BackupOfferStatus = z.infer<typeof backupOfferStatusSchema>

/* ───────── GET /api/backup-offers/{backupOfferId} ───────── */

export const backupOfferSchema = z.object({
  backupOfferId: z.number().int(),
  auctionId: z.number().int(),
  status: backupOfferStatusSchema,
  product: productSummarySchema,
  /** 구매 가능 금액 = 내 마지막 입찰가 */
  purchasePrice: z.number().int(),
  shippingFee: z.number().int(),
  totalAmount: z.number().int(),
  /** 수락/거절 기한 (제안 생성 + 24시간) */
  deadline: dateTimeSchema,
  serverTime: dateTimeSchema,
})
export type BackupOffer = z.infer<typeof backupOfferSchema>

/* ───────── POST /api/backup-offers/{backupOfferId}/accept (Idempotency-Key) ───────── */

export const acceptBackupOfferResponseSchema = z.object({
  backupOfferId: z.number().int(),
  status: z.literal('ACCEPTED'),
  orderId: z.number().int(),
  totalAmount: z.number().int(),
  /** 수락 시각 + 24시간 */
  paymentDeadline: dateTimeSchema,
})
export type AcceptBackupOfferResponse = z.infer<typeof acceptBackupOfferResponseSchema>

/* ───────── POST /api/backup-offers/{backupOfferId}/decline ───────── */

export const declineBackupOfferResponseSchema = z.object({
  backupOfferId: z.number().int(),
  status: z.literal('DECLINED'),
})
export type DeclineBackupOfferResponse = z.infer<typeof declineBackupOfferResponseSchema>
