import { useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { CalculatePriceRequest, CreateProductRequest } from '@/api/schemas/products'

export const productKeys = {
  all: ['products'] as const,
  analysis: (taskId: number) => [...productKeys.all, 'analysis', taskId] as const,
}

/* ───────── API 함수 ───────── */

/** 이미지를 multipart(images)로 올리고 분석 작업을 접수합니다. 202 + analysisId */
export function analyzeProduct(images: File[]) {
  const body = new FormData()
  for (const image of images) body.append('images', image)
  return request(endpoints.analyzeProduct, { body })
}

/** taskId = analyzeProduct가 돌려준 analysisId */
export function getProductAnalysis(taskId: number, signal?: AbortSignal) {
  return request(endpoints.getProductAnalysis, { params: { taskId }, signal })
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
