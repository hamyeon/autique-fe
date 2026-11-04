import { useQueries } from '@tanstack/react-query'
import { auctionKeys, getAuctionDetail, getAuctionResult } from '@/api/auctions'
import { usePurchaseGoalDetailQueries, usePurchaseGoalsQuery } from '@/api/purchase-goals'
import type { PurchaseGoalDetail } from '@/api/schemas/purchase-goals'
import type { ParticipationInfo } from './agent-conversation'
import { goalEntries } from './agent-conversation'
import type { AgentEntry } from './agent-messages'

const unique = (ids: number[]) => [...new Set(ids)]

/**
 * 대화에 필요한 서버 데이터(명세 "참여 경매 정보 조회"):
 * 목표 목록 → 참여가 있는 목표의 상세(participations) → 참여 경매 상세(상품명 · 시작 · 상한) · 종료된 참여의 결과(최종가 · 주문).
 * ready는 처음 한 번 모두 받아(또는 실패해) 대화를 그릴 수 있게 됐는지입니다.
 */
export function useAgentHistory() {
  const goalsQuery = usePurchaseGoalsQuery()
  const goals = goalsQuery.data ?? []
  const detailQueries = usePurchaseGoalDetailQueries(goals)

  const details = detailQueries.flatMap((q) => (q.data ? [q.data] : []))
  const detailById = new Map<number, PurchaseGoalDetail>(details.map((d) => [d.id, d]))
  const participations = details.flatMap((d) => d.participations)

  const auctionIds = unique(participations.map((p) => p.auctionId))
  const endedIds = unique(
    participations
      .filter((p) => p.auctionStatus === 'ENDED' && (p.status === 'WON' || p.status === 'LOST'))
      .map((p) => p.auctionId),
  )

  const auctionQueries = useQueries({
    queries: auctionIds.map((auctionId) => ({
      queryKey: auctionKeys.detail(auctionId),
      queryFn: ({ signal }: { signal: AbortSignal }) => getAuctionDetail(auctionId, signal),
    })),
  })
  const resultQueries = useQueries({
    queries: endedIds.map((auctionId) => ({
      queryKey: auctionKeys.result(auctionId),
      queryFn: ({ signal }: { signal: AbortSignal }) => getAuctionResult(auctionId, signal),
    })),
  })

  const infoOf = (auctionId: number): ParticipationInfo => ({
    auction: auctionQueries[auctionIds.indexOf(auctionId)]?.data,
    result: resultQueries[endedIds.indexOf(auctionId)]?.data,
  })

  /* 대화는 오래된 목표부터(목록은 생성 최신순) */
  const goalsOldestFirst = [...goals].reverse()
  const history = new Map<number, AgentEntry[]>(
    goalsOldestFirst.map((goal) => [goal.id, goalEntries(goal, detailById.get(goal.id), infoOf)]),
  )

  const ready =
    goalsQuery.isSuccess &&
    [...detailQueries, ...auctionQueries, ...resultQueries].every((q) => !q.isPending)

  return { goalsQuery, goals, goalsOldestFirst, history, ready }
}
