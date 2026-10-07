import type {
  AnalysisStatus,
  CalculatePriceResponse,
  ProductAnalysis,
} from '@/api/schemas/products'
import { sessionAppStorage } from '@/lib/storage'
import { PRODUCT_IMAGES } from '@/mocks/data/common'

/*
 * AI 분석 세션. 접수 후 시간이 지나면 QUEUED → VISION_PROCESSING → AWAITING_USER_CONFIRMATION 으로 넘어갑니다.
 * 분석 화면에서 새로고침해도 이어서 기다릴 수 있도록 세션을 sessionStorage에 둡니다.
 */

/** 접수 후 Vision 시작까지 */
const QUEUED_MS = 1000
/** 기본 Vision 분석 시간(실서버는 약 4초) */
export const VISION_MS = 3000
/** ?mock=slow: 분석에 30초 */
export const SLOW_VISION_MS = 29_000
/** ?mock=analysis-fail: Vision 시작 후 이만큼 지나 VISION_FAILED */
export const FAIL_AFTER_MS = 2000

interface MockAnalysis {
  analysisId: number
  createdAt: number
  imageUrls: string[]
  priced: boolean
  /** Vision 분석에 걸리는 시간 */
  visionMs: number
  /** 이 시간(Vision 시작 기준)이 지나면 실패 */
  failAfterMs: number | null
}

const STORAGE_KEY = 'autique-mock-analyses'

function loadAnalyses(): MockAnalysis[] {
  try {
    const raw = sessionAppStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MockAnalysis[]) : []
  } catch {
    return []
  }
}

export const analyses: MockAnalysis[] = loadAnalyses()

const saveAnalyses = () => sessionAppStorage.setItem(STORAGE_KEY, JSON.stringify(analyses))

let nextAnalysisId = analyses.reduce((max, a) => Math.max(max, a.analysisId), 0) + 1

export function createAnalysis(
  imageCount: number,
  options: { visionMs?: number; failAfterMs?: number | null } = {},
) {
  const analysis: MockAnalysis = {
    analysisId: nextAnalysisId++,
    createdAt: Date.now(),
    // 업로드한 파일 대신 예시 이미지 URL을 돌려줍니다.
    imageUrls: Array.from(
      { length: imageCount },
      (_, i) => PRODUCT_IMAGES[i % PRODUCT_IMAGES.length],
    ),
    priced: false,
    visionMs: options.visionMs ?? VISION_MS,
    failAfterMs: options.failAfterMs ?? null,
  }
  analyses.push(analysis)
  saveAnalyses()
  return analysis
}

export function findAnalysis(analysisId: number) {
  return analyses.find((a) => a.analysisId === analysisId)
}

export function markPriced(analysis: MockAnalysis) {
  analysis.priced = true
  saveAnalyses()
}

export function analysisStatusOf(a: MockAnalysis): AnalysisStatus {
  if (a.priced) return 'COMPLETED'
  const elapsed = Date.now() - a.createdAt
  if (elapsed < QUEUED_MS) return 'QUEUED'
  if (a.failAfterMs !== null && elapsed >= QUEUED_MS + a.failAfterMs) return 'VISION_FAILED'
  if (elapsed < QUEUED_MS + a.visionMs) return 'VISION_PROCESSING'
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

/** VISION_PROCESSING 동안 Vision 시간을 3등분해 한 단계씩 끝나는 것처럼 진행 상황과 잠정 결과를 돌려줍니다(명세 예시). */
function visionProgressOf(a: MockAnalysis) {
  const stageMs = a.visionMs / 3
  const completed = Math.min(2, Math.floor((Date.now() - a.createdAt - QUEUED_MS) / stageMs))
  if (completed < 1) return { visionProgress: null, preliminary: null }
  return {
    visionProgress: { completedStages: completed, totalStages: 3 },
    preliminary: {
      brand: VISION_RESULT.brand,
      modelName: VISION_RESULT.modelName,
      color: VISION_RESULT.color,
      // 라벨 판독(두 번째 단계)이 끝나야 사이즈가 채워집니다.
      size: completed >= 2 ? VISION_RESULT.size : null,
    },
  }
}

/** 분석이 끝나기 전 · 실패 시의 결과 필드(명세: null과 빈 배열) */
const EMPTY_RESULT = {
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
  if (done) return { ...base, visionProgress: null, preliminary: null, ...VISION_RESULT }
  if (status === 'VISION_FAILED') {
    return {
      ...base,
      failureStage: 'VISION',
      failureMessage: 'Claude API 호출 중 오류가 발생했습니다: (목)', // 명세 예시
      visionProgress: null,
      preliminary: null,
      ...EMPTY_RESULT,
    }
  }
  return {
    ...base,
    ...(status === 'VISION_PROCESSING'
      ? visionProgressOf(a)
      : { visionProgress: null, preliminary: null }),
    ...EMPTY_RESULT,
  }
}

/** 명세 예시 그대로의 시세 결과: 1순위 중고 실거래 기반(KREAM · eBay 값은 0과 빈 배열) */
export const PRICE_RESULT: CalculatePriceResponse = {
  recommendedPrice: 40000,
  baseMarketPrice: 40000,
  kreamAveragePrice: 0,
  ebayAveragePrice: 0,
  minRecommendedPrice: 25000,
  maxRecommendedPrice: 81000,
  priceRange: '25,000원 ~ 81,000원',
  reason:
    '당근마켓·후르츠패밀리에 올라온 Dunk Low 중고 매물 116건을 근거로 계산했습니다. 실거래가 중앙값은 40,000원이고, 매물의 절반이 25,000원 ~ 81,000원 사이에 있습니다. 상품 상태 UNKNOWN(기타 상태)는 전체 매물 시세 대비 100% 수준으로 반영했습니다. 구성품이 모두 포함되어 있어 100% 반영률을 적용했습니다. 이를 바탕으로 최종 추천가는 40,000원이며, 판매 권장 범위는 실거래 분포를 따라 25,000원 ~ 81,000원입니다.',
  kreamMatches: [],
  ebayMatches: [],
}

/** ?mock=empty: 시세 데이터 없음(명세 예시). 금액은 모두 0(사용자 결정: 그대로 0) */
export const PRICE_RESULT_EMPTY: CalculatePriceResponse = {
  recommendedPrice: 0,
  baseMarketPrice: 0,
  kreamAveragePrice: 0,
  ebayAveragePrice: 0,
  minRecommendedPrice: 0,
  maxRecommendedPrice: 0,
  priceRange: '시세 정보 없음',
  reason:
    '입력한 브랜드, 모델명, 색상, 사이즈와 일치하는 시세 데이터를 찾지 못했습니다. 추천 가격 산정을 위해서는 유사 거래 데이터가 추가로 필요합니다.',
  kreamMatches: [],
  ebayMatches: [],
}
