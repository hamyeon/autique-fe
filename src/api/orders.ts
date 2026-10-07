import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auctionKeys } from '@/api/auctions'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'

export const orderKeys = {
  all: ['orders'] as const,
  detail: (orderId: number) => [...orderKeys.all, 'detail', orderId] as const,
}

/* ───────── API 함수 ───────── */

export function getOrder(orderId: number, signal?: AbortSignal) {
  return request(endpoints.getOrder, { params: { orderId }, signal })
}

/** Mock 결제. 엔드포인트 자체가 멱등이라 Idempotency-Key가 없습니다. */
export function payOrder(orderId: number) {
  return request(endpoints.payOrder, { params: { orderId } })
}

/* ───────── 훅 ───────── */

export function useOrderQuery(orderId: number) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
  })
}

export function usePayOrderMutation(orderId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => payOrder(orderId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: [...auctionKeys.all, 'result'] }),
      ]),
  })
}
