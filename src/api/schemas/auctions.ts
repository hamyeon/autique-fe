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

/* ───────── GET /api/auctions/{auctionId}/similar ───────── */

export const similarAuctionSchema = z.object({
  productId: z.number().int(),
  auctionId: z.number().int(),
  brand: z.string(),
  name: z.string(),
  thumbnailUrl: z.string(),
  /** 현재가 */
  price: z.number().int(),
  likeCount: z.number().int(),
  isLiked: z.boolean(),
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

/* ───────── GET /api/auctions (경매 목록) ───────── */

// [ASSUMED] 명세에 경매 목록 API가 없습니다. 홈 '인기순 · 최신순' 상품 목록에 필요해 만들었습니다.
export const auctionSortSchema = z.enum(['popular', 'latest']) // [ASSUMED] 정렬 값 이름. 홈 SortTabs(인기순 · 최신순)에 맞춤
export type AuctionSort = z.infer<typeof auctionSortSchema>

// [ASSUMED] 쿼리 형태. 입찰 이력의 page/size 규칙을 따름
export const auctionListQuerySchema = pageQuerySchema.extend({
  sort: auctionSortSchema.optional(),
})
export type AuctionListQuery = z.infer<typeof auctionListQuerySchema>

// [ASSUMED] 항목 필드는 '비슷한 상품 목록'(similar) 항목을 기준으로 하고, ProductCard에 필요한 값만 더했습니다.
export const auctionListItemSchema = similarAuctionSchema.extend({
  status: auctionStatusSchema, // [ASSUMED] ProductCard의 경매 예정 / LIVE 칩
  grade: conditionGradeSchema, // [ASSUMED] ProductCard의 등급 칩
  startsAt: dateTimeSchema, // [ASSUMED] 경매 예정 카드의 시작까지 남은 시간
  endsAt: dateTimeSchema, // [ASSUMED] LIVE 카드의 마감까지 남은 시간
})
export type AuctionListItem = z.infer<typeof auctionListItemSchema>

// [ASSUMED] 응답 형태. 입찰 이력·알림 목록과 같은 page/size/hasNext 구조
export const auctionListSchema = pageMetaSchema.extend({
  items: z.array(auctionListItemSchema),
})
export type AuctionList = z.infer<typeof auctionListSchema>
