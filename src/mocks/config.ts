import type { EndpointKey } from '@/api/endpoints'

/*
 * 목 설정.
 * - 목을 끄고 켜는 단위는 '메서드 + 경로'(명세 표기 그대로, 경로 변수는 {name})입니다.
 * - passthrough에 넣은 엔드포인트는 목 대신 실제 서버(VITE_API_BASE_URL, 비어 있으면 Vite 프록시)로 보냅니다.
 * - 실제 서버를 하나라도 쓰면 토큰 재발급 · 로그아웃도 실제 서버로 보내야 합니다(목은 목 토큰만 받음).
 * - .env.local 의 VITE_MOCK=off 이면 MSW 전체가 꺼지고 모든 요청이 실제 서버로 갑니다.
 * - 배포(빌드)는 VITE_MOCK=on일 때만 MSW를 켜고, 같은 passthrough 목록을 VITE_API_BASE_URL(실제 서버, CORS 허용)로 보냅니다.
 *
 * @example
 * export const passthrough: EndpointKey[] = [
 *   'POST /api/products',
 *   'POST /api/products/analyze',
 *   'GET /api/products/analyze/{taskId}',
  'POST /api/products/analyze/{taskId}/cancel',
 * ]
 */
export const passthrough: EndpointKey[] = [
  // 카카오 로그인은 실제 서버로(카카오 토큰은 서버만 검증할 수 있음). 받은 실제 토큰을 재발급 · 무효화하려면 refresh · logout도 실제 서버로
  'POST /api/auth/kakao',
  'POST /api/auth/refresh',
  'POST /api/auth/logout',
  // 경매 등록: 사진 선업로드 · AI 분석 · 가격 계산 · 등록은 실제 서버로
  'POST /api/products/photos',
  'POST /api/products/analyze',
  'GET /api/products/analyze/{taskId}',
  'POST /api/products/calculate-price',
  // 등록 제출(서버가 분석 세션 사진을 씀. 2026-11-03 실서버 등록 확인)
  'POST /api/products',
  // 둘러보기(2026-11-03): 홈 · 상품 찾기 · 검색 · 내 정보 + 카드를 눌러 여는 상세 · 비슷한 상품 · 입찰 이력 · 관심.
  // 목록이 실서버면 카드의 경매 ID도 실서버 것이라 상세 쪽도 함께 보냅니다.
  // 아직 목: 결과 · 낙찰 포기 · 결제 · 차순위 · 알림 · 판매자 관리(5 · 6단계에서 옮김)
  'GET /api/auctions',
  'GET /api/auctions/popular',
  'GET /api/recommendations/auctions',
  'GET /api/me',
  'GET /api/auctions/{auctionId}',
  'GET /api/auctions/{auctionId}/similar',
  'GET /api/auctions/{auctionId}/bids',
  'POST /api/auctions/{auctionId}/likes',
  'DELETE /api/auctions/{auctionId}/likes',
  // 마이페이지 하위 목록(2026-11-03): 판매 · 참여 · 관심
  'GET /api/me/selling-auctions',
  'GET /api/me/auctions',
  'GET /api/me/likes',
  // 실시간 · 입찰 · 자동입찰(2026-11-03): 상세가 실서버라 그 경매에서 하는 행동도 실서버로
  'GET /api/auctions/{auctionId}/live',
  'POST /api/auctions/{auctionId}/bids',
  'GET /api/auctions/{auctionId}/auto-bid/recommendation',
  'POST /api/auctions/{auctionId}/auto-bids',
  'GET /api/auctions/{auctionId}/auto-bids/me',
  'PATCH /api/auctions/{auctionId}/auto-bids/me',
  'DELETE /api/auctions/{auctionId}/auto-bids/me',
]

/** 개발: VITE_MOCK이 off가 아니면 켭니다. 빌드(배포): VITE_MOCK=on일 때만 켭니다. src/main.tsx와 같은 조건 */
export const mockEnabled = import.meta.env.DEV
  ? import.meta.env.VITE_MOCK !== 'off'
  : import.meta.env.VITE_MOCK === 'on'
