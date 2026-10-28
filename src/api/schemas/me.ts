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

// [ASSUMED] 명세에 사용자 정보 API가 없습니다(카카오 로그인 응답도 토큰만). 마이페이지 프로필(Figma 957:1951)에 필요해 만들었습니다.
export const myProfileSchema = z.object({
  userId: z.number().int(), // [ASSUMED] JWT sub와 같은 값
  nickname: z.string(), // [ASSUMED] 입찰 내역 · 판매자 정보의 닉네임과 같은 값
  email: z.string().nullable(), // [ASSUMED] 카카오 계정 이메일. 동의하지 않았으면 null
  profileImageUrl: z.string().nullable(), // [ASSUMED] 없으면 null(회색 원)
})
export type MyProfile = z.infer<typeof myProfileSchema>
