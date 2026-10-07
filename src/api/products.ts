import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { auctionKeys } from '@/api/auctions'
import type {
  AnalysisStatus,
  CalculatePriceRequest,
  CreateProductRequest,
} from '@/api/schemas/products'

export const productKeys = {
  all: ['products'] as const,
  analysis: (taskId: number) => [...productKeys.all, 'analysis', taskId] as const,
}

/** 분석 상태 폴링 간격 */
const ANALYSIS_POLL_MS = 1500

/** Vision 단계 폴링을 멈추는 상태: 사용자 확인 단계 이후이거나 실패 */
const ANALYSIS_POLL_STOP: ReadonlySet<AnalysisStatus> = new Set([
  'AWAITING_USER_CONFIRMATION',
  'PRICING_PROCESSING',
  'COMPLETED',
  'IMAGE_UPLOAD_FAILED',
  'QUEUE_FAILED',
  'VISION_FAILED',
  'PRICING_FAILED',
])

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

export function useAnalyzeProductMutation() {
  return useMutation({ mutationFn: analyzeProduct })
}

/** AWAITING_USER_CONFIRMATION 또는 *_FAILED가 될 때까지 폴링합니다. */
export function useProductAnalysisQuery(taskId: number | null) {
  return useQuery({
    queryKey: productKeys.analysis(taskId ?? -1),
    queryFn: ({ signal }) => getProductAnalysis(taskId!, signal),
    enabled: taskId !== null,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && ANALYSIS_POLL_STOP.has(status) ? false : ANALYSIS_POLL_MS
    },
  })
}

/** 분석 세션당 1회만 가능합니다(이후 40003). */
export function useCalculatePriceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: calculatePrice,
    onSuccess: (_, { analysisId }) =>
      queryClient.invalidateQueries({ queryKey: productKeys.analysis(analysisId) }),
  })
}

/** 상품 등록 + 첫 경매(SCHEDULED) 생성 */
export function useCreateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: auctionKeys.lists() }),
  })
}
