import { isApiError } from '@/api/client'
import { calculatePrice } from '@/api/products'
import { API_ERROR_CODE } from '@/api/schemas/common'
import { calculatePriceRequestSchema } from '@/api/schemas/products'
import { uploadPhotos, waitUntilReadyForPricing } from '@/features/register/analysis-session'
import { PRICE_FAILED, RegisterFailureError } from '@/features/register/errors'
import type { ExtraInfoForm, PriceResult } from '@/features/register/schemas'
import { priceResultSchema } from '@/features/register/schemas'
import { useRegisterStore } from '@/stores/register-store'

/*
 * 3/6 'AI 기준가 분석하기' → POST /api/products/calculate-price.
 * 명세: 가격 계산은 AWAITING_USER_CONFIRMATION 세션에서 세션당 1회만(이후 40003, 서버 오류면 PRICING_FAILED).
 * 다시 계산하려면 POST /api/products/analyze부터 새 세션을 만들어야 합니다.
 * → 이미 계산에 쓴 세션이거나 서버가 세션을 쓸 수 없다고 하면, 같은 사진으로 새 세션을 만들어(사용자가 고친 값은 그대로)
 *   한 번 더 계산합니다. 사용자는 로딩 화면만 봅니다.
 */

const INVALID_PRODUCT_INFO = new RegisterFailureError({
  kind: 'invalid',
  title: '상품 정보를 확인해 주세요',
  message: '브랜드 · 모델명 · 컬러 · 사이즈를 다시 확인해 주세요.',
  step: '2',
})

/** 이 세션으로는 다시 계산할 수 없다는 응답: 상태 오류(40003) · 세션 없음(40408) · 계산 중 서버 오류(50001 → PRICING_FAILED) */
function isSessionUnusable(error: unknown) {
  if (!isApiError(error)) return false
  return (
    error.code === API_ERROR_CODE.ANALYSIS_STATUS_INVALID ||
    error.code === API_ERROR_CODE.ANALYSIS_SESSION_NOT_FOUND ||
    error.code === API_ERROR_CODE.INTERNAL_SERVER_ERROR
  )
}

/** 같은 사진으로 새 분석 세션을 만들고 계산할 수 있는 상태까지 기다립니다. AI 결과로 2/6 값을 덮어쓰지 않습니다. */
async function renewSession(): Promise<number> {
  const task = await uploadPhotos()
  await waitUntilReadyForPricing(task.id)
  useRegisterStore.getState().update({ analysisId: task.id })
  return task.id
}

async function requestPrice(analysisId: number, form: ExtraInfoForm): Promise<PriceResult> {
  const { draft } = useRegisterStore.getState()
  // 보내기 전에 명세 요청 스키마로 검증(빠진 값이면 ZodError → 해당 단계로 안내)
  const body = calculatePriceRequestSchema.parse({
    analysisId,
    brand: draft.brand,
    modelName: draft.modelName,
    color: draft.color,
    size: draft.size,
    conditionGrade: draft.conditionGrade,
    componentStatus: form.componentStatus,
  })
  try {
    return priceResultSchema.parse(await calculatePrice(body))
  } catch (error) {
    if (isApiError(error) && error.code === API_ERROR_CODE.INVALID_REQUEST)
      throw INVALID_PRODUCT_INFO
    throw error
  } finally {
    // 응답을 받았든 못 받았든(타임아웃 등) 서버에서 이미 계산됐을 수 있어 이 세션은 쓴 것으로 봅니다.
    useRegisterStore.getState().setPricedAnalysisId(analysisId)
  }
}

let inflight: { key: string; promise: Promise<PriceResult> } | null = null

/** 가격 계산. 같은 입력으로 진행 중인 계산이 있으면 그 요청을 그대로 돌려줍니다(두 번 눌러도 한 번만). */
export function calculateRegisterPrice(form: ExtraInfoForm): Promise<PriceResult> {
  const { draft } = useRegisterStore.getState()
  const key = JSON.stringify([
    draft.analysisId,
    draft.brand,
    draft.modelName,
    draft.color,
    draft.size,
    form.componentStatus,
  ])
  if (inflight?.key === key) return inflight.promise

  const promise = (async () => {
    const { draft, pricedAnalysisId } = useRegisterStore.getState()
    let analysisId = draft.analysisId
    if (analysisId == null || analysisId === pricedAnalysisId) analysisId = await renewSession()
    try {
      return await requestPrice(analysisId, form)
    } catch (error) {
      if (!isSessionUnusable(error)) throw error
      console.warn('[가격 계산] 세션을 다시 쓸 수 없어 새 분석 세션으로 다시 계산합니다.', error)
      try {
        return await requestPrice(await renewSession(), form)
      } catch (retryError) {
        throw isSessionUnusable(retryError) ? new RegisterFailureError(PRICE_FAILED) : retryError
      }
    }
  })().finally(() => {
    if (inflight?.promise === promise) inflight = null
  })
  inflight = { key, promise }
  return promise
}
