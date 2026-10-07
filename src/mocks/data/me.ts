import type { MyPenalties, PenaltyType } from '@/api/schemas/me'
import { DAY, fromNow, kst } from '@/mocks/data/common'

/* 내 페널티. bidRestrictedUntil이 지금보다 뒤면 입찰 제한 중입니다. */

interface MockPenalty {
  penaltyId: number
  type: PenaltyType
  auctionId: number
  createdAt: number
}

export const penaltyState = {
  noShowCount: 1,
  bidRestrictedUntil: null as number | null,
  penalties: [
    { penaltyId: 3, type: 'PAYMENT_EXPIRED', auctionId: 16, createdAt: fromNow(-2 * DAY) },
  ] as MockPenalty[],
}

let nextPenaltyId = 4

export function isBidRestricted() {
  return penaltyState.bidRestrictedUntil !== null && penaltyState.bidRestrictedUntil > Date.now()
}

/** 낙찰 포기 · 결제 기한 만료 시 노쇼 1회를 쌓습니다. 2회부터 3일 입찰 제한(목 전용 정책). */
export function addPenalty(type: PenaltyType, auctionId: number) {
  penaltyState.noShowCount += 1
  penaltyState.penalties.unshift({
    penaltyId: nextPenaltyId++,
    type,
    auctionId,
    createdAt: Date.now(),
  })
  if (penaltyState.noShowCount >= 2) penaltyState.bidRestrictedUntil = fromNow(3 * DAY)
}

export function toPenalties(): MyPenalties {
  return {
    noShowCount: penaltyState.noShowCount,
    bidRestricted: isBidRestricted(),
    bidRestrictedUntil: isBidRestricted() ? kst(penaltyState.bidRestrictedUntil!) : null,
    serverTime: kst(Date.now()),
    penalties: penaltyState.penalties.map((p) => ({ ...p, createdAt: kst(p.createdAt) })),
  }
}
