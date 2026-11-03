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

/* ───────── GET /api/me ───────── */

/** 로그인한 나. 프로필 사진 조회 · 수정은 제공하지 않습니다. */
export const myProfileSchema = z.object({
  userId: z.number().int(),
  /** 가입 때 받지 못했으면 '회원-' + 임의 8자 */
  nickname: z.string(),
  /** 카카오 이메일에 동의하지 않았거나 이메일이 없는 계정이면 null */
  email: z.string().nullish(),
})
export type MyProfile = z.infer<typeof myProfileSchema>
