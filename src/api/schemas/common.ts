import { z } from 'zod'

/*
 * 노션 API 명세(API 명세서 - GROWTH)의 공통 형태.
 * 모든 API 타입은 src/api/schemas/ 에서만 정의하고, 다른 곳은 z.infer 로 뽑은 타입만 씁니다.
 */

/** 시각 문자열. 명세 예시는 ISO-8601이지만 오프셋이 없는 값(products createdAt)도 있어 문자열로만 검증합니다. */
export const dateTimeSchema = z.string()

/** 공통 응답의 error 객체 */
export const apiErrorBodySchema = z.object({
  code: z.number().int(),
  message: z.string(),
})
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

/** 공통 응답 DTO: { success, data, error } */
export function apiResponseSchema<T extends z.ZodType>(data: T) {
  return z.object({
    success: z.boolean(),
    data: data.nullable(),
    error: apiErrorBodySchema.nullable(),
  })
}

/** data를 아직 모를 때 감싸기만 확인하는 용도 */
export const apiEnvelopeSchema = apiResponseSchema(z.unknown())

/** 페이지 응답 공통 필드 (입찰 이력 · 알림 목록) */
export const pageMetaSchema = z.object({
  page: z.number().int(),
  size: z.number().int(),
  hasNext: z.boolean(),
})

/** 페이지 요청 파라미터 (기본 page 0, size 20) */
export const pageQuerySchema = z.object({
  page: z.number().int().min(0).optional(),
  size: z.number().int().positive().optional(),
})
export type PageQuery = z.infer<typeof pageQuerySchema>

/* ───────── 여러 도메인이 함께 쓰는 enum ───────── */

export const auctionStatusSchema = z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELED'])
export type AuctionStatus = z.infer<typeof auctionStatusSchema>

/** 상품 상태 등급. Vision은 DS/A/B/C/UNKNOWN만 반환하고 S는 사용자가 직접 고를 때만 씁니다. */
export const conditionGradeSchema = z.enum(['DS', 'S', 'A', 'B', 'C', 'UNKNOWN'])
export type ConditionGrade = z.infer<typeof conditionGradeSchema>

/** 구성품 상태: FULL(모두 포함) / PARTIAL(일부 포함) / NONE(없음) */
export const componentStatusSchema = z.enum(['FULL', 'PARTIAL', 'NONE'])
export type ComponentStatus = z.infer<typeof componentStatusSchema>

export const autoBidStatusSchema = z.enum(['RESERVED', 'ACTIVE', 'CAP_REACHED', 'CANCELED'])
export type AutoBidStatus = z.infer<typeof autoBidStatusSchema>

/** 직접 입찰 불가 사유 (경매 상세 myState · 실시간 상태 공통) */
export const cannotBidReasonSchema = z.enum([
  'AUCTION_NOT_STARTED',
  'AUCTION_CLOSED',
  'SELLER_CANNOT_BID',
  'PENALTY_RESTRICTED',
  'ALREADY_HIGHEST_BIDDER',
])
export type CannotBidReason = z.infer<typeof cannotBidReasonSchema>

/** 결과 · 주문 · 차순위 제안 화면의 상품 요약 */
export const productSummarySchema = z.object({
  productId: z.number().int(),
  name: z.string(),
  subName: z.string(),
  imageUrl: z.string(),
})
export type ProductSummary = z.infer<typeof productSummarySchema>

/* ───────── 오류 코드 (공통 오류 코드표) ───────── */

export const API_ERROR_CODE = {
  INVALID_REQUEST: 40001,
  IDEMPOTENCY_KEY_MISSING: 40004,
  UNAUTHORIZED: 40101,
  SELLER_CANNOT_BID: 40301,
  PENALTY_RESTRICTED: 40302,
  NOT_AWARDEE: 40303,
  ORDER_ACCESS_DENIED: 40304,
  BACKUP_OFFER_ACCESS_DENIED: 40305,
  AUCTION_NOT_FOUND: 40401,
  ORDER_NOT_FOUND: 40402,
  BACKUP_OFFER_NOT_FOUND: 40403,
  AUTO_BID_NOT_FOUND: 40404,
  NOTIFICATION_NOT_FOUND: 40405,
  ALREADY_HIGHEST_BIDDER: 40901,
  AUCTION_NOT_STARTED: 40902,
  AUCTION_CLOSED: 40903,
  BID_AMOUNT_TOO_LOW: 40904,
  IDEMPOTENCY_PAYLOAD_MISMATCH: 40905,
  CAP_TOO_LOW: 40906,
  CAP_NOT_INCREASED: 40907,
  AUTO_BID_ALREADY_EXISTS: 40908,
  CONCURRENT_CONFLICT: 40909,
  PAYMENT_EXPIRED: 40910,
  BACKUP_OFFER_EXPIRED: 40911,
  BACKUP_OFFER_ALREADY_RESOLVED: 40912,
  BID_NOT_ALIGNED: 40913,
  ALREADY_PAID: 40914,
  ORDER_CANCELED: 40915,

  // [ASSUMED] 아래 이름은 각 엔드포인트 페이지에 코드·메시지만 있고 symbolic 이름이 없어 메시지를 보고 붙였습니다.
  IMAGE_FILE_MISSING: 40002,
  ANALYSIS_STATUS_INVALID: 40003,
  AUCTION_TIME_INVALID: 40006,
  KAKAO_TOKEN_INVALID: 40102,
  REFRESH_TOKEN_INVALID: 40103,
  NOT_PRODUCT_OWNER: 40307,
  ACTIVE_AUCTION_EXISTS: 40918,
  RELIST_LIMIT_EXCEEDED: 40919,
  RELIST_NOT_ALLOWED: 40920,
  CANCEL_NOT_ALLOWED: 40921,
  START_PRICE_EDIT_CLOSED: 40922,
  S3_UPLOAD_FAILED: 50002,
  ANALYSIS_QUEUE_FAILED: 50004,
  KAKAO_API_FAILED: 50201,
} as const
export type ApiErrorCodeName = keyof typeof API_ERROR_CODE
