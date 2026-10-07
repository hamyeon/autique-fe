import shoeDefect from '@/assets/illustrations/img_shoe_defect.svg'
import shoeFront from '@/assets/illustrations/img_shoe_front.svg'
import shoeOutsole from '@/assets/illustrations/img_shoe_outsole.svg'
import shoeSide from '@/assets/illustrations/img_shoe_side.svg'

/* 목 데이터 공통: 시각, 이미지, 사용자 */

export const MINUTE = 60 * 1000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/** 명세 예시처럼 '+09:00' 오프셋이 붙은 ISO-8601 문자열 */
export function kst(time: number | Date) {
  const shifted = new Date(+time + 9 * HOUR)
  return shifted.toISOString().replace(/\.\d{3}Z$/, '+09:00')
}

/** 지금으로부터 ms 뒤의 시각(ms). 목 데이터는 페이지를 열 때 기준으로 만들어집니다. */
export function fromNow(ms: number) {
  return Date.now() + ms
}

export const SHOE_IMAGES = [shoeFront, shoeSide, shoeOutsole, shoeDefect]

/** 로그인한 나 */
export const ME = { userId: 1, nickname: 'mmaybeii', masked: 'mma****' }

export const SELLERS: Record<number, { nickname: string; completedSalesCount: number }> = {
  [ME.userId]: { nickname: ME.nickname, completedSalesCount: 4 },
  2: { nickname: 'hamyeon', completedSalesCount: 12 },
  3: { nickname: 'sneakerlab', completedSalesCount: 31 },
}

/** 배송비 */
export const SHIPPING_FEE = 3000

/** 서버가 정하는 입찰 단위 */
export const BID_INCREMENT = 5000

/** 경매 종료 연장 최대 횟수 */
export const MAX_EXTENSIONS = 3
