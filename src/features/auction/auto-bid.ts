import { isApiError } from '@/api/client'
import type { ApiErrorCodeName, AutoBidStatus } from '@/api/schemas/common'
import { API_ERROR_CODE } from '@/api/schemas/common'

/* 자동 입찰 공통 규칙. 상품 상세 · 실시간 경매 화면이 함께 씁니다. */

/** 응답에 최소 입찰 단위가 없을 때 쓰는 값(DS AmountStepper 기본 단위) */
export const DEFAULT_BID_INCREMENT = 5000

/** 살아 있는(CANCELED가 아닌) 내 자동 입찰 설정 */
export interface MyAutoBid {
  status: Exclude<AutoBidStatus, 'CANCELED'>
  maxAmount: number
}

/**
 * 상세 myState.autoBidStatus · autoBidCap(또는 실시간 myAutoBidStatus · myCap)을 내 자동 입찰로 바꿉니다.
 * 설정이 없거나 취소됐으면 null
 */
export function toMyAutoBid(
  status: AutoBidStatus | null | undefined,
  cap: number | null | undefined,
): MyAutoBid | null {
  if (!status || status === 'CANCELED' || cap == null) return null
  return { status, maxAmount: cap }
}

/** 명세: 경매가 시작된 뒤(ACTIVE · CAP_REACHED)에는 상한가를 지금보다 높게만 바꿀 수 있습니다(40907). */
export function canOnlyRaise(autoBid: MyAutoBid | null) {
  return autoBid !== null && autoBid.status !== 'RESERVED'
}

export function hasErrorCode(error: unknown, ...names: ApiErrorCodeName[]) {
  return isApiError(error) && names.some((name) => error.code === API_ERROR_CODE[name])
}

/** 같은 요청을 그대로 다시 보내도 되는 실패: 연결 · 시간 초과 · 서버 오류 · 동시 처리 충돌 */
export function isRetryableError(error: unknown) {
  if (!isApiError(error)) return true
  if (error.kind === 'network' || error.kind === 'timeout') return true
  if (error.status !== null && error.status >= 500) return true
  return error.code === API_ERROR_CODE.CONCURRENT_CONFLICT
}
