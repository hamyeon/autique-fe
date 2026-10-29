import { useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  CalculatePriceRequest,
  CreateProductRequest,
  ProductPhotoSlot,
} from '@/api/schemas/products'

export const productKeys = {
  all: ['products'] as const,
  analysis: (taskId: number) => [...productKeys.all, 'analysis', taskId] as const,
}

/* ───────── API 함수 ───────── */

/** 사진 1장을 올리고 촬영 면 판정을 받습니다. photoId는 분석 요청에 씁니다. */
export function uploadProductPhoto(image: File, slot: ProductPhotoSlot) {
  const body = new FormData()
  body.append('image', image)
  body.append('slot', slot)
  return request(endpoints.uploadProductPhoto, { body })
}

/** 선업로드한 사진으로 분석 작업을 접수합니다. 202 + analysisId */
export function analyzeProduct(photoIds: number[]) {
  return request(endpoints.analyzeProduct, { body: { photoIds } })
}

/** taskId = analyzeProduct가 돌려준 analysisId */
export function getProductAnalysis(taskId: number, signal?: AbortSignal) {
  return request(endpoints.getProductAnalysis, { params: { taskId }, signal })
}

/** 등록 확정 전의 분석 세션을 취소합니다. taskId = analysisId */
export function cancelAnalysis(taskId: number) {
  return request(endpoints.cancelAnalysis, { params: { taskId } })
}

export function calculatePrice(body: CalculatePriceRequest) {
  return request(endpoints.calculatePrice, { body })
}

export function createProduct(body: CreateProductRequest) {
  return request(endpoints.createProduct, { body })
}

/* ───────── 훅 ───────── */

/*
 * 분석 접수 · 폴링 · 등록 제출은 경매 등록 화면이 직접 다룹니다
 * (src/pages/register/register-analyzing-page.tsx, src/features/register/submit.ts).
 */

/** 분석 세션당 1회만 가능합니다(이후 40003). */
export function useCalculatePriceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: calculatePrice,
    onSuccess: (_, { analysisId }) =>
      queryClient.invalidateQueries({ queryKey: productKeys.analysis(analysisId) }),
  })
}
