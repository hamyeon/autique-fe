import { endpoints } from '@/api/endpoints'
import { auctions, statusOf, toListItem } from '@/mocks/data/auctions'
import { mockEndpoint, pageParams, paginate } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

/*
 * [ASSUMED] 명세에 없는 엔드포인트의 목 핸들러.
 * 백엔드에 API가 생기면 명세에 맞춰 스키마를 고치고 이 파일에서 옮기세요.
 */

export const assumedAuctionHandlers = [
  // [ASSUMED] GET /api/auctions — 홈 상품 목록. 예정 · 진행 중인 경매만, 인기순(관심 수) / 최신순(등록 역순)
  mockEndpoint(endpoints.getAuctions, {
    error: mockErrors.INVALID_REQUEST,
    empty: ({ query, ok }) => ok({ items: [], ...pageParams(query), hasNext: false }),
    resolve: ({ query, ok }) => {
      const open = auctions.filter((a) => ['SCHEDULED', 'LIVE'].includes(statusOf(a)))
      const sorted =
        query.get('sort') === 'latest'
          ? [...open].sort((x, y) => y.auctionId - x.auctionId)
          : [...open].sort((x, y) => y.likeCount - x.likeCount)
      const { page, size } = pageParams(query)
      return ok(paginate(sorted.map(toListItem), page, size))
    },
  }),
]
