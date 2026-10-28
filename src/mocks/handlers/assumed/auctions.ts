import { endpoints } from '@/api/endpoints'
import type { MockAuction } from '@/mocks/data/auctions'
import { auctions, isSeller, statusOf, toListItem } from '@/mocks/data/auctions'
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
      const keyword = query.get('keyword')?.trim().toLowerCase()
      // 등록한 상품도 목록에 보이도록 홈 4개 + 목에서 새로 만든 경매(id 100~)를 씁니다.
      // [ASSUMED] 검색어가 있으면 취소되지 않은 모든 경매에서 브랜드 · 상품명 · 영문명에 검색어가 들어간 것만(대소문자 무시)
      const visible = auctions.filter((a) => {
        if (statusOf(a) === 'CANCELED') return false
        if (!keyword) return HOME_IDS.includes(a.auctionId) || a.auctionId >= 100
        const { brand, name, subName } = a.product
        return [brand, name, subName].some((text) => text.toLowerCase().includes(keyword))
      })
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

  // [ASSUMED] GET /api/me/auctions — 내가 판매자로 올린 경매. ONGOING = 예정 + 진행 중, ENDED = 종료 + 취소, 최근 등록순
  mockEndpoint(endpoints.getMyAuctions, {
    error: mockErrors.INVALID_REQUEST,
    empty: ({ query, ok }) => ok({ items: [], ...pageParams(query), hasNext: false }),
    resolve: ({ query, ok }) => {
      const ongoing = query.get('status') !== 'ENDED'
      const mine = auctions
        .filter((a) => isSeller(a))
        .filter((a) => ['SCHEDULED', 'LIVE'].includes(statusOf(a)) === ongoing)
        .sort(SORTERS.latest)
      const { page, size } = pageParams(query)
      return ok(paginate(mine.map(toListItem), page, size))
    },
  }),
  // [ASSUMED] GET /api/me/likes — 관심 등록한 경매. 목 데이터에 등록 시각이 없어 최근 등록된 경매순
  mockEndpoint(endpoints.getLikedAuctions, {
    error: mockErrors.INVALID_REQUEST,
    empty: ({ query, ok }) => ok({ items: [], ...pageParams(query), hasNext: false }),
    resolve: ({ query, ok }) => {
      const liked = auctions.filter((a) => a.isLiked).sort(SORTERS.latest)
      const { page, size } = pageParams(query)
      return ok(paginate(liked.map(toListItem), page, size))
    },
  }),
]
