import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { auctionKeys } from '@/api/auctions'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  CreatePurchaseGoalRequest,
  PurchaseGoal,
  PurchaseGoalStatus,
} from '@/api/schemas/purchase-goals'

export const purchaseGoalKeys = {
  all: ['purchase-goals'] as const,
  list: () => [...purchaseGoalKeys.all, 'list'] as const,
  detail: (id: number) => [...purchaseGoalKeys.all, 'detail', id] as const,
}

/** 서버가 아직 바꿀 수 있는 상태(탐색 · 참여 · 취소 요청 중). 이런 목표가 있으면 주기적으로 다시 불러옵니다. */
const IN_PROGRESS: readonly PurchaseGoalStatus[] = ['ACTIVE', 'ENGAGED', 'CANCEL_REQUESTED']
export const isGoalInProgress = (goal: Pick<PurchaseGoal, 'status'>) =>
  IN_PROGRESS.includes(goal.status)

/** 서버 스캔은 5분마다지만, 알림을 보고 들어왔을 때 금방 맞춰지도록 30초마다 */
const POLL_MS = 30_000

/* ───────── API 함수 ───────── */

export function parsePurchaseGoal(text: string) {
  return request(endpoints.parsePurchaseGoal, { body: { text } })
}

export function createPurchaseGoal(body: CreatePurchaseGoalRequest) {
  return request(endpoints.createPurchaseGoal, { body })
}

/** 생성 최신순, 종료된 목표 포함, 페이지 없음 */
export function getPurchaseGoals(signal?: AbortSignal) {
  return request(endpoints.getPurchaseGoals, { signal })
}

export function getPurchaseGoal(id: number, signal?: AbortSignal) {
  return request(endpoints.getPurchaseGoal, { params: { id }, signal })
}

export function cancelPurchaseGoal(id: number) {
  return request(endpoints.cancelPurchaseGoal, { params: { id } })
}

/* ───────── 훅 ───────── */

export function usePurchaseGoalsQuery() {
  return useQuery({
    queryKey: purchaseGoalKeys.list(),
    queryFn: ({ signal }) => getPurchaseGoals(signal),
    refetchInterval: (query) => (query.state.data?.some(isGoalInProgress) ? POLL_MS : false),
  })
}

/** 참여 이력이 있는 목표만 상세(participations)를 불러옵니다. 진행 중인 목표는 주기적으로 다시 */
export function usePurchaseGoalDetailQueries(goals: PurchaseGoal[]) {
  return useQueries({
    queries: goals
      .filter((goal) => goal.participationCount > 0)
      .map((goal) => ({
        queryKey: purchaseGoalKeys.detail(goal.id),
        queryFn: ({ signal }: { signal: AbortSignal }) => getPurchaseGoal(goal.id, signal),
        refetchInterval: isGoalInProgress(goal) ? POLL_MS : false,
      })),
  })
}

/** 문장 해석(저장하지 않음) */
export function useParsePurchaseGoalMutation() {
  return useMutation({ mutationFn: parsePurchaseGoal })
}

/** 등록 후 목록을 다시 불러온 뒤에 끝납니다(새 목표가 대화에 들어간 다음 다음 단계로). */
export function useCreatePurchaseGoalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPurchaseGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseGoalKeys.all }),
  })
}

/** 취소 후 목표와 참여 경매(managedByPurchaseAgent가 바뀔 수 있음)를 다시 불러옵니다. */
export function useCancelPurchaseGoalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelPurchaseGoal,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseGoalKeys.all }),
        queryClient.invalidateQueries({ queryKey: auctionKeys.all }),
      ]),
  })
}
