import { z } from 'zod'
import {
  auctionStatusSchema,
  componentStatusSchema,
  conditionGradeSchema,
  dateTimeSchema,
} from '@/api/schemas/common'

/* ───────── POST /api/products/analyze (multipart: images) ───────── */

export const analysisStatusSchema = z.enum([
  'CREATED',
  'IMAGE_UPLOADED',
  'QUEUED',
  'VISION_PROCESSING',
  'AWAITING_USER_CONFIRMATION',
  'PRICING_PROCESSING',
  'COMPLETED',
  'IMAGE_UPLOAD_FAILED',
  'QUEUE_FAILED',
  'VISION_FAILED',
  'PRICING_FAILED',
])
export type AnalysisStatus = z.infer<typeof analysisStatusSchema>

export const analyzeProductResponseSchema = z.object({
  analysisId: z.number().int(),
  status: analysisStatusSchema,
})
export type AnalyzeProductResponse = z.infer<typeof analyzeProductResponseSchema>

/* ───────── GET /api/products/analyze/{taskId} ───────── */

export const failureStageSchema = z.enum(['IMAGE_UPLOAD', 'QUEUE', 'VISION', 'PRICING'])
export type FailureStage = z.infer<typeof failureStageSchema>

export const analysisDefectSchema = z.object({
  type: z.string(),
  location: z.string(),
  severity: z.string(),
  description: z.string(),
})
export type AnalysisDefect = z.infer<typeof analysisDefectSchema>

export const analysisCandidateSchema = z.object({
  brand: z.string(),
  modelName: z.string(),
  color: z.string(),
  confidence: z.number(),
})
export type AnalysisCandidate = z.infer<typeof analysisCandidateSchema>

/** VISION_PROCESSING 중 끝난 분석 단계 수. 단계가 끝나는 순서는 매번 다를 수 있습니다. */
export const visionProgressSchema = z.object({
  /** 1 ~ 3 */
  completedStages: z.number().int(),
  /** 현재 3 */
  totalStages: z.number().int(),
})
export type VisionProgress = z.infer<typeof visionProgressSchema>

/** VISION_PROCESSING 중 잠정 결과. 바뀔 수 있어 확정값처럼 보여주지 않습니다. */
export const analysisPreliminarySchema = z.object({
  brand: z.string().nullable(),
  modelName: z.string().nullable(),
  color: z.string().nullable(),
  /** 라벨 판독 단계가 끝나야 채워짐 */
  size: z.number().int().nullable(),
})
export type AnalysisPreliminary = z.infer<typeof analysisPreliminarySchema>

/** 근거가 부족한 항목은 null, 리스트는 빈 배열로 옵니다. */
export const productAnalysisSchema = z.object({
  analysisId: z.number().int(),
  status: analysisStatusSchema,
  /** S3 서명 URL(6시간 유효). 저장해 두고 재사용하지 말고 조회할 때마다 받은 값을 씁니다. */
  imageUrls: z.array(z.string()),
  /** VISION_PROCESSING 밖이거나 첫 단계 전이면 null */
  visionProgress: visionProgressSchema.nullish(), // [MISMATCH] 명세는 VISION_PROCESSING 중 단계 수를 줌. 실서버는 진행 중에도 계속 null(2026-10-07)
  /** VISION_PROCESSING 밖이거나 첫 단계 전이면 null */
  preliminary: analysisPreliminarySchema.nullish(), // [MISMATCH] 명세는 VISION_PROCESSING 중 잠정 결과를 줌. 실서버는 계속 null(2026-10-07)
  brand: z.string().nullable(),
  modelName: z.string().nullable(),
  color: z.string().nullable(),
  /** 한국 사이즈(mm) */
  size: z.number().int().nullable(),
  boxIncluded: z.boolean().nullable(),
  conditionDescription: z.string().nullable(),
  /** UNKNOWN이면 명세상 사용자가 고르는 값이지만, 화면에 선택 단계가 없어 그대로 보냅니다(사용자 결정). */
  conditionGrade: conditionGradeSchema.nullable(),
  defects: z.array(analysisDefectSchema),
  candidates: z.array(analysisCandidateSchema),
  confidence: z.number().nullable(),
  needsUserConfirmation: z.boolean().nullable(), // [MISMATCH] 명세는 확인이 필요한 항목이 있으면 true. 실서버는 size가 null인데 false(2026-10-07)
  warnings: z.array(z.string()), // [MISMATCH] 명세는 사용자 안내 문구. 실서버는 '2단계 size: 사이즈 라벨 보이지 않음' 같은 내부 표기(2026-10-07)
  failureStage: failureStageSchema.nullable(),
  /** 서버 내부 메시지. 사용자에게 그대로 보여주지 않습니다. */
  failureMessage: z.string().nullable(),
})
export type ProductAnalysis = z.infer<typeof productAnalysisSchema>

/* ───────── POST /api/products/calculate-price ───────── */

export const calculatePriceRequestSchema = z.object({
  analysisId: z.number().int(),
  brand: z.string().trim().min(1, '브랜드는 필수입니다.'),
  modelName: z.string().trim().min(1, '모델명은 필수입니다.'),
  color: z.string().trim().min(1, '컬러웨이는 필수입니다.'),
  size: z.number().int().positive('한국 사이즈는 필수입니다.'),
  conditionGrade: conditionGradeSchema,
  componentStatus: componentStatusSchema,
})
export type CalculatePriceRequest = z.infer<typeof calculatePriceRequestSchema>

export const priceMatchSchema = z.object({
  source: z.enum(['KREAM', 'EBAY']),
  brand: z.string(),
  modelName: z.string(),
  color: z.string(),
  size: z.number().int(),
  conditionGrade: conditionGradeSchema,
  componentStatus: componentStatusSchema,
  price: z.number().int(),
  url: z.string(),
})
export type PriceMatch = z.infer<typeof priceMatchSchema>

