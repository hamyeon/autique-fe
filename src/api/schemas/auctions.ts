import { z } from 'zod'
import {
  auctionStatusSchema,
  autoBidStatusSchema,
  cannotBidReasonSchema,
  conditionGradeSchema,
  dateTimeSchema,
  pageMetaSchema,
  pageQuerySchema,
  productSummarySchema,
} from '@/api/schemas/common'

/* ───────── GET /api/auctions/{auctionId} ───────── */

export const auctionMyStateSchema = z.object({
  isSeller: z.boolean(),
  isHighestBidder: z.boolean(),
  /** 입찰 버튼 자체를 눌러도 되는가 (금액 검증은 포함하지 않음) */
  canBid: z.boolean(),
  cannotBidReason: cannotBidReasonSchema.nullish(),
  /** 페널티일 때만 값이 있음 */
  bidRestrictedUntil: dateTimeSchema.nullish(),
  autoBidStatus: autoBidStatusSchema.nullish(),
  autoBidCap: z.number().int().nullish(),
})
export type AuctionMyState = z.infer<typeof auctionMyStateSchema>

export const auctionDetailSchema = z.object({
  auctionId: z.number().int(),
  status: auctionStatusSchema,
  product: z.object({
    productId: z.number().int(),
    name: z.string(),
    brand: z.string(),
    subName: z.string(),
    /** 명세 설명은 A / B / C. 등록 시 DS·S·UNKNOWN도 고를 수 있어 등급 enum 전체를 허용합니다. */
    grade: conditionGradeSchema,
    imageUrls: z.array(z.string()),
  }),
  seller: z.object({
    sellerId: z.number().int(),
    nickname: z.string(),
    profileImageUrl: z.string().nullish(),
    completedSalesCount: z.number().int(),
  }),
  description: z.string(),
  startPrice: z.number().int(),
  currentPrice: z.number().int(),
  bidIncrement: z.number().int(),
  minNextBidAmount: z.number().int(),
  minCapAmount: z.number().int(),
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
  serverTime: dateTimeSchema,
  aiEstimatedPrice: z.number().int().nullish(),
  aiRecommendedAutoBidCap: z.number().int().nullish(),
  aiPriceReason: z.string().nullish(),
  bidCount: z.number().int(),
  isLiked: z.boolean(),
  likeCount: z.number().int(),
  myState: auctionMyStateSchema,
  /** ENDED에서만 */
  finalPrice: z.number().int().nullish(),
})
export type AuctionDetail = z.infer<typeof auctionDetailSchema>

/* ───────── GET /api/auctions/{auctionId}/bids ───────── */

export const bidOrderSchema = z.enum(['latest', 'oldest'])
export type BidOrder = z.infer<typeof bidOrderSchema>

export const bidListQuerySchema = pageQuerySchema.extend({
  /** 기본 latest */
  order: bidOrderSchema.optional(),
})
export type BidListQuery = z.infer<typeof bidListQuerySchema>

export const bidTypeSchema = z.enum(['MANUAL', 'AUTO'])
export type BidType = z.infer<typeof bidTypeSchema>

export const bidSchema = z.object({
  bidId: z.number().int(),
  bidderMasked: z.string(),
  isMine: z.boolean(),
  amount: z.number().int(),
  bidType: bidTypeSchema,
  bidAt: dateTimeSchema,
  isHighest: z.boolean(),
})
export type Bid = z.infer<typeof bidSchema>

export const bidListSchema = pageMetaSchema.extend({
  bids: z.array(bidSchema),
})
export type BidList = z.infer<typeof bidListSchema>

/* ───────── POST /api/auctions/{auctionId}/bids (Idempotency-Key) ───────── */

export const placeBidRequestSchema = z.object({
  /** amount >= minNextBidAmount 이고 (amount - currentPrice) % bidIncrement == 0 */
  amount: z.number().int().positive(),
})
export type PlaceBidRequest = z.infer<typeof placeBidRequestSchema>

