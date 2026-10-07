import type { z } from 'zod'
import * as auctions from '@/api/schemas/auctions'
import * as auth from '@/api/schemas/auth'
import * as autoBids from '@/api/schemas/auto-bids'
import * as backupOffers from '@/api/schemas/backup-offers'
import * as me from '@/api/schemas/me'
import * as notifications from '@/api/schemas/notifications'
import * as orders from '@/api/schemas/orders'
import * as products from '@/api/schemas/products'

/*
 * 엔드포인트 목록. 메서드·경로·스키마는 노션 명세 그대로입니다.
 * API 함수(src/api/<domain>.ts), MSW 목(src/mocks/), passthrough 설정이 모두 이 목록을 씁니다.
 */

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface EndpointDef {
  method: HttpMethod
  /** 명세 표기 그대로. 경로 변수는 {name} */
  path: string
  /** data 부분 스키마 */
  response: z.ZodType
  /** JSON 요청 body 스키마 */
  request?: z.ZodType
  /** 쿼리 파라미터 스키마 */
  query?: z.ZodType
  /** multipart/form-data 요청 */
  multipart?: true
  /** required: 로그인 필요 / optional: 로그인 시 선택 전달 / none: Authorization 헤더를 보내지 않음 */
  auth: 'required' | 'optional' | 'none'
  /** Idempotency-Key 헤더 필수 */
  idempotent?: true
  /** 기본 10초 */
  timeoutMs?: number
}

function endpoint<const D extends EndpointDef>(def: D) {
  return def
}

/** AI 분석·시세 조회처럼 서버가 외부 호출을 기다리는 요청 */
const SLOW_TIMEOUT_MS = 30_000

