import { endpoints } from '@/api/endpoints'
import { auctions, createAuctionId, createProductId } from '@/mocks/data/auctions'
import { ME, kst } from '@/mocks/data/common'
import {
  PRICE_RESULT,
  PRICE_RESULT_EMPTY,
  analysisStatusOf,
  createAnalysis,
  findAnalysis,
  toAnalysis,
} from '@/mocks/data/products'
import { idParam, mockEndpoint } from '@/mocks/define'
import { invalidAuctionTime, mockErrors } from '@/mocks/errors'

export const productHandlers = [
  /** 202 Accepted. images 파트가 없으면 40002 */
  mockEndpoint(endpoints.analyzeProduct, {
    error: mockErrors.S3_UPLOAD_FAILED,
    resolve: ({ body, ok, fail }) => {
      const images = body.getAll('images').filter((v) => v instanceof File)
      if (images.length === 0) return fail(mockErrors.IMAGE_FILE_MISSING)
      const analysis = createAnalysis(images.length)
      return ok({ analysisId: analysis.analysisId, status: 'QUEUED' }, 202)
    },
  }),

  mockEndpoint(endpoints.getProductAnalysis, {
    error: mockErrors.ANALYSIS_NOT_FOUND('999'),
    resolve: ({ params, ok, fail }) => {
      const analysis = findAnalysis(idParam(params, 'taskId'))
      if (!analysis) return fail(mockErrors.ANALYSIS_NOT_FOUND(params.taskId))
      return ok(toAnalysis(analysis))
    },
  }),

  /** AWAITING_USER_CONFIRMATION에서 세션당 1회만 */
  mockEndpoint(endpoints.calculatePrice, {
    error: mockErrors.ANALYSIS_STATUS_INVALID('VISION_PROCESSING'),
    empty: ({ ok }) => ok(PRICE_RESULT_EMPTY),
    resolve: ({ body, ok, fail }) => {
      const analysis = findAnalysis(body.analysisId)
      if (!analysis) return fail(mockErrors.ANALYSIS_NOT_FOUND(String(body.analysisId)))
      const status = analysisStatusOf(analysis)
      if (status !== 'AWAITING_USER_CONFIRMATION')
        return fail(mockErrors.ANALYSIS_STATUS_INVALID(status))
      analysis.priced = true
      return ok(PRICE_RESULT)
    },
  }),

  /** 상품 + 첫 경매(SCHEDULED)를 함께 만들고 홈 목록에도 보이게 합니다. */
  mockEndpoint(endpoints.createProduct, {
    error: mockErrors.AUCTION_TIME_INVALID,
    invalid: invalidAuctionTime,
    resolve: ({ body, ok }) => {
      const productId = createProductId()
      const auctionId = createAuctionId()
      const startsAt = Date.parse(body.auctionStartAt)
      const endsAt = Date.parse(body.auctionEndAt)
      auctions.unshift({
        auctionId,
        productId,
        sellerId: ME.userId,
        product: {
          name: `${body.brand} ${body.modelName} ${body.color}`,
          brand: body.brand,
          subName: `${body.brand} ${body.modelName} ${body.color}`,
          grade: body.conditionGrade,
          imageUrls: body.imageUrls,
        },
        description: body.sellerDescription ?? '',
        startPrice: body.auctionStartPrice,
        bidIncrement: 5000,
        startsAt,
        endsAt,
        canceled: false,
        aiEstimatedPrice: body.recommendedPrice,
        aiPriceReason: body.reason ?? null,
        likeCount: 0,
        isLiked: false,
        bids: [],
        extensionCount: 0,
        myAutoBid: null,
      })
      return ok({
        id: productId,
        sellerId: ME.userId,
        imageUrls: body.imageUrls,
        brand: body.brand,
        modelName: body.modelName,
        color: body.color,
        size: body.size,
        conditionGrade: body.conditionGrade,
        componentStatus: body.componentStatus,
        recommendedPrice: body.recommendedPrice,
        baseMarketPrice: body.baseMarketPrice ?? null,
        priceRange: body.priceRange ?? null,
        sellingPrice: body.sellingPrice,
        reason: body.reason ?? null,
        sellerDescription: body.sellerDescription ?? null,
        createdAt: kst(Date.now()).replace('+09:00', ''), // 명세 예시는 오프셋 없음
        auctionId,
        auctionStatus: 'SCHEDULED',
        auctionStartPrice: body.auctionStartPrice,
        bidIncrement: 5000,
        auctionStartAt: kst(startsAt),
        auctionEndAt: kst(endsAt),
      })
    },
  }),
]
