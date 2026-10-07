import { endpoints } from '@/api/endpoints'
import type { MockAuction } from '@/mocks/data/auctions'
import { auctions, statusOf, toListItem } from '@/mocks/data/auctions'
import { mockEndpoint, pageParams, paginate } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

/*
 * [ASSUMED] 명세에 없는 엔드포인트의 목 핸들러.
 * 백엔드에 API가 생기면 명세에 맞춰 스키마를 고치고 이 파일에서 옮기세요.
 */

/** 홈 목록에 나오는 경매. '나에게 딱 맞는 상품' · '지금 인기 있는 경매' 모두 이 4개입니다. */
const HOME_IDS = [1, 2, 3, 4]

const SORTERS: Record<string, (x: MockAuction, y: MockAuction) => number> = {
  /** 관심 수가 같으면 먼저 등록된 순 */
  popular: (x, y) => y.likeCount - x.likeCount || x.auctionId - y.auctionId,
  latest: (x, y) => y.auctionId - x.auctionId,
}

export const assumedAuctionHandlers = [
  // [ASSUMED] GET /api/auctions — 홈 상품 목록. 경매 예정 · 진행 중 · 종료(취소 제외)
  // 나머지 목 경매(11~22)는 상세 · 결과 화면 테스트용이라 목록에는 넣지 않습니다.
  mockEndpoint(endpoints.getAuctions, {
    error: mockErrors.INVALID_REQUEST,
    empty: ({ query, ok }) => ok({ items: [], ...pageParams(query), hasNext: false }),
    resolve: ({ query, ok }) => {
      const sort = query.get('sort') ?? 'popular'
      // 등록한 상품도 목록에 보이도록 홈 4개 + 목에서 새로 만든 경매(id 100~)를 씁니다.
      const visible = auctions.filter(
        (a) => (HOME_IDS.includes(a.auctionId) || a.auctionId >= 100) && statusOf(a) !== 'CANCELED',
      )
      const sorted =
        sort === 'recommended'
          ? HOME_IDS.map((id) => visible.find((a) => a.auctionId === id)).filter(
              (a): a is MockAuction => !!a,
            )
          : [...visible].sort(SORTERS[sort] ?? SORTERS.popular)
      const { page, size } = pageParams(query)
      return ok(paginate(sorted.map(toListItem), page, size))
    },
  }),
]
