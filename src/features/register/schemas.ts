import { z } from 'zod'
import {
  analyzeProductResponseSchema,
  calculatePriceResponseSchema,
  createProductFieldsSchema,
  createProductRequestSchema,
  isAuctionLongEnough,
} from '@/api/schemas/products'
import type { ComponentStatus } from '@/api/schemas/common'
import type { CreateProductRequest, ProductAnalysis } from '@/api/schemas/products'

/*
 * 경매 등록 단계별 검증. 필드는 모두 등록 요청 스키마(createProductFieldsSchema)에서 골라 써서
 * 단계에서 모은 값이 그대로 POST /api/products 요청이 됩니다(buildCreateProductRequest).
 *
 * 흐름: 1(사진) → analyzing(업로드 + AI 분석) → 2(AI 결과 확인) → 3(추가 정보, 가격 계산) → 4(기준가) → 5(일정) → 6(확인) → 등록
 */

export const REGISTER_STEPS = ['1', 'analyzing', '2', '3', '4', '5', '6'] as const
export type RegisterStep = (typeof REGISTER_STEPS)[number]

export function registerPath(step: RegisterStep | 'complete') {
  return `/register/${step}`
}

/* ───────── 1/6 사진 ───────── */

/** Figma 1/6 칸 순서. 앞면 · 측면 · 밑창은 필수, 하자는 선택(명세 등록은 3~4장). 서버에는 방향 구분 없이 보냅니다. */
export const PHOTO_SLOTS = ['side', 'front', 'outsole', 'defect'] as const
export type PhotoSlot = (typeof PHOTO_SLOTS)[number]
export const REQUIRED_PHOTO_SLOTS = [
  'side',
  'front',
  'outsole',
] as const satisfies readonly PhotoSlot[]

export const PHOTO_LABELS: Record<PhotoSlot, string> = {
  side: '측면',
  front: '앞면',
  outsole: '밑창',
  defect: '하자',
}

/** 고른 사진의 정보. 파일 자체는 분석 요청 전까지 IndexedDB에 둡니다(src/lib/file-store.ts). */
export const photoMetaSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
})
export type PhotoMeta = z.infer<typeof photoMetaSchema>

export const photosStepSchema = z.object({
  photos: z.object({
    side: photoMetaSchema,
    front: photoMetaSchema,
    outsole: photoMetaSchema,
    defect: photoMetaSchema.optional(),
  }),
})

/* ───────── analyzing: 업로드 + AI 분석 ───────── */

/**
 * 분석 세션 ID만 저장합니다. 분석 결과의 imageUrls는 6시간짜리 서명 URL이라 저장하지 않고,
 * 등록할 때 GET /api/products/analyze/{taskId}로 다시 받습니다(명세).
 */
export const analysisStepSchema = z.object({
  analysisId: analyzeProductResponseSchema.shape.analysisId,
})

/* ───────── 2/6 AI 결과 확인 ───────── */

/** AI 값으로 채우고 사용자가 고칩니다. conditionGrade는 AI 값 그대로(UNKNOWN 포함, 화면에서 고르지 않음) */
export const productInfoStepSchema = createProductFieldsSchema
  .pick({
    brand: true,
    modelName: true,
    color: true,
    size: true,
    conditionGrade: true,
  })
  .extend({
    /** 2/6 '상태'. AI 분석 확인용이라 등록 요청에는 보내지 않습니다(사용자 결정). 분석 결과 conditionDescription */
    conditionDescription: z.string().nullish(),
  })
export type ProductInfoForm = z.infer<typeof productInfoStepSchema>

/** AI 분석 결과 → 2/6 기본값. 사진을 다시 분석하면 이 값으로 덮어씁니다. */
export function analysisToDraft(analysis: ProductAnalysis): Partial<RegisterDraft> {
  return {
    analysisId: analysis.analysisId,
    brand: analysis.brand ?? undefined,
    modelName: analysis.modelName ?? undefined,
    color: analysis.color ?? undefined,
    // AI가 라벨을 못 읽으면 null → 사용자가 입력
    size: analysis.size ?? undefined,
    // 판정 실패(null)면 명세의 '판정 불가'로
    conditionGrade: analysis.conditionGrade ?? 'UNKNOWN',
    conditionDescription: analysis.conditionDescription ?? undefined,
  }
}

/* ───────── 3/6 추가 정보 + 가격 계산 ───────── */

/** 3/6 'AI 기준가 분석하기'로 받은 가격 계산 결과 중 4/6 · 등록에 쓰는 값. 시세가 없으면 모두 0 */
export const priceResultSchema = calculatePriceResponseSchema.pick({
  recommendedPrice: true,
  baseMarketPrice: true,
  minRecommendedPrice: true,
  maxRecommendedPrice: true,
  priceRange: true,
  reason: true,
})
export type PriceResult = z.infer<typeof priceResultSchema>

/** Figma 3/6 · 6/6 문구 ↔ 명세 componentStatus */
export const COMPONENT_STATUS_LABELS: Record<ComponentStatus, string> = {
  FULL: '전체 있음',
  PARTIAL: '일부 있음',
  NONE: '구성품 없음',
}

