import type { AuctionDetail, AuctionResult } from '@/api/schemas/auctions'
import type { PurchaseGoal, PurchaseGoalDetail } from '@/api/schemas/purchase-goals'
import type { AgentEntry } from './agent-messages'
import {
  bidStartedEntry,
  cancelledEntry,
  confirmedEntry,
  foundEntry,
  lostEntry,
  notFoundEntry,
  onboardingEntry,
  searchingEntry,
  wonEntry,
} from './agent-messages'

/*
 * 서버 데이터 → 대화. 명세: 채팅 API가 없어 목표 상태 · 참여 이력으로 문장을 만듭니다.
 * 참여 시각이 응답에 없어 목표 생성 순서 → 목표 안에서는 참여 순서로 늘어놓습니다.
 * 말풍선 묶음 ID는 목표 · 경매로 정해 다시 불러와도 같은 ID가 됩니다(이미 본 말풍선은 다시 하나씩 나오지 않음).
 */

export interface ParticipationInfo {
  /** GET /api/auctions/{auctionId}: 상품명 · 시작 시각 · 시작가 · 실제 상한 */
  auction?: AuctionDetail
  /** GET /api/auctions/{auctionId}/result: 최종가 · 결제 기한 · 주문(종료된 참여만) */
  result?: AuctionResult
}

/** 목표 하나의 대화. detail이 없으면(참여 없음 · 아직 못 불러옴) 참여 이력 없이 만듭니다. */
export function goalEntries(
  goal: PurchaseGoal,
  detail: PurchaseGoalDetail | undefined,
  infoOf: (auctionId: number) => ParticipationInfo,
): AgentEntry[] {
  const id = (suffix: string) => `goal-${goal.id}-${suffix}`
  const withId = (entry: AgentEntry, suffix: string): AgentEntry => ({ ...entry, id: id(suffix) })

  const entries = [withId(confirmedEntry(goal), 'request'), withId(searchingEntry(), 'searching')]
  const participations = detail?.participations ?? []
  const terminal = !['ACTIVE', 'ENGAGED'].includes(goal.status)

  participations.forEach((p, i) => {
    const { auction, result } = infoOf(p.auctionId)
    const key = `auction-${p.auctionId}`
    entries.push(
      withId(
        foundEntry({
          auctionId: p.auctionId,
          productName: auction?.product.name,
          startAt: auction ? new Date(auction.startsAt) : undefined,
          startPrice: auction?.startPrice,
          maxAmount: auction?.myState.autoBidCap ?? goal.hardMaxAmount,
        }),
        `${key}-found`,
      ),
    )
    /* 취소된 경매는 시작하지 않았을 수 있어 '시작' 문장을 넣지 않습니다. */
    if (p.auctionStatus === 'LIVE' || p.auctionStatus === 'ENDED') {
      entries.push(withId(bidStartedEntry({ auctionId: p.auctionId }), `${key}-started`))
    }
    if (p.status === 'WON') {
      entries.push(
        withId(
          wonEntry({
            auctionId: p.auctionId,
            finalPrice: result?.finalPrice,
            paymentDeadline: result?.paymentDeadline ? new Date(result.paymentDeadline) : null,
            orderId: result?.orderId,
          }),
          `${key}-won`,
        ),
      )
    }
    if (p.status === 'LOST') {
      /* 마지막 참여에서 지고 목표가 끝났으면(만료 · 취소) 다시 찾지 않습니다. */
      const isLast = i === participations.length - 1
      entries.push(
        withId(
          lostEntry({
            finalPrice: result?.finalPrice,
            canceled: p.auctionStatus === 'CANCELED',
            retry: !(isLast && terminal),
          }),
          `${key}-lost`,
        ),
      )
    }
  })

  if (goal.status === 'EXPIRED' && goal.wonCount === 0) {
    entries.push(withId(notFoundEntry(), 'end'))
  }
  if (goal.status === 'CANCELLED' || goal.status === 'CANCEL_REQUESTED') {
    entries.push(withId(cancelledEntry(goal, goal.status), 'end'))
  }
  return entries
}

/** 취소 결과 말풍선 ID. 화면에서 바로 붙인 결과와 서버 대화가 겹치지 않게 같은 ID를 씁니다. */
export const goalEndId = (goalId: number) => `goal-${goalId}-end`

/**
 * 전체 대화 = 온보딩 → 시간 순으로 [목표 묶음(화면에서 붙인 원문 · 조건 정리 → 서버 대화) | 화면에서만 붙인 말풍선].
 * 목표 묶음은 목표 생성 시각, 화면 말풍선은 붙인 시각(at)으로 정렬합니다.
 * 화면에서 붙인 묶음과 ID가 같은 서버 묶음(취소 결과)은 빼서 같은 말이 두 번 나오지 않게 합니다.
 */
export function mergeConversation(
  goalsOldestFirst: PurchaseGoal[],
  history: Map<number, AgentEntry[]>,
  local: AgentEntry[],
): AgentEntry[] {
  const localIds = new Set(local.map((e) => e.id))
  const goalIds = new Set(goalsOldestFirst.map((g) => g.id))
  const blocks = [
    ...goalsOldestFirst.map((goal) => ({
      at: Date.parse(goal.createdAt),
      entries: [
        ...local.filter((e) => e.goalId === goal.id),
        ...(history.get(goal.id) ?? []).filter((e) => !localIds.has(e.id)),
      ],
    })),
    ...local
      .filter((e) => e.goalId === undefined || !goalIds.has(e.goalId))
      .map((e) => ({ at: e.at ?? Date.now(), entries: [e] })),
  ]
  /* sort는 안정 정렬이라 같은 시각이면 원래 순서(목표 먼저)를 지킵니다. */
  blocks.sort((a, b) => a.at - b.at)
  return [onboardingEntry(), ...blocks.flatMap((b) => b.entries)]
}
