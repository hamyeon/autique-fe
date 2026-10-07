import { z } from 'zod'
import { dateTimeSchema } from '@/api/schemas/common'

/* ───────── GET /api/me/penalties ───────── */

export const penaltyTypeSchema = z.enum(['FORFEITED', 'PAYMENT_EXPIRED'])
export type PenaltyType = z.infer<typeof penaltyTypeSchema>

export const penaltySchema = z.object({
  penaltyId: z.number().int(),
  type: penaltyTypeSchema,
  auctionId: z.number().int(),
  createdAt: dateTimeSchema,
})
export type Penalty = z.infer<typeof penaltySchema>

/** 제재 기간은 bidRestrictedUntil이 유일한 기준입니다. 'N일간' 같은 문구를 하드코딩하지 않습니다. */
export const myPenaltiesSchema = z.object({
  noShowCount: z.number().int(),
  bidRestricted: z.boolean(),
  bidRestrictedUntil: dateTimeSchema.nullish(),
  serverTime: dateTimeSchema,
  penalties: z.array(penaltySchema),
})
export type MyPenalties = z.infer<typeof myPenaltiesSchema>
