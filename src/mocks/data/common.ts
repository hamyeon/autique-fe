import mockProduct01 from '@/assets/illustrations/img_mock_product_01.jpg'
import mockProduct02 from '@/assets/illustrations/img_mock_product_02.JPG'
import mockProduct03 from '@/assets/illustrations/img_mock_product_03.JPG'
import mockProduct04 from '@/assets/illustrations/img_mock_product_04.jpg'

/* 목 데이터 공통: 시각, 이미지, 사용자 */

export const MINUTE = 60 * 1000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/** 명세 예시처럼 '+09:00' 오프셋이 붙은 ISO-8601 문자열 */
export function kst(time: number | Date) {
  const shifted = new Date(+time + 9 * HOUR)
  return shifted.toISOString().replace(/\.\d{3}Z$/, '+09:00')
}

/** 주소에 ?mock=reset 을 붙여 페이지를 열었는지. 이때 세션에 저장한 목 상태를 지우고 처음 데이터로 시작합니다. */
export const mockResetRequested =
  new URLSearchParams(window.location.search).get('mock') === 'reset'

/** 지금으로부터 ms 뒤의 시각(ms). 목 데이터는 페이지를 열 때 기준으로 만들어집니다. */
export function fromNow(ms: number) {
  return Date.now() + ms
}

/** 목 상품 이미지 4장. 홈 목록 상품은 순서대로 한 장씩 씁니다. */
export const PRODUCT_IMAGES = [mockProduct01, mockProduct02, mockProduct03, mockProduct04]

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
