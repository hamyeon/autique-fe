import { createProduct } from '@/api/products'
import type { CreateProductResponse } from '@/api/schemas/products'
import { ANALYSIS_NOT_FOUND, RegisterFailureError } from '@/features/register/errors'
import type { RegisterDraft } from '@/features/register/schemas'
import { buildCreateProductRequest, scheduleStepSchema } from '@/features/register/schemas'

/*
 * 6/6 '상품 등록하기'.
 * 1) 제출용 스키마(createProductRequestSchema)로 한 번 더 검증 + 일정 규칙(지금 이후 시작) 재확인
 * 2) POST /api/products. 상품 이미지는 서버가 analysisId 세션에 저장한 사진을 씁니다(imageUrls 보내지 않음).
 * 명세상 Idempotency-Key가 없는 엔드포인트라, 같은 내용으로 진행 중인 요청이 있으면 그 요청을 그대로 돌려줘 두 번 가지 않게 합니다.
 * 사진 파일 · 미리보기 주소(blob:)는 스토어와 요청에 넣지 않습니다.
 */

let inflight: { key: string; promise: Promise<CreateProductResponse> } | null = null

export function submitRegistration(draft: RegisterDraft): Promise<CreateProductResponse> {
  const key = JSON.stringify(draft)
  if (inflight?.key === key) return inflight.promise

  const promise = (async () => {
    // 시간이 지나 시작 시각이 과거가 됐을 수 있어 제출 직전에 다시 확인합니다(실패하면 5/6으로).
    scheduleStepSchema.parse(draft)
    if (draft.analysisId == null) throw new RegisterFailureError(ANALYSIS_NOT_FOUND)
    // ZodError면 해당 단계로 안내합니다(errors.ts).
    return createProduct(buildCreateProductRequest(draft))
  })().finally(() => {
    if (inflight?.promise === promise) inflight = null
  })
  inflight = { key, promise }
  return promise
}
