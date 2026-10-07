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

/** 근거가 부족한 항목은 null, 리스트는 빈 배열로 옵니다. */
export const productAnalysisSchema = z.object({
  analysisId: z.number().int(),
  status: analysisStatusSchema,
  imageUrls: z.array(z.string()),
  brand: z.string().nullable(),
  modelName: z.string().nullable(),
  color: z.string().nullable(),
  /** 한국 사이즈(mm) */
  size: z.number().int().nullable(),
  boxIncluded: z.boolean().nullable(),
  conditionDescription: z.string().nullable(),
  conditionGrade: conditionGradeSchema.nullable(),
  defects: z.array(analysisDefectSchema),
  candidates: z.array(analysisCandidateSchema),
  confidence: z.number().nullable(),
  needsUserConfirmation: z.boolean().nullable(),
  warnings: z.array(z.string()),
  failureStage: failureStageSchema.nullable(),
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

export const createProductRequestSchema = z
  .object({
    /** 최소 3개 · 최대 4개 */
    imageUrls: z.array(z.string()).min(3).max(4),
    brand: z.string().trim().min(1),
    modelName: z.string().trim().min(1),
    color: z.string().trim().min(1),
    size: z.number().int().positive(),
    conditionGrade: conditionGradeSchema,
    componentStatus: componentStatusSchema,
    recommendedPrice: z.number().int(),
    baseMarketPrice: z.number().int().nullish(),
    priceRange: z.string().nullish(),
    /** 판매 희망가. 경매 시작가와 별개 */
    sellingPrice: z.number().int(),
    reason: z.string().nullish(),
    sellerDescription: z.string().nullish(),
    auctionStartPrice: z.number().int().positive(),
    /** ISO-8601, 오프셋 포함 */
    auctionStartAt: z.iso.datetime({ offset: true }),
    /** 시작 시각으로부터 최소 1시간 뒤 */
    auctionEndAt: z.iso.datetime({ offset: true }),
  })
  .refine((v) => Date.parse(v.auctionEndAt) - Date.parse(v.auctionStartAt) >= HOUR_MS, {
    path: ['auctionEndAt'],
    message: '경매 진행 시간은 최소 1시간이어야 합니다.',
  })
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
