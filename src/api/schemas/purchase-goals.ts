import { z } from 'zod'
import { auctionStatusSchema, dateTimeSchema } from '@/api/schemas/common'

/*
 * 구매 목표(경매 AI Agent · 쇼핑메이트 PIKI). 명세 "구매 목표 관련 정보" · /api/purchase-goals*.
 * GET /api/purchase-goals/{id}/matches(후보 평가 기록)는 명세상 화면에 필요 없으면 연동하지 않아도 돼서 두지 않습니다.
 */

/** 목표 상태. 경매 상태(CANCELED)와 달리 CANCELLED로 씁니다. */
export const purchaseGoalStatusSchema = z.enum([
  'ACTIVE',
  'ENGAGED',
  'CANCEL_REQUESTED',
  'FULFILLED',
  'CANCELLED',
  'EXPIRED',
])
export type PurchaseGoalStatus = z.infer<typeof purchaseGoalStatusSchema>

/** 목표 최소 등급. 등급 순서 DS > S > A > B > C, UNKNOWN은 쓸 수 없습니다. */
export const purchaseGoalConditionSchema = z.enum(['DS', 'S', 'A', 'B', 'C'])
export type PurchaseGoalCondition = z.infer<typeof purchaseGoalConditionSchema>

/* ───────── POST /api/purchase-goals/parse ───────── */

export const parsePurchaseGoalRequestSchema = z.object({
  /** 공백만 불가, 최대 300자 */
  text: z.string().trim().min(1).max(300),
})
export type ParsePurchaseGoalRequest = z.infer<typeof parsePurchaseGoalRequestSchema>

/** 초안. 해석하지 못한 값은 null. */
export const purchaseGoalDraftSchema = z.object({
  modelQuery: z.string().nullish(),
  brand: z.string().nullish(),
  modelKey: z.string().nullish(),
  minCondition: purchaseGoalConditionSchema.nullish(),
  hardMaxAmount: z.number().int().nullish(),
  sizeKr: z.number().int().nullish(),
  // [MISMATCH] 명세는 "응답에 deadline은 없습니다". 실서버(11-05 확인)는 문장의 기한을 해석해
  // 오프셋 포함 ISO-8601(시각은 23:59)로 주고, 기한이 없으면 null + warnings '기한이 없습니다…'를 줍니다.
  deadline: dateTimeSchema.nullish(),
  freeTextConditions: z.string().nullish(),
  /** 0.0 ~ 1.0. 0.7 미만이면 확인 · 수정을 더 강조합니다. */
  confidence: z.number(),
  warnings: z.array(z.string()),
})
export type PurchaseGoalDraft = z.infer<typeof purchaseGoalDraftSchema>

/* ───────── POST /api/purchase-goals ───────── */

export const createPurchaseGoalRequestSchema = z.object({
  brand: z.string().nullish(),
  modelKey: z.string().nullish(),
  /** 빈 문자열 · 공백 불가 */
  modelQuery: z.string().trim().min(1),
  minCondition: purchaseGoalConditionSchema,
  /** 생략 · null이면 사이즈로 거르지 않음. 있으면 0보다 큼 */
  sizeKr: z.number().int().positive().nullish(),
  /** 예산 상한(원), 0보다 큼 */
  hardMaxAmount: z.number().int().positive(),
  freeTextConditions: z.string().nullish(),
  /** 오프셋 포함 ISO-8601, 지금 이후 */
  deadline: dateTimeSchema,
})
export type CreatePurchaseGoalRequest = z.infer<typeof createPurchaseGoalRequestSchema>

/* ───────── 목표 (POST /api/purchase-goals 응답 · GET /api/purchase-goals 항목) ───────── */

export const purchaseGoalSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  brand: z.string().nullish(),
  modelKey: z.string().nullish(),
  modelQuery: z.string(),
  minCondition: purchaseGoalConditionSchema,
  sizeKr: z.number().int().nullish(),
  hardMaxAmount: z.number().int(),
  freeTextConditions: z.string().nullish(),
  deadline: dateTimeSchema,
  status: purchaseGoalStatusSchema,
  /** 진행 여부는 이 값이 아니라 status로 판단합니다. */
  currentAuctionId: z.number().int().nullish(),
  createdAt: dateTimeSchema,
  participationCount: z.number().int(),
  wonCount: z.number().int(),
})
export type PurchaseGoal = z.infer<typeof purchaseGoalSchema>

/** GET /api/purchase-goals 응답(배열, 생성 최신순 · 종료된 목표 포함) */
export const purchaseGoalListSchema = z.array(purchaseGoalSchema)

/* ───────── GET /api/purchase-goals/{id} ───────── */

/** 참여 결과. WON = 본인 주문 생성(결제 완료 아님), LOST + CANCELED = 참여 경매 취소 */
export const purchaseGoalParticipationStatusSchema = z.enum(['SCHEDULED', 'LIVE', 'WON', 'LOST'])

export const purchaseGoalParticipationSchema = z.object({
  auctionId: z.number().int(),
  status: purchaseGoalParticipationStatusSchema,
  auctionStatus: auctionStatusSchema,
})
export type PurchaseGoalParticipation = z.infer<typeof purchaseGoalParticipationSchema>

/** 상품명 · 시작 시각 · 실제 상한은 없어서 참여 경매 ID로 경매 상세 · 결과를 따로 조회합니다. */
export const purchaseGoalDetailSchema = purchaseGoalSchema.extend({
  /** 자동입찰을 등록한 순서(오래된 것 먼저). 없으면 [] */
  participations: z.array(purchaseGoalParticipationSchema),
})
export type PurchaseGoalDetail = z.infer<typeof purchaseGoalDetailSchema>

/* ───────── DELETE /api/purchase-goals/{id} ───────── */

/** ACTIVE → CANCELLED, ENGAGED → CANCEL_REQUESTED(참여 중인 경매의 자동입찰은 유지) */
export const cancelPurchaseGoalResponseSchema = z.object({
  id: z.number().int(),
  status: purchaseGoalStatusSchema.extract(['CANCELLED', 'CANCEL_REQUESTED']),
  updatedAt: dateTimeSchema,
})
export type CancelPurchaseGoalResponse = z.infer<typeof cancelPurchaseGoalResponseSchema>
