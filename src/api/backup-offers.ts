import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auctionKeys } from '@/api/auctions'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'

export const backupOfferKeys = {
  all: ['backup-offers'] as const,
  detail: (backupOfferId: number) => [...backupOfferKeys.all, 'detail', backupOfferId] as const,
}

/* ───────── API 함수 ───────── */

/** backupOfferId는 경매 결과(result)의 backupOfferId로 얻습니다. */
export function getBackupOffer(backupOfferId: number, signal?: AbortSignal) {
  return request(endpoints.getBackupOffer, { params: { backupOfferId }, signal })
}

/** 수락하면 주문이 생기고 orderId가 옵니다(결제 기한 = 수락 시각 + 24시간). */
export function acceptBackupOffer(backupOfferId: number, idempotencyKey?: string) {
  return request(endpoints.acceptBackupOffer, { params: { backupOfferId }, idempotencyKey })
}

export function declineBackupOffer(backupOfferId: number) {
  return request(endpoints.declineBackupOffer, { params: { backupOfferId } })
}

/* ───────── 훅 ───────── */

export function useBackupOfferQuery(backupOfferId: number) {
  return useQuery({
    queryKey: backupOfferKeys.detail(backupOfferId),
    queryFn: ({ signal }) => getBackupOffer(backupOfferId, signal),
  })
}

function useInvalidateBackupOffer(backupOfferId: number) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: backupOfferKeys.detail(backupOfferId) }),
      queryClient.invalidateQueries({ queryKey: [...auctionKeys.all, 'result'] }),
    ])
}

export function useAcceptBackupOfferMutation(backupOfferId: number) {
  const invalidate = useInvalidateBackupOffer(backupOfferId)
  return useMutation({
    mutationFn: (idempotencyKey?: string) => acceptBackupOffer(backupOfferId, idempotencyKey),
    onSuccess: invalidate,
  })
}

export function useDeclineBackupOfferMutation(backupOfferId: number) {
  const invalidate = useInvalidateBackupOffer(backupOfferId)
  return useMutation({
    mutationFn: () => declineBackupOffer(backupOfferId),
    onSuccess: invalidate,
  })
}
