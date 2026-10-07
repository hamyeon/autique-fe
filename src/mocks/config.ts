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
 * ]
 */
export const passthrough: EndpointKey[] = [
  // 실제 토큰(.env.local 개발용 토큰)을 재발급 · 무효화하려면 실제 서버로
  'POST /api/auth/refresh',
  'POST /api/auth/logout',
  // 경매 등록: AI 분석 · 가격 계산 · 등록은 실제 서버로
  'POST /api/products/analyze',
  'GET /api/products/analyze/{taskId}',
  'POST /api/products/calculate-price',
  // 등록 제출. 서명 쿼리를 뗀 이미지 주소를 보내 실서버 등록 성공(2026-10-07, src/features/register/submit.ts)
  'POST /api/products',
]

/** 개발: VITE_MOCK이 off가 아니면 켭니다. 빌드(배포): VITE_MOCK=on일 때만 켭니다. src/main.tsx와 같은 조건 */
export const mockEnabled = import.meta.env.DEV
  ? import.meta.env.VITE_MOCK !== 'off'
  : import.meta.env.VITE_MOCK === 'on'
