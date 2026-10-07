import { analyzeProduct, getProductAnalysis } from '@/api/products'
import type { ProductAnalysis } from '@/api/schemas/products'
import {
  ANALYSIS_MAX_WAIT_MS,
  ANALYSIS_POLL_INTERVAL_MS,
  isAnalysisFailed,
} from '@/features/register/analysis'
import {
  ANALYSIS_FAILED,
  ANALYSIS_TOO_SLOW,
  PHOTOS_MISSING,
  RegisterFailureError,
} from '@/features/register/errors'
import { PHOTO_SLOTS } from '@/features/register/schemas'
import type { AnalysisTask } from '@/stores/register-store'
import { useRegisterStore } from '@/stores/register-store'

/*
 * 분석 세션 만들기 · 기다리기. 1/6 다음의 분석 화면과, 가격을 다시 계산할 때 새 세션이 필요한 경우(pricing.ts)가 함께 씁니다.
 */

/** 화면이 두 번 그려져도(StrictMode · 새로고침 직후) 업로드는 한 번만 */
let inflightUpload: Promise<AnalysisTask> | null = null

/** IndexedDB의 사진을 칸 순서대로 모아 POST /api/products/analyze. 업로드를 시작한 시각부터 대기 시간을 잽니다. */
export function uploadPhotos(): Promise<AnalysisTask> {
  inflightUpload ??= (async () => {
    const startedAt = Date.now()
    const { draft, loadPhoto } = useRegisterStore.getState()
    const slots = PHOTO_SLOTS.filter((slot) => draft.photos?.[slot])
    const files = await Promise.all(
      slots.map(async (slot) => {
        const blob = await loadPhoto(slot)
        const meta = draft.photos?.[slot]
        if (!blob || !meta) throw new RegisterFailureError(PHOTOS_MISSING)
        return new File([blob], meta.name, { type: meta.type || blob.type })
      }),
    )
    const { analysisId } = await analyzeProduct(files)
    return { id: analysisId, startedAt }
  })().finally(() => {
    inflightUpload = null
  })
  return inflightUpload
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 가격 계산을 할 수 있는 상태(AWAITING_USER_CONFIRMATION)가 될 때까지 폴링합니다(화면 없이).
 * 실패 상태면 ANALYSIS_FAILED, 최대 대기 시간을 넘기면 ANALYSIS_TOO_SLOW.
 */
export async function waitUntilReadyForPricing(analysisId: number): Promise<ProductAnalysis> {
  const startedAt = Date.now()
  for (;;) {
    const analysis = await getProductAnalysis(analysisId)
    if (analysis.status === 'AWAITING_USER_CONFIRMATION') return analysis
    if (isAnalysisFailed(analysis.status)) throw new RegisterFailureError(ANALYSIS_FAILED)
    if (Date.now() - startedAt > ANALYSIS_MAX_WAIT_MS) {
      throw new RegisterFailureError(ANALYSIS_TOO_SLOW)
    }
    await wait(ANALYSIS_POLL_INTERVAL_MS)
  }
}