export const placeBidResponseSchema = z.object({
  bidId: z.number().int(),
  submittedAmount: z.number().int(),
  currentPrice: z.number().int(),
  minNextBidAmount: z.number().int(),
  highestBidderMasked: z.string(),
  isHighestBidder: z.boolean(),
  autoBidCanceled: z.boolean(),
  proxyResponded: z.boolean(),
  endsAt: dateTimeSchema,
  extensionCount: z.number().int(),
})
export type PlaceBidResponse = z.infer<typeof placeBidResponseSchema>

/* ───────── GET /api/auctions/{auctionId}/live ───────── */

export const auctionLiveSchema = z.object({
  auctionId: z.number().int(),
  status: auctionStatusSchema,
  currentPrice: z.number().int(),
  minNextBidAmount: z.number().int(),
  bidIncrement: z.number().int(),
  highestBidderMasked: z.string().nullish(),
  isMine: z.boolean(),
  canBid: z.boolean(),
  cannotBidReason: cannotBidReasonSchema.nullish(),
  bidRestrictedUntil: dateTimeSchema.nullish(),
  endsAt: dateTimeSchema,
  serverTime: dateTimeSchema,
  extensionCount: z.number().int(),
  maxExtensions: z.number().int(),
  myAutoBidStatus: autoBidStatusSchema.nullish(),
  myCap: z.number().int().nullish(),
  minCapAmount: z.number().int(),
})
export type AuctionLive = z.infer<typeof auctionLiveSchema>

/* ───────── GET /api/auctions/{auctionId}/auto-bid/recommendation ───────── */

export const autoBidRecommendationSchema = z.object({
  auctionId: z.number().int(),
  /** stepper 초기값 */
  aiRecommendedCap: z.number().int(),
  currentPrice: z.number().int(),
  /** stepper 하한 */
  minCapAmount: z.number().int(),
  bidIncrement: z.number().int(),
})
export type AutoBidRecommendation = z.infer<typeof autoBidRecommendationSchema>

/* ───────── GET /api/auctions/{auctionId}/result ───────── */

export const auctionResultTypeSchema = z.enum([
  'NO_BIDS',
  'WON',
  'LOST',
  'BACKUP_WAITING',
  'FORFEITED',
  'PAYMENT_EXPIRED',
])
export type AuctionResultType = z.infer<typeof auctionResultTypeSchema>

export const auctionResultSchema = z.object({
  auctionId: z.number().int(),
  result: auctionResultTypeSchema,
  product: productSummarySchema,
  rank: z.number().int().nullish(),
  finalPrice: z.number().int().nullish(),
  myLastBidAmount: z.number().int().nullish(),
  /** WON일 때 */
  shippingFee: z.number().int().nullish(),
  totalAmount: z.number().int().nullish(),
  paymentDeadline: dateTimeSchema.nullish(),
  serverTime: dateTimeSchema,
  /** WON일 때만 */
  orderId: z.number().int().nullish(),
  /** BACKUP_WAITING일 때만 */
  backupOfferId: z.number().int().nullish(),
  backupEligible: z.boolean(),
})
export type AuctionResult = z.infer<typeof auctionResultSchema>

/* ───────── POST /api/auctions/{auctionId}/award/forfeit ───────── */

export const forfeitAwardResponseSchema = z.object({
  auctionId: z.number().int(),
  result: z.literal('FORFEITED'),
})
export type ForfeitAwardResponse = z.infer<typeof forfeitAwardResponseSchema>

/* ───────── 경매 카드 (목록 · 인기 · 추천 · 비슷한 상품 · 마이페이지 목록 공통 항목) ───────── */

