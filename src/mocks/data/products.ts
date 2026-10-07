import type {
  AnalysisStatus,
  CalculatePriceResponse,
  ProductAnalysis,
} from '@/api/schemas/products'
import { SHOE_IMAGES } from '@/mocks/data/common'

/* AI 분석 세션. 접수 후 시간이 지나면 QUEUED → VISION_PROCESSING → AWAITING_USER_CONFIRMATION 으로 넘어갑니다. */

/** 분석이 끝나기까지 걸리는 시간 */
const QUEUED_MS = 1000
const VISION_MS = 4000

interface MockAnalysis {
  analysisId: number
  createdAt: number
  imageUrls: string[]
  priced: boolean
}

export const analyses: MockAnalysis[] = []

let nextAnalysisId = 1

export function createAnalysis(imageCount: number) {
  const analysis: MockAnalysis = {
    analysisId: nextAnalysisId++,
    createdAt: Date.now(),
    // 업로드한 파일 대신 예시 이미지 URL을 돌려줍니다.
    imageUrls: Array.from({ length: imageCount }, (_, i) => SHOE_IMAGES[i % SHOE_IMAGES.length]),
    priced: false,
  }
  analyses.push(analysis)
  return analysis
}

export function findAnalysis(analysisId: number) {
  return analyses.find((a) => a.analysisId === analysisId)
}

export function analysisStatusOf(a: MockAnalysis): AnalysisStatus {
  if (a.priced) return 'COMPLETED'
  const elapsed = Date.now() - a.createdAt
  if (elapsed < QUEUED_MS) return 'QUEUED'
  if (elapsed < VISION_MS) return 'VISION_PROCESSING'
  return 'AWAITING_USER_CONFIRMATION'
}

/** 명세 예시 그대로의 Vision 결과 */
const VISION_RESULT = {
  brand: 'Nike',
  modelName: 'Dunk Low',
  color: 'Panda',
  size: 270,
  boxIncluded: true,
  conditionDescription: '토박스에 얕은 주름이 있고 아웃솔에 사용감이 보이는 중고 상태입니다.',
  conditionGrade: 'B',
  defects: [
    {
      type: 'crease',
      location: 'toe_box',
      severity: 'minor',
      description: '토박스에 얕은 주름이 있습니다.',
    },
    {
      type: 'sole_wear',
      location: 'outsole',
      severity: 'moderate',
      description: '아웃솔 뒤꿈치 부분에 마모가 있습니다.',
    },
  ],
  candidates: [{ brand: 'Nike', modelName: 'Dunk Low', color: 'Panda', confidence: 0.92 }],
  confidence: 0.92,
  needsUserConfirmation: true,
  warnings: ['사이즈 라벨이 흐릿하게 보여 사이즈는 사용자 확인이 필요합니다.'],
} satisfies Partial<ProductAnalysis>

export function toAnalysis(a: MockAnalysis): ProductAnalysis {
  const status = analysisStatusOf(a)
  const done = status === 'AWAITING_USER_CONFIRMATION' || status === 'COMPLETED'
  const base = {
    analysisId: a.analysisId,
    status,
    imageUrls: a.imageUrls,
    failureStage: null,
    failureMessage: null,
  }
  if (done) return { ...base, ...VISION_RESULT }
  return {
    ...base,
    brand: null,
    modelName: null,
    color: null,
    size: null,
    boxIncluded: null,
    conditionDescription: null,
    conditionGrade: null,
    defects: [],
    candidates: [],
    confidence: null,
    needsUserConfirmation: null,
    warnings: [],
  }
}

/** 명세 예시 그대로의 시세 결과 */
export const PRICE_RESULT: CalculatePriceResponse = {
  recommendedPrice: 24000,
  baseMarketPrice: 120984,
  kreamAveragePrice: 114000,
  ebayAveragePrice: 137280,
  minRecommendedPrice: 23000,
  maxRecommendedPrice: 25000,
  priceRange: '23,000원 ~ 25,000원',
  reason:
    'KREAM 유사 거래 1건의 평균가 114,000원과 eBay 유사 거래 50건의 평균가 137,280원을 각각 70%, 30% 비율로 반영해 기준 시세 120,984원을 계산했습니다. 상품 상태는 C(하자 있음)로 판단하여 20% 반영률을 적용했습니다. 구성품이 모두 포함되어 있어 100% 반영률을 적용했습니다. 이를 바탕으로 최종 추천가는 24,000원으로 산정했으며, 판매 권장 범위는 23,000원 ~ 25,000원입니다. 추천가는 KREAM 평균가 대비 약 79% 낮은 수준입니다.',
  kreamMatches: [
    {
      source: 'KREAM',
      brand: 'Nike',
      modelName: 'Dunk Low',
      color: 'Panda',
      size: 270,
      conditionGrade: 'DS',
      componentStatus: 'NONE',
      price: 114000,
      url: 'https://kream.co.kr/products/548447',
    },
  ],
  ebayMatches: [
    {
      source: 'EBAY',
      brand: 'Nike',
      modelName: 'Dunk Low',
      color: 'Black White Panda',
      size: 270,
      conditionGrade: 'B',
      componentStatus: 'NONE',
      price: 27000,
      url: 'https://www.ebay.com/',
    },
  ],
}

/** ?mock=empty: 시세 데이터 없음(명세 예시) */
export const PRICE_RESULT_EMPTY: CalculatePriceResponse = {
  recommendedPrice: 0,
  baseMarketPrice: 0,
  kreamAveragePrice: 0,
  ebayAveragePrice: 0,
  minRecommendedPrice: 0,
  maxRecommendedPrice: 0,
  priceRange: '시세 정보 없음',
  reason:
    '입력한 브랜드, 모델명, 색상, 사이즈와 일치하는 KREAM/eBay 시세 데이터를 찾지 못했습니다. 추천 가격 산정을 위해서는 유사 거래 데이터가 추가로 필요합니다.',
  kreamMatches: [],
  ebayMatches: [],
}
