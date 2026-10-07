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
  canModify: z.boolean(),
  canCancel: z.boolean(),
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
