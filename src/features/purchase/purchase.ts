import { isApiError } from '@/api/client'
import type { MyPenalties } from '@/api/schemas/me'
import type { InfoRowData } from '@/components/ds'
import { formatMonthDay } from '@/lib/format'

/* 낙찰 이후 화면(경매 결과 · 결제 · 차순위 구매 기회) 공통 규칙 */

/** 없음(404) · 내 것이 아님(403)이면 '찾을 수 없음'으로 봅니다(남의 주문 · 제안을 구분해 알리지 않음). */
export function isNotFoundError(error: unknown) {
  return isApiError(error) && (error.status === 404 || error.status === 403)
}

/**
 * 서버 시각 기준으로 기한이 지났는지. 응답을 받은 순간(receivedAt, 기기 시각)의 서버 시각이 serverTime이므로
 * 지금 서버 시각 = serverTime + (now - receivedAt)
 */
export function isPastDeadline(
  deadline: string,
  {
    serverTime,
    receivedAt,
    now = Date.now(),
  }: { serverTime: string; receivedAt: number; now?: number },
) {
  return Date.parse(deadline) <= Date.parse(serverTime) + (now - receivedAt)
}

/** 결제 기한 만료(노쇼) 화면의 빨간 안내(사용자 결정, 2026-11-03. Figma에 없음) */
export const NO_SHOW_NOTICE =
  '결제 기한 내 결제가 완료되지 않아 낙찰이 취소되었어요. 구매 기회는 차순위 입찰자에게 넘어가요.'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 서버가 입찰 제한을 주지 않을 때(bidRestricted=false) 노쇼 화면에 보여줄 제한 일수.
 * 사용자 결정(2026-11-03): 노쇼 화면에서는 Figma대로 '7일간 입찰 불가 · ~오늘+7일'을 보여줍니다.
 * 명세는 'N일간'을 하드코딩하지 말고 bidRestrictedUntil을 기준으로 하라고 하므로, 서버가 제한을 주면 그 값을 씁니다.
 */
const FALLBACK_RESTRICT_DAYS = 7

/**
 * 결제 기한 만료(노쇼) · 구매 포기 화면의 노쇼 카드(Figma 396:6776: 노쇼 누적 · 경매 참여 제한 · 이용 제한 기간).
 * - 서버가 제한 중이라고 주면: 기간은 최신 페널티 createdAt ~ bidRestrictedUntil 차이(명세가 허용한 계산), 날짜는 bidRestrictedUntil
 * - 제한 없음으로 오면: FALLBACK_RESTRICT_DAYS일간, 서버 시각 기준 오늘 + 그 일수
 */
export function penaltyRows(p: MyPenalties): InfoRowData[] {
  const serverUntil =
    p.bidRestricted && p.bidRestrictedUntil ? new Date(p.bidRestrictedUntil) : null
  const latest = p.penalties[0]
  const days =
    serverUntil && latest
      ? Math.max(1, Math.round((serverUntil.getTime() - Date.parse(latest.createdAt)) / DAY_MS))
      : FALLBACK_RESTRICT_DAYS
  const until = serverUntil ?? new Date(Date.parse(p.serverTime) + FALLBACK_RESTRICT_DAYS * DAY_MS)
  return [
    { label: '노쇼 누적', value: `${p.noShowCount}회` },
    { label: '경매 참여 제한', value: `${days}일간 입찰 불가`, emphasis: 'danger' },
    { label: '이용 제한 기간', value: `~${formatMonthDay(until)}`, emphasis: 'regular' },
  ]
}