/** 3/6 입력: 구성품 여부(필수) · 판매자 설명(선택) */
export const extraInfoFormSchema = createProductFieldsSchema.pick({
  componentStatus: true,
  sellerDescription: true,
})
export type ExtraInfoForm = z.infer<typeof extraInfoFormSchema>

/** 3/6 완료 조건: 입력 + 'AI 기준가 분석하기'로 받은 가격 계산 결과 */
export const extraInfoStepSchema = extraInfoFormSchema.extend({ priceResult: priceResultSchema })

/* ───────── 4/6 기준가(= 경매 시작가) ───────── */

/**
 * 기준가를 고치는 단위 · 6/6 '최소 입찰 단위'.
 * [ASSUMED] 등록 요청에 입찰 단위 필드가 없어 서버가 정함. 상품 · 경매 조회 응답의 bidIncrement 예시 값(5,000)
 */
export const REGISTER_BID_INCREMENT = 5000

/** 기준가. 등록 때 sellingPrice와 auctionStartPrice에 같은 값으로 들어갑니다(사용자 결정). */
export const startPriceStepSchema = createProductFieldsSchema.pick({ sellingPrice: true })

/* ───────── 5/6 일정 ───────── */

export const scheduleStepSchema = createProductFieldsSchema
  .pick({ auctionStartAt: true, auctionEndAt: true })
  // 사용자 결정: 과거 시작 금지(명세에는 없는 프론트 규칙)
  .refine((v) => Date.parse(v.auctionStartAt) > Date.now(), {
    path: ['auctionStartAt'],
    message: '시작 시간은 지금 이후로 정해주세요.',
  })
  .refine((v) => isAuctionLongEnough(v.auctionStartAt, v.auctionEndAt), {
    path: ['auctionEndAt'],
    message: '경매 시간은 1시간부터 설정할 수 있어요.',
  })

/* ───────── 단계 묶음 ───────── */

/** 각 단계에서 모으는 값을 합친 작성 중 상태. 단계마다 채워지므로 모두 선택 */
export type RegisterDraft = Partial<
  z.infer<typeof photosStepSchema> &
    z.infer<typeof analysisStepSchema> &
    z.infer<typeof productInfoStepSchema> &
    z.infer<typeof extraInfoStepSchema> &
    z.infer<typeof startPriceStepSchema> &
    z.infer<typeof scheduleStepSchema>
>

/** 단계를 끝냈다고 볼 조건. 6/6은 확인 화면이라 모을 값이 없습니다. */
export const STEP_SCHEMAS: Record<RegisterStep, z.ZodType> = {
  '1': photosStepSchema,
  analyzing: analysisStepSchema,
  '2': productInfoStepSchema,
  '3': extraInfoStepSchema,
  '4': startPriceStepSchema,
  '5': scheduleStepSchema,
  '6': z.object({}),
}

/** '다음'을 눌러 끝낸 단계이고, 지금 값도 그 단계 스키마를 통과하는지 */
export function isStepDone(step: RegisterStep, draft: RegisterDraft, completed: RegisterStep[]) {
  return completed.includes(step) && STEP_SCHEMAS[step].safeParse(draft).success
}

/** 아직 끝나지 않은 첫 단계. 모두 끝났으면 6 */
export function firstIncompleteStep(draft: RegisterDraft, completed: RegisterStep[]) {
  return REGISTER_STEPS.find((step) => !isStepDone(step, draft, completed)) ?? '6'
}

/** 이 단계 앞의 단계를 모두 끝냈는지 */
export function canEnterStep(step: RegisterStep, draft: RegisterDraft, completed: RegisterStep[]) {
  const index = REGISTER_STEPS.indexOf(step)
  return REGISTER_STEPS.slice(0, index).every((s) => isStepDone(s, draft, completed))
}

/**
 * 모은 값을 POST /api/products 요청으로 바꿉니다. 필드 이름은 단계 스키마와 같습니다.
 * imageUrls는 등록 직전에 분석 조회로 다시 받은 값(서명 URL 만료 때문).
 */
export function buildCreateProductRequest(
  draft: RegisterDraft,
  imageUrls: string[],
): CreateProductRequest {
  const { priceResult } = draft
  return createProductRequestSchema.parse({
    imageUrls,
    brand: draft.brand,
    modelName: draft.modelName,
    color: draft.color,
    size: draft.size,
    conditionGrade: draft.conditionGrade,
    componentStatus: draft.componentStatus,
    recommendedPrice: priceResult?.recommendedPrice,
    baseMarketPrice: priceResult?.baseMarketPrice,
    priceRange: priceResult?.priceRange,
    reason: priceResult?.reason,
    sellingPrice: draft.sellingPrice,
    auctionStartPrice: draft.sellingPrice,
    sellerDescription: draft.sellerDescription,
    auctionStartAt: draft.auctionStartAt,
    auctionEndAt: draft.auctionEndAt,
  })
}