export const auctionCardSchema = z.object({
  auctionId: z.number().int(),
  productId: z.number().int(),
  brand: z.string().nullish(),
  /** 상품 표시명 */
  name: z.string(),
  /** 대표 이미지 서명 URL. 이미지가 없으면 null */
  thumbnailUrl: z.string().nullish(),
  /** 홈 · 상품 찾기는 SCHEDULED / LIVE만. 마이페이지 목록은 ENDED / CANCELED도 */
  status: auctionStatusSchema,
  /** 저장된 상품 등급 */
  grade: conditionGradeSchema.nullish(),
  startPrice: z.number().int(),
  /** 현재 경매가. 내 입찰가 · 자동입찰 상한 · 결제 금액이 아님 */
  currentPrice: z.number().int(),
  likeCount: z.number().int(),
  /** 비로그인이면 false */
  isLiked: z.boolean(),
})
export type AuctionCard = z.infer<typeof auctionCardSchema>

/* ───────── GET /api/auctions/{auctionId}/similar ───────── */

/** 같은 브랜드의 예정 · 진행 중 경매 최대 4개 */
export const similarAuctionSchema = auctionCardSchema.extend({
  brand: z.string(),
  /** 호환용 가격 필드. currentPrice와 같음 */
  price: z.number().int(),
})
export type SimilarAuction = z.infer<typeof similarAuctionSchema>

export const similarAuctionsSchema = z.object({
  items: z.array(similarAuctionSchema),
})
export type SimilarAuctions = z.infer<typeof similarAuctionsSchema>

/* ───────── POST · DELETE /api/auctions/{auctionId}/likes ───────── */

export const auctionLikeResponseSchema = z.object({
  liked: z.boolean(),
  likeCount: z.number().int(),
})
export type AuctionLikeResponse = z.infer<typeof auctionLikeResponseSchema>

/* ───────── POST /api/auctions/{previousAuctionId}/relist ───────── */

const HOUR_MS = 60 * 60 * 1000

export const relistAuctionRequestSchema = z
  .object({
    startPrice: z.number().int().positive(),
    /** ISO-8601, 오프셋 포함 */
    startAt: z.iso.datetime({ offset: true }),
    /** 시작 시각으로부터 최소 1시간 뒤 */
    endAt: z.iso.datetime({ offset: true }),
  })
  .refine((v) => Date.parse(v.endAt) - Date.parse(v.startAt) >= HOUR_MS, {
    path: ['endAt'],
    message: '경매 진행 시간은 최소 1시간이어야 합니다.',
  })
export type RelistAuctionRequest = z.infer<typeof relistAuctionRequestSchema>

export const relistAuctionResponseSchema = z.object({
  auctionId: z.number().int(),
  previousAuctionId: z.number().int(),
  productId: z.number().int(),
  startPrice: z.number().int(),
  bidIncrement: z.number().int(),
  startAt: dateTimeSchema,
  endAt: dateTimeSchema,
  status: auctionStatusSchema,
})
export type RelistAuctionResponse = z.infer<typeof relistAuctionResponseSchema>

/* ───────── POST /api/auctions/{auctionId}/cancel ───────── */

export const cancelAuctionResponseSchema = z.object({
  auctionId: z.number().int(),
  status: z.literal('CANCELED'),
})
export type CancelAuctionResponse = z.infer<typeof cancelAuctionResponseSchema>

/* ───────── PATCH /api/auctions/{auctionId}/start-price ───────── */

export const updateStartPriceRequestSchema = z.object({
  startPrice: z.number().int().positive('시작가는 0보다 커야 합니다.'),
})
export type UpdateStartPriceRequest = z.infer<typeof updateStartPriceRequestSchema>

export const updateStartPriceResponseSchema = z.object({
  auctionId: z.number().int(),
  startPrice: z.number().int(),
})
export type UpdateStartPriceResponse = z.infer<typeof updateStartPriceResponseSchema>

/* ───────── GET /api/auctions (상품 찾기 기본 목록) ───────── */

