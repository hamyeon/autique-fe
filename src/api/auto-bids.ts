import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auctionKeys } from '@/api/auctions'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { CreateAutoBidRequest, UpdateAutoBidRequest } from '@/api/schemas/auto-bids'

export const autoBidKeys = {
  all: ['auto-bids'] as const,
  mine: (auctionId: number) => [...autoBidKeys.all, 'me', auctionId] as const,
}

/* ───────── API 함수 ───────── */

export function createAutoBid(
  auctionId: number,
  body: CreateAutoBidRequest,
  idempotencyKey?: string,
) {
  return request(endpoints.createAutoBid, { params: { auctionId }, body, idempotencyKey })
}

/** 등록된 자동입찰이 없으면 404(40404) */
export function getMyAutoBid(auctionId: number, signal?: AbortSignal) {
  return request(endpoints.getMyAutoBid, { params: { auctionId }, signal })
}

export function updateMyAutoBid(
  auctionId: number,
  body: UpdateAutoBidRequest,
  idempotencyKey?: string,
) {
  return request(endpoints.updateMyAutoBid, { params: { auctionId }, body, idempotencyKey })
}

export function cancelMyAutoBid(auctionId: number) {
  return request(endpoints.cancelMyAutoBid, { params: { auctionId } })
}

/* ───────── 훅 ───────── */

/** 상한가 수정 바텀시트 진입 시 */
export function useMyAutoBidQuery(auctionId: number) {
  return useQuery({
    queryKey: autoBidKeys.mine(auctionId),
    queryFn: ({ signal }) => getMyAutoBid(auctionId, signal),
    staleTime: 0,
  })
}

/** 자동입찰 변경 후 내 설정 · 실시간 상태 · 상세 · 입찰 이력을 다시 불러옵니다. */
function useInvalidateAutoBid(auctionId: number) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: autoBidKeys.mine(auctionId) }),
      queryClient.invalidateQueries({ queryKey: auctionKeys.live(auctionId) }),
      queryClient.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) }),
      queryClient.invalidateQueries({ queryKey: auctionKeys.bidLists(auctionId) }),
    ])
}

export function useCreateAutoBidMutation(auctionId: number) {
  const invalidate = useInvalidateAutoBid(auctionId)
  return useMutation({
    mutationFn: ({
      body,
      idempotencyKey,
    }: {
      body: CreateAutoBidRequest
      idempotencyKey?: string
    }) => createAutoBid(auctionId, body, idempotencyKey),
    onSuccess: invalidate,
  })
}

export function useUpdateMyAutoBidMutation(auctionId: number) {
  const invalidate = useInvalidateAutoBid(auctionId)
  return useMutation({
    mutationFn: ({
      body,
      idempotencyKey,
    }: {
      body: UpdateAutoBidRequest
      idempotencyKey?: string
    }) => updateMyAutoBid(auctionId, body, idempotencyKey),
    onSuccess: invalidate,
  })
}

export function useCancelMyAutoBidMutation(auctionId: number) {
  const invalidate = useInvalidateAutoBid(auctionId)
  return useMutation({
    mutationFn: () => cancelMyAutoBid(auctionId),
    onSuccess: invalidate,
  })
}
