import { endpoints } from '@/api/endpoints'
import { auctions, createAuctionId, createProductId } from '@/mocks/data/auctions'
import { ME, kst } from '@/mocks/data/common'
import {
  PRICE_RESULT,
  PRICE_RESULT_EMPTY,
  FAIL_AFTER_MS,
  SLOW_VISION_MS,
  analysisStatusOf,
  createAnalysis,
  findAnalysis,
  markPriced,
  toAnalysis,
} from '@/mocks/data/products'
import { idParam, mockEndpoint } from '@/mocks/define'
import { invalidAuctionTime, mockErrors } from '@/mocks/errors'

export const productHandlers = [
  /** 202 Accepted. images 파트가 없으면 40002. ?mock=slow · analysis-fail 일 때만 목(평소엔 실서버) */
  mockEndpoint(endpoints.analyzeProduct, {
    error: mockErrors.S3_UPLOAD_FAILED,
    mockIn: ['slow', 'analysis-fail'],
    resolve: ({ body, ok, fail, scenario }) => {
      const images = body.getAll('images').filter((v) => v instanceof File)
      if (images.length === 0) return fail(mockErrors.IMAGE_FILE_MISSING)
      const analysis = createAnalysis(images.length, {
        visionMs: scenario === 'slow' ? SLOW_VISION_MS : undefined,
        failAfterMs: scenario === 'analysis-fail' ? FAIL_AFTER_MS : null,
      })
      return ok({ analysisId: analysis.analysisId, status: 'QUEUED' }, 202)
    },
  }),

  mockEndpoint(endpoints.getProductAnalysis, {
    error: mockErrors.ANALYSIS_NOT_FOUND('999'),
    mockIn: ['slow', 'analysis-fail'],
    resolve: ({ params, ok, fail }) => {
      const analysis = findAnalysis(idParam(params, 'taskId'))
      if (!analysis) return fail(mockErrors.ANALYSIS_NOT_FOUND(params.taskId))
      return ok(toAnalysis(analysis))
    },
  }),

  /** AWAITING_USER_CONFIRMATION에서 세션당 1회만 */
  mockEndpoint(endpoints.calculatePrice, {
    error: mockErrors.ANALYSIS_STATUS_INVALID('VISION_PROCESSING'),
    // 분석을 목으로 하는 시나리오에서는 세션도 목에만 있으므로 가격 계산도 목으로
    mockIn: ['slow', 'analysis-fail'],
    empty: ({ ok }) => ok(PRICE_RESULT_EMPTY),
    resolve: ({ body, ok, fail }) => {
      const analysis = findAnalysis(body.analysisId)
      if (!analysis) return fail(mockErrors.ANALYSIS_NOT_FOUND(String(body.analysisId)))
      const status = analysisStatusOf(analysis)
      if (status !== 'AWAITING_USER_CONFIRMATION')
        return fail(mockErrors.ANALYSIS_STATUS_INVALID(status))
      markPriced(analysis)
      return ok(PRICE_RESULT)
    },
  }),

  /** 상품 + 첫 경매(SCHEDULED)를 함께 만들고 홈 목록에도 보이게 합니다. ?mock=submit-fail 이면 500 */
  mockEndpoint(endpoints.createProduct, {
    error: mockErrors.AUCTION_TIME_INVALID,
    invalid: invalidAuctionTime,
    mockIn: ['submit-fail'],
    resolve: ({ body, ok, fail, scenario }) => {
      if (scenario === 'submit-fail') return fail(mockErrors.INTERNAL_SERVER_ERROR)
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
