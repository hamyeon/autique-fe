import { z } from 'zod'
import { autoBidStatusSchema, dateTimeSchema } from '@/api/schemas/common'

/* ───────── POST /api/auctions/{auctionId}/auto-bids (Idempotency-Key) ───────── */

/** maxAmount >= minCapAmount. bidIncrement 배수 정렬은 요구하지 않습니다(실효 상한). */
export const createAutoBidRequestSchema = z.object({
  maxAmount: z.number().int().positive(),
})
export type CreateAutoBidRequest = z.infer<typeof createAutoBidRequestSchema>

export const createAutoBidResponseSchema = z.object({
  autoBidSettingId: z.number().int(),
  auctionId: z.number().int(),
  /** RESERVED / ACTIVE / CAP_REACHED */
  status: autoBidStatusSchema.exclude(['CANCELED']),
  maxAmount: z.number().int(),
  currentPrice: z.number().int(),
  minNextBidAmount: z.number().int(),
  minCapAmount: z.number().int(),
  startsAt: dateTimeSchema,
  bidOccurred: z.boolean(),
  resultingBidAmount: z.number().int().nullish(),
  isHighestBidder: z.boolean().nullish(),
})
export type CreateAutoBidResponse = z.infer<typeof createAutoBidResponseSchema>

/* ───────── GET /api/auctions/{auctionId}/auto-bids/me ───────── */

export const myAutoBidSchema = z.object({
  autoBidSettingId: z.number().int(),
  auctionId: z.number().int(),
  status: autoBidStatusSchema,
  maxAmount: z.number().int(),
  currentPrice: z.number().int(),
  minCapAmount: z.number().int(),
  startsAt: dateTimeSchema,
  serverTime: dateTimeSchema,
  /** 지금은 늘 true. 에이전트 관리 제한은 반영하지 않으므로 managedByPurchaseAgent를 함께 봅니다. */
  canModify: z.boolean(),
  /** 지금은 늘 true. 에이전트 관리 제한은 반영하지 않으므로 managedByPurchaseAgent를 함께 봅니다. */
  canCancel: z.boolean(),
  /** 이 자동입찰을 만든 구매 목표 ID. 일반 자동입찰이면 null */
  purchaseGoalId: z.number().int().nullish(),
  /** 지금 구매 에이전트가 이 경매를 관리 중 */
  managedByPurchaseAgent: z.boolean(),
})
export type MyAutoBid = z.infer<typeof myAutoBidSchema>

/* ───────── PATCH /api/auctions/{auctionId}/auto-bids/me (Idempotency-Key) ───────── */

/** RESERVED: 상·하향 모두 허용 / ACTIVE · CAP_REACHED: 기존 maxAmount보다 커야 함 */
export const updateAutoBidRequestSchema = z.object({
  maxAmount: z.number().int().positive(),
})
export type UpdateAutoBidRequest = z.infer<typeof updateAutoBidRequestSchema>

export const updateAutoBidResponseSchema = z.object({
  autoBidSettingId: z.number().int(),
  status: autoBidStatusSchema.exclude(['CANCELED']),
  maxAmount: z.number().int(),
  currentPrice: z.number().int(),
  minCapAmount: z.number().int(),
  bidOccurred: z.boolean(),
  resultingBidAmount: z.number().int().nullish(),
  isHighestBidder: z.boolean(),
})
export type UpdateAutoBidResponse = z.infer<typeof updateAutoBidResponseSchema>

/* ───────── DELETE /api/auctions/{auctionId}/auto-bids/me ───────── */

export const cancelAutoBidResponseSchema = z.object({
  autoBidSettingId: z.number().int(),
  status: z.literal('CANCELED'),
  canceledAt: dateTimeSchema,
})
export type CancelAutoBidResponse = z.infer<typeof cancelAutoBidResponseSchema>