/** 예정 · 진행 중 경매. 정렬은 경매 생성 최신순 고정이고 정렬 · 검색 · 필터 파라미터는 없습니다. */
export const auctionListQuerySchema = pageQuerySchema.extend({
  /** 1~50, 기본 20 */
  size: z.number().int().min(1).max(50).optional(),
})
export type AuctionListQuery = z.infer<typeof auctionListQuerySchema>

export const auctionListItemSchema = auctionCardSchema
export type AuctionListItem = z.infer<typeof auctionListItemSchema>

/** 전체 개수는 주지 않습니다. 마지막 페이지를 넘겨도 빈 목록 */
export const auctionListSchema = pageMetaSchema.extend({
  items: z.array(auctionListItemSchema),
})
export type AuctionList = z.infer<typeof auctionListSchema>

/* ───────── GET /api/auctions/popular (홈 '지금 인기 있는 경매') ───────── */

export const popularAuctionsQuerySchema = z.object({
  /** 1~20, 기본 4 */
  limit: z.number().int().min(1).max(20).optional(),
})
export type PopularAuctionsQuery = z.infer<typeof popularAuctionsQuerySchema>

/** 실제 입찰 기록 수 많은 순(관심 수 아님). 대상이 부족하면 있는 만큼만 */
export const popularAuctionsSchema = z.object({
  items: z.array(auctionCardSchema),
})
export type PopularAuctions = z.infer<typeof popularAuctionsSchema>

/* ───────── GET /api/recommendations/auctions (홈 '나에게 딱 맞는 상품') ───────── */

export const recommendedAuctionsQuerySchema = z.object({
  /** 기본 10, 최대 50(넘으면 50, 0 이하면 10으로 보정) */
  limit: z.number().int().optional(),
})
export type RecommendedAuctionsQuery = z.infer<typeof recommendedAuctionsQuerySchema>

export const recommendedAuctionSchema = auctionCardSchema.extend({
  model: z.string().nullish(),
  colorway: z.string().nullish(),
  sizeKr: z.number().int().nullish(),
  /** 오프셋 없는 서울 시각 문자열('2026-11-07T22:00'). 다른 API와 형식이 다름 */
  endAt: z.string(),
  /** 취향 유사도. 대체 추천이면 null */
  similarity: z.number().nullish(),
})
export type RecommendedAuction = z.infer<typeof recommendedAuctionSchema>

/** 로그인 · 행동 로그가 충분하면 개인화(personalized=true), 아니면 마감 임박 · 인기 경매를 섞은 대체 추천 */
export const recommendedAuctionsSchema = z.object({
  personalized: z.boolean(),
  /** 추천 근거 문구 */
  reason: z.string(),
  items: z.array(recommendedAuctionSchema),
})
export type RecommendedAuctions = z.infer<typeof recommendedAuctionsSchema>

/* ───────── GET /api/me/auctions · GET /api/me/selling-auctions · GET /api/me/likes ───────── */

/** current: 예정 · 진행 중(SCHEDULED · LIVE) / past: 종료 · 취소(ENDED · CANCELED). 기본 current */
export const myAuctionStateSchema = z.enum(['current', 'past'])
export type MyAuctionState = z.infer<typeof myAuctionStateSchema>

/**
 * 참여 경매(/api/me/auctions: 내 실제 입찰이 있거나 취소되지 않은 자동입찰이 있는 경매) ·
 * 판매 경매(/api/me/selling-auctions: 내가 판매 등록한 경매) 공통 쿼리. 둘 다 경매 생성 최신순
 */
export const myAuctionListQuerySchema = auctionListQuerySchema.extend({
  state: myAuctionStateSchema.optional(),
})
export type MyAuctionListQuery = z.infer<typeof myAuctionListQuerySchema>

/** 관심 목록. 종료 · 취소 경매도 포함, 관심 등록 최신순 */
export const likedAuctionListQuerySchema = auctionListQuerySchema
export type LikedAuctionListQuery = z.infer<typeof likedAuctionListQuerySchema>