/** 시세 데이터가 없으면 가격 값은 0, 매치 목록은 빈 배열입니다. */
export const calculatePriceResponseSchema = z.object({
  recommendedPrice: z.number().int(),
  baseMarketPrice: z.number().int(),
  kreamAveragePrice: z.number().int(),
  ebayAveragePrice: z.number().int(),
  minRecommendedPrice: z.number().int(),
  maxRecommendedPrice: z.number().int(),
  priceRange: z.string(),
  reason: z.string(),
  kreamMatches: z.array(priceMatchSchema),
  ebayMatches: z.array(priceMatchSchema),
})
export type CalculatePriceResponse = z.infer<typeof calculatePriceResponseSchema>

/* ───────── POST /api/products (상품 등록 + 첫 경매) ───────── */

const HOUR_MS = 60 * 60 * 1000

/** 경매 시각 규칙: 종료는 시작으로부터 최소 1시간 뒤(명세 · 40006) */
export function isAuctionLongEnough(startAt: string, endAt: string) {
  return Date.parse(endAt) - Date.parse(startAt) >= HOUR_MS
}

/** 상품 이미지 주소: http(s)만. 미리보기용 data: · blob: 주소가 서버로 가지 않게 막습니다. */
export const imageUrlSchema = z
  .string()
  .regex(/^https?:\/\//i, '사진 주소가 올바르지 않아요. 사진을 다시 분석해 주세요.')

/** 등록 요청 필드(검증 규칙 없이). 등록 단계별 폼 스키마가 여기서 필드를 골라 씁니다(src/features/register/schemas.ts). */
export const createProductFieldsSchema = z.object({
  /**
   * 최소 3개 · 최대 4개. http(s) 주소만(data: · blob: 등 미리보기용 주소는 거부).
   * [MISMATCH] 명세는 분석 결과의 imageUrls를 그대로 보내는 흐름이지만, 실서버는 분석이 주는 S3 서명 URL(쿼리 포함, 약 1,800자)을
   * 저장하지 못해 500(50001, Data too long for column 'image_url')을 돌려줌. 서명 쿼리를 뗀 객체 주소(약 110자)를 보냅니다
   * (쿼리 없이도 공개로 열리는 것 확인, 2026-10-07. src/features/register/submit.ts toStoredImageUrl)
   */
  imageUrls: z.array(imageUrlSchema).min(3).max(4),
  /* 메시지는 등록 폼(2/6 · 3/6) 입력 아래에 그대로 보입니다(해요체 한 문장). */
  brand: z.string().trim().min(1, '브랜드를 입력해주세요.'),
  modelName: z.string().trim().min(1, '모델명을 입력해주세요.'),
  color: z.string().trim().min(1, '컬러를 입력해주세요.'),
  /** 한국 사이즈(mm) */
  size: z
    .number({ error: '사이즈를 숫자로 입력해주세요.' })
    .int('사이즈를 숫자로 입력해주세요.')
    .positive('사이즈를 숫자로 입력해주세요.'),
  /** AI 값 그대로(UNKNOWN 포함) */
  conditionGrade: conditionGradeSchema,
  componentStatus: z.enum(componentStatusSchema.options, { error: '구성품 여부를 골라주세요.' }),
  /** 가격 계산 응답의 recommendedPrice(Figma 'AI 적정 기준가') */
  recommendedPrice: z.number().int(),
  /** 가격 계산 응답의 baseMarketPrice(시세 중앙값) */
  baseMarketPrice: z.number().int().nullish(),
  priceRange: z.string().nullish(),
  /** 판매 희망가 = 사용자가 최종 결정한 기준가. 경매 시작가와 같은 값으로 보냅니다(사용자 결정). */
  sellingPrice: z.number().int().nonnegative(),
  reason: z.string().nullish(),
  sellerDescription: z.string().nullish(),
  /** 경매 시작가 = 4/6 기준가. 시세가 없으면 0일 수 있음(사용자 결정) */
  auctionStartPrice: z.number().int().nonnegative(),
  /** ISO-8601, 오프셋 포함 */
  auctionStartAt: z.iso.datetime({ offset: true }),
  /** 시작 시각으로부터 최소 1시간 뒤 */
  auctionEndAt: z.iso.datetime({ offset: true }),
})

export const createProductRequestSchema = createProductFieldsSchema.refine(
  (v) => isAuctionLongEnough(v.auctionStartAt, v.auctionEndAt),
  { path: ['auctionEndAt'], message: '경매 진행 시간은 최소 1시간이어야 합니다.' },
)
export type CreateProductRequest = z.infer<typeof createProductRequestSchema>

export const createProductResponseSchema = z.object({
  /** 상품 ID */
  id: z.number().int(),
  sellerId: z.number().int(),
  imageUrls: z.array(z.string()),
  brand: z.string(),
  modelName: z.string(),
  color: z.string(),
  size: z.number().int(),
  conditionGrade: conditionGradeSchema,
  componentStatus: componentStatusSchema,
  recommendedPrice: z.number().int(),
  baseMarketPrice: z.number().int().nullish(),
  priceRange: z.string().nullish(),
  sellingPrice: z.number().int(),
  reason: z.string().nullish(),
  sellerDescription: z.string().nullish(),
  createdAt: dateTimeSchema,
  auctionId: z.number().int(),
  auctionStatus: auctionStatusSchema,
  auctionStartPrice: z.number().int(),
  bidIncrement: z.number().int(),
  auctionStartAt: dateTimeSchema,
  auctionEndAt: dateTimeSchema,
})
export type CreateProductResponse = z.infer<typeof createProductResponseSchema>