export const endpoints = {
  /* ───────── 인증 ───────── */
  kakaoLogin: endpoint({
    method: 'POST',
    path: '/api/auth/kakao',
    request: auth.kakaoLoginRequestSchema,
    response: auth.authTokensSchema,
    auth: 'none',
  }),
  refreshToken: endpoint({
    method: 'POST',
    path: '/api/auth/refresh',
    request: auth.refreshTokenRequestSchema,
    response: auth.refreshTokenResponseSchema,
    auth: 'none',
  }),
  logout: endpoint({
    method: 'POST',
    path: '/api/auth/logout',
    request: auth.logoutRequestSchema,
    response: auth.logoutResponseSchema,
    auth: 'none',
  }),

  /* ───────── 상품 등록 (AI 분석 · 시세) ───────── */
  analyzeProduct: endpoint({
    method: 'POST',
    path: '/api/products/analyze',
    multipart: true,
    response: products.analyzeProductResponseSchema,
    auth: 'optional', // [ASSUMED] 명세에 Authorization 헤더 표기가 없어 로그인 상태면 토큰만 실어 보냄
    timeoutMs: SLOW_TIMEOUT_MS,
  }),
  getProductAnalysis: endpoint({
    method: 'GET',
    path: '/api/products/analyze/{taskId}',
    response: products.productAnalysisSchema,
    auth: 'optional', // [ASSUMED] 명세에 Authorization 헤더 표기가 없음
  }),
  calculatePrice: endpoint({
    method: 'POST',
    path: '/api/products/calculate-price',
    request: products.calculatePriceRequestSchema,
    response: products.calculatePriceResponseSchema,
    auth: 'optional', // [ASSUMED] 명세에 Authorization 헤더 표기가 없음
    timeoutMs: SLOW_TIMEOUT_MS,
  }),
  createProduct: endpoint({
    method: 'POST',
    path: '/api/products',
    request: products.createProductRequestSchema,
    response: products.createProductResponseSchema,
    auth: 'required',
  }),

  /* ───────── 경매 ───────── */
  // [ASSUMED] 명세에 없는 엔드포인트. 홈 상품 목록용
  getAuctions: endpoint({
    method: 'GET',
    path: '/api/auctions',
    query: auctions.auctionListQuerySchema,
    response: auctions.auctionListSchema,
    auth: 'optional',
  }),
  getAuctionDetail: endpoint({
    method: 'GET',
    path: '/api/auctions/{auctionId}',
    response: auctions.auctionDetailSchema,
    auth: 'optional',
  }),
  getAuctionBids: endpoint({
    method: 'GET',
    path: '/api/auctions/{auctionId}/bids',
    query: auctions.bidListQuerySchema,
    response: auctions.bidListSchema,
    auth: 'optional',
  }),
  placeBid: endpoint({
    method: 'POST',
    path: '/api/auctions/{auctionId}/bids',
    request: auctions.placeBidRequestSchema,
    response: auctions.placeBidResponseSchema,
    auth: 'required',
    idempotent: true,
  }),
  getAuctionLive: endpoint({
    method: 'GET',
    path: '/api/auctions/{auctionId}/live',
    response: auctions.auctionLiveSchema,
    auth: 'required',
  }),
  getAutoBidRecommendation: endpoint({
    method: 'GET',
    path: '/api/auctions/{auctionId}/auto-bid/recommendation',
    response: auctions.autoBidRecommendationSchema,
    auth: 'required',
  }),
  getAuctionResult: endpoint({
    method: 'GET',
    path: '/api/auctions/{auctionId}/result',
    response: auctions.auctionResultSchema,
    auth: 'required',
  }),
  forfeitAward: endpoint({
    method: 'POST',
    path: '/api/auctions/{auctionId}/award/forfeit',
    response: auctions.forfeitAwardResponseSchema,
    auth: 'required',
  }),
  getSimilarAuctions: endpoint({
    method: 'GET',
    path: '/api/auctions/{auctionId}/similar',
    response: auctions.similarAuctionsSchema,
    auth: 'optional',
  }),
  likeAuction: endpoint({
    method: 'POST',
    path: '/api/auctions/{auctionId}/likes',
    response: auctions.auctionLikeResponseSchema,
    auth: 'required',
  }),
  unlikeAuction: endpoint({
    method: 'DELETE',
    path: '/api/auctions/{auctionId}/likes',
    response: auctions.auctionLikeResponseSchema,
    auth: 'required',
  }),
  relistAuction: endpoint({
    method: 'POST',
    path: '/api/auctions/{previousAuctionId}/relist',
    request: auctions.relistAuctionRequestSchema,
    response: auctions.relistAuctionResponseSchema,
    auth: 'required',
  }),
  cancelAuction: endpoint({
    method: 'POST',
    path: '/api/auctions/{auctionId}/cancel',
    response: auctions.cancelAuctionResponseSchema,
    auth: 'required',
  }),
  updateStartPrice: endpoint({
    method: 'PATCH',
    path: '/api/auctions/{auctionId}/start-price',
    request: auctions.updateStartPriceRequestSchema,
    response: auctions.updateStartPriceResponseSchema,
    auth: 'required',
  }),

  /* ───────── 자동입찰 ───────── */
  createAutoBid: endpoint({
    method: 'POST',
    path: '/api/auctions/{auctionId}/auto-bids',
    request: autoBids.createAutoBidRequestSchema,
    response: autoBids.createAutoBidResponseSchema,
    auth: 'required',
    idempotent: true,
  }),
  getMyAutoBid: endpoint({
    method: 'GET',
    path: '/api/auctions/{auctionId}/auto-bids/me',
    response: autoBids.myAutoBidSchema,
    auth: 'required',
  }),
  updateMyAutoBid: endpoint({
    method: 'PATCH',
    path: '/api/auctions/{auctionId}/auto-bids/me',
    request: autoBids.updateAutoBidRequestSchema,
    response: autoBids.updateAutoBidResponseSchema,
    auth: 'required',
    idempotent: true,
  }),
  cancelMyAutoBid: endpoint({
    method: 'DELETE',
    path: '/api/auctions/{auctionId}/auto-bids/me',
    response: autoBids.cancelAutoBidResponseSchema,
    auth: 'required',
  }),

  /* ───────── 주문 · 결제 ───────── */
  getOrder: endpoint({
    method: 'GET',
    path: '/api/orders/{orderId}',
    response: orders.orderSchema,
    auth: 'required',
  }),
  payOrder: endpoint({
    method: 'POST',
    path: '/api/orders/{orderId}/pay',
    response: orders.payOrderResponseSchema,
    auth: 'required',
  }),

  /* ───────── 내 정보 ───────── */
  getMyPenalties: endpoint({
    method: 'GET',
    path: '/api/me/penalties',
    response: me.myPenaltiesSchema,
    auth: 'required',
  }),

  /* ───────── 차순위 구매 ───────── */
  getBackupOffer: endpoint({
    method: 'GET',
    path: '/api/backup-offers/{backupOfferId}',
    response: backupOffers.backupOfferSchema,
    auth: 'required',
  }),
  acceptBackupOffer: endpoint({
    method: 'POST',
    path: '/api/backup-offers/{backupOfferId}/accept',
    response: backupOffers.acceptBackupOfferResponseSchema,
    auth: 'required',
    idempotent: true,
  }),
  declineBackupOffer: endpoint({
    method: 'POST',
    path: '/api/backup-offers/{backupOfferId}/decline',
    response: backupOffers.declineBackupOfferResponseSchema,
    auth: 'required',
  }),

  /* ───────── 알림 ───────── */
  getNotifications: endpoint({
    method: 'GET',
    path: '/api/notifications',
    query: notifications.notificationListQuerySchema,
    response: notifications.notificationListSchema,
    auth: 'required',
  }),
  readNotification: endpoint({
    method: 'PATCH',
    path: '/api/notifications/{notificationId}/read',
    response: notifications.readNotificationResponseSchema,
    auth: 'required',
  }),
  getUnreadNotificationCount: endpoint({
    method: 'GET',
    path: '/api/notifications/unread-count',
    response: notifications.unreadNotificationCountSchema,
    auth: 'required',
  }),
} as const

export type Endpoints = typeof endpoints
export type AnyEndpoint = Endpoints[keyof Endpoints]

/** 'POST /api/products', 'GET /api/auctions/{auctionId}' 처럼 메서드 + 경로 */
export type EndpointKey = {
  [K in keyof Endpoints]: `${Endpoints[K]['method']} ${Endpoints[K]['path']}`
}[keyof Endpoints]

export function endpointKey(def: Pick<EndpointDef, 'method' | 'path'>) {
  return `${def.method} ${def.path}` as EndpointKey
}
