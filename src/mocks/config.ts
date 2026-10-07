import type { EndpointKey } from '@/api/endpoints'

/*
 * 목 설정.
 * - 목을 끄고 켜는 단위는 '메서드 + 경로'(명세 표기 그대로, 경로 변수는 {name})입니다.
 * - passthrough에 넣은 엔드포인트는 목 대신 실제 서버(VITE_API_BASE_URL)로 보냅니다.
 * - .env.local 의 VITE_MOCK=off 이면 MSW 전체가 꺼지고 모든 요청이 실제 서버로 갑니다.
 *
 * @example
 * export const passthrough: EndpointKey[] = [
 *   'POST /api/products',
 *   'POST /api/products/analyze',
 *   'GET /api/products/analyze/{taskId}',
 * ]
 */
export const passthrough: EndpointKey[] = []

/** 개발 모드이고 VITE_MOCK이 off가 아닐 때만 MSW를 켭니다. 빌드에서는 항상 false */
export const mockEnabled = import.meta.env.DEV && import.meta.env.VITE_MOCK !== 'off'
