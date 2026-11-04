import { z } from 'zod'
import { dateTimeSchema } from '@/api/schemas/common'

/*
 * 구매 목표(경매 AI Agent). 명세 "구매 목표 관련 정보" · /api/purchase-goals*.
 * 아직 API를 연결하지 않아 스키마만 둡니다(endpoints.ts 등록 · 요청 함수 없음). 화면은 이 타입으로 데모 데이터를 만듭니다.
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

/** 초안. 해석하지 못한 값은 null. deadline은 없습니다(사용자가 입력). */
export const purchaseGoalDraftSchema = z.object({
  modelQuery: z.string().nullish(),
  brand: z.string().nullish(),
  modelKey: z.string().nullish(),
  minCondition: purchaseGoalConditionSchema.nullish(),
  hardMaxAmount: z.number().int().nullish(),
  sizeKr: z.number().int().nullish(),
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

/* ───────── DELETE /api/purchase-goals/{id} ───────── */

/** ACTIVE → CANCELLED, ENGAGED → CANCEL_REQUESTED(참여 중인 경매의 자동입찰은 유지) */
export const cancelPurchaseGoalResponseSchema = z.object({
  id: z.number().int(),
  status: purchaseGoalStatusSchema.extract(['CANCELLED', 'CANCEL_REQUESTED']),
  updatedAt: dateTimeSchema,
})
export type CancelPurchaseGoalResponse = z.infer<typeof cancelPurchaseGoalResponseSchema>
