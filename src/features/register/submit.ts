import { createProduct, getProductAnalysis } from '@/api/products'
import { imageUrlSchema } from '@/api/schemas/products'
import type { CreateProductResponse } from '@/api/schemas/products'
import { ANALYSIS_NOT_FOUND, RegisterFailureError } from '@/features/register/errors'
import type { RegisterDraft } from '@/features/register/schemas'
import { buildCreateProductRequest, scheduleStepSchema } from '@/features/register/schemas'

/*
 * 6/6 '상품 등록하기'.
 * 1) 분석 조회로 imageUrls를 다시 받음(명세: 6시간짜리 서명 URL이라 저장해 두지 말고 조회할 때마다 받은 값 사용)
 * 2) 서명 쿼리를 떼어 저장용 주소로 바꿈(toStoredImageUrl)
 * 3) 제출용 스키마(createProductRequestSchema)로 한 번 더 검증 + 일정 규칙(지금 이후 시작) 재확인
 * 4) POST /api/products
 * 명세상 Idempotency-Key가 없는 엔드포인트라, 같은 내용으로 진행 중인 요청이 있으면 그 요청을 그대로 돌려줘 두 번 가지 않게 합니다.
 * 사진 파일 · 미리보기 주소(blob:)는 스토어와 요청에 넣지 않습니다. 사진은 1/6 '다음'의 분석 요청(multipart)으로만 올라갑니다.
 */

/**
 * 분석이 준 S3 서명 URL(약 1,800자) → 서명 쿼리를 뗀 객체 주소(약 110자).
 * [MISMATCH] 명세는 받은 값을 그대로 보내는 흐름이지만 실서버 image_url 컬럼이 서명 URL을 담지 못함(500).
 * 쿼리 없는 주소도 공개로 열리는 것을 확인함(2026-10-07). 백엔드가 저장 방식을 정하면 여기만 바꿉니다.
 */
export function toStoredImageUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.origin + parsed.pathname
  } catch {
    return url // 주소가 아니면 아래 검증에서 걸러집니다.
  }
}

/** 서버로 보내기 전에 이미지 주소가 http(s)인지 확인하고, 아니면 원인을 콘솔에 남깁니다. */
function logInvalidImageUrls(imageUrls: string[]) {
  imageUrls.forEach((url, i) => {
    if (imageUrlSchema.safeParse(url).success) return
    console.error(
      `[등록] imageUrls[${i}]가 http(s) 주소가 아니라 보내지 않습니다.`,
      `앞부분: ${url.slice(0, 30)}… (길이 ${url.length})`,
    )
  })
}

let inflight: { key: string; promise: Promise<CreateProductResponse> } | null = null

export function submitRegistration(draft: RegisterDraft): Promise<CreateProductResponse> {
  const key = JSON.stringify(draft)
  if (inflight?.key === key) return inflight.promise

  const promise = (async () => {
    // 시간이 지나 시작 시각이 과거가 됐을 수 있어 제출 직전에 다시 확인합니다(실패하면 5/6으로).
    scheduleStepSchema.parse(draft)
    if (draft.analysisId == null) throw new RegisterFailureError(ANALYSIS_NOT_FOUND)
    const analysis = await getProductAnalysis(draft.analysisId)
    const imageUrls = analysis.imageUrls.map(toStoredImageUrl)
    logInvalidImageUrls(imageUrls)
    // ZodError면 해당 단계로 안내합니다(errors.ts).
    const body = buildCreateProductRequest(draft, imageUrls)
    return createProduct(body)
  })().finally(() => {
    if (inflight?.promise === promise) inflight = null
  })
  inflight = { key, promise }
  return promise
}
