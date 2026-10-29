import { isApiError } from '@/api/client'
import {
  analyzeProduct,
  cancelAnalysis,
  getProductAnalysis,
  uploadProductPhoto,
} from '@/api/products'
import { API_ERROR_CODE } from '@/api/schemas/common'
import type { ProductAnalysis } from '@/api/schemas/products'
import {
  ANALYSIS_MAX_WAIT_MS,
  ANALYSIS_POLL_INTERVAL_MS,
  isAnalysisCancelled,
  isAnalysisFailed,
} from '@/features/register/analysis'
import {
  ANALYSIS_FAILED,
  ANALYSIS_NOT_FOUND,
  ANALYSIS_TOO_SLOW,
  PHOTOS_MISSING,
  RegisterFailureError,
} from '@/features/register/errors'
import type { PhotoSlot } from '@/features/register/schemas'
import { PHOTO_SLOTS, toApiPhotoSlot } from '@/features/register/schemas'
import type { AnalysisTask, PhotoUpload } from '@/stores/register-store'
import { useRegisterStore } from '@/stores/register-store'

/*
 * 사진 업로드 · 분석 세션 만들기 · 기다리기.
 * 명세: 사진은 고를 때 1장씩 POST /api/products/photos로 올려 photoId를 받고, 분석은 photoIds(JSON)로 요청합니다.
 * 한 번 분석에 보낸 photoId는 다시 쓸 수 없어(40923), 새 분석(가격 재계산 · 사진 일부 변경)은 IndexedDB의 같은 파일을 다시 올려 새 ID로 요청합니다.
 * 1/6 사진 칸, 1/6 다음의 분석 화면, 가격을 다시 계산할 때 새 세션이 필요한 경우(pricing.ts)가 함께 씁니다.
 */

/** 지금 등록 흐름이 가진 분석 세션(진행 중인 작업 · 끝난 세션) */
export function currentAnalysisIds(): number[] {
  const { draft, analysisTask } = useRegisterStore.getState()
  const ids = [analysisTask?.id, draft.analysisId].filter((id): id is number => id != null)
  return [...new Set(ids)]
}

/**
 * 더 쓰지 않을 분석 세션을 뒤에서 취소합니다(POST /api/products/analyze/{taskId}/cancel).
 * 기다리지 않고, 실패해도(이미 등록 확정 · 세션 없음 등) 등록 흐름에는 영향이 없어 콘솔에만 남깁니다.
 */
export function cancelAnalysesQuietly(ids: readonly number[]) {
  for (const id of ids) {
    cancelAnalysis(id).catch((error: unknown) => console.warn('[분석 취소] 실패', id, error))
  }
}

/** 사진 1장 업로드 + 촬영 면 판정 */
export async function uploadSlotPhoto(slot: PhotoSlot, file: File): Promise<PhotoUpload> {
  const { photoId, check, message } = await uploadProductPhoto(file, toApiPhotoSlot(slot))
  return { photoId, check, message }
}

/**
 * 분석에 보낼 photoId를 칸 순서대로 모읍니다. 아직 없거나 이미 분석에 쓴 사진(reuploadAll이면 전부)은
 * IndexedDB의 파일을 다시 올려 새 ID를 받습니다.
 */
async function collectPhotoIds(reuploadAll: boolean): Promise<number[]> {
  const { draft, loadPhoto, updatePhotoMeta } = useRegisterStore.getState()
  const slots = PHOTO_SLOTS.filter((slot) => draft.photos?.[slot])
  return Promise.all(
    slots.map(async (slot) => {
      const meta = draft.photos?.[slot]
      if (!meta) throw new RegisterFailureError(PHOTOS_MISSING)
      if (!reuploadAll && meta.photoId != null && !meta.used) return meta.photoId
      const blob = await loadPhoto(slot)
      if (!blob) throw new RegisterFailureError(PHOTOS_MISSING)
      const upload = await uploadSlotPhoto(
        slot,
        new File([blob], meta.name, { type: meta.type || blob.type }),
      )
      updatePhotoMeta(slot, { ...upload, used: false })
      return upload.photoId!
    }),
  )
}

/** 이 photoId로는 분석할 수 없다는 응답: 없거나 다른 계정의 사진(40409) · 이미 쓴 사진(40923) */
function isPhotoUnusable(error: unknown) {
  return (
    isApiError(error) &&
    (error.code === API_ERROR_CODE.PHOTO_NOT_FOUND ||
      error.code === API_ERROR_CODE.PHOTO_ALREADY_USED)
  )
}

async function requestAnalysis(reuploadAll: boolean) {
  const photoIds = await collectPhotoIds(reuploadAll)
  try {
    return await analyzeProduct(photoIds)
  } finally {
    // 응답을 받지 못했거나 큐 등록이 실패해도 서버는 이미 사용 처리했을 수 있어 쓴 것으로 봅니다(명세: QUEUE_FAILED도 재사용 불가).
    const { draft, updatePhotoMeta } = useRegisterStore.getState()
    for (const slot of PHOTO_SLOTS) {
      if (draft.photos?.[slot]) updatePhotoMeta(slot, { used: true })
    }
  }
}

/** 화면이 두 번 그려져도(StrictMode · 새로고침 직후) 분석 접수는 한 번만 */
let inflightAnalysis: Promise<AnalysisTask> | null = null

/**
 * 분석 접수(POST /api/products/analyze). 필요한 사진만 다시 올린 뒤 photoIds로 요청하고,
 * 서버가 사진을 쓸 수 없다고 하면(계정이 바뀜 · 서버가 미사용 사진을 지움 등) 전부 다시 올려 한 번 더 요청합니다.
 * 업로드를 시작한 시각부터 대기 시간을 잽니다.
 */
export function startAnalysis(): Promise<AnalysisTask> {
  inflightAnalysis ??= (async () => {
    const startedAt = Date.now()
    let response
    try {
      response = await requestAnalysis(false)
    } catch (error) {
      if (!isPhotoUnusable(error)) throw error
      console.warn('[분석] 사진을 다시 올려 분석을 다시 요청합니다.', error)
      response = await requestAnalysis(true)
    }
    return { id: response.analysisId, startedAt }
  })().finally(() => {
    inflightAnalysis = null
  })
  return inflightAnalysis
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
    if (isAnalysisCancelled(analysis.status)) throw new RegisterFailureError(ANALYSIS_NOT_FOUND)
    if (Date.now() - startedAt > ANALYSIS_MAX_WAIT_MS) {
      throw new RegisterFailureError(ANALYSIS_TOO_SLOW)
    }
    await wait(ANALYSIS_POLL_INTERVAL_MS)
  }
}
