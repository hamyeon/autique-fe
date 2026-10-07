import type {
  AuctionDetail,
  AuctionListItem,
  AuctionLive,
  Bid,
  BidType,
  SimilarAuction,
} from '@/api/schemas/auctions'
import type {
  AuctionStatus,
  AutoBidStatus,
  CannotBidReason,
  ConditionGrade,
  ProductSummary,
} from '@/api/schemas/common'
import {
  BID_INCREMENT,
  DAY,
  HOUR,
  MAX_EXTENSIONS,
  ME,
  MINUTE,
  PRODUCT_IMAGES,
  SELLERS,
  fromNow,
  kst,
} from '@/mocks/data/common'
import { isBidRestricted, penaltyState } from '@/mocks/data/me'

/* 경매 목 데이터. 시각은 페이지를 연 시점 기준이라 LIVE 경매는 항상 진행 중입니다. */

export interface MockBid {
  bidId: number
  bidderMasked: string
  isMine: boolean
  amount: number
  bidType: BidType
  bidAt: number
}

export interface MockAutoBid {
  autoBidSettingId: number
  status: AutoBidStatus
  maxAmount: number
}

export interface MockAuction {
  auctionId: number
  productId: number
  sellerId: number
  product: {
    name: string
    brand: string
    subName: string
    grade: ConditionGrade
    imageUrls: string[]
  }
  description: string
  startPrice: number
  bidIncrement: number
  startsAt: number
  endsAt: number
  canceled: boolean
  aiEstimatedPrice: number | null
  aiPriceReason: string | null
  likeCount: number
  isLiked: boolean
  /** 최신순 */
  bids: MockBid[]
  extensionCount: number
  myAutoBid: MockAutoBid | null
}

let nextBidId = 100
export const createBidId = () => nextBidId++

let nextAutoBidSettingId = 20
export const createAutoBidSettingId = () => nextAutoBidSettingId++

let nextAuctionId = 100
export const createAuctionId = () => nextAuctionId++

let nextProductId = 100
export const createProductId = () => nextProductId++

/** 다른 사람 입찰 → 내 입찰 → 다른 사람 입찰 순으로 쌓인 입찰 이력을 만듭니다(최신순). */
function makeBids(
  amounts: { amount: number; mine?: boolean; auto?: boolean; bidder?: string }[],
  lastBidAt: number,
) {
  return amounts.map<MockBid>(({ amount, mine = false, auto = false, bidder = 'ham****' }, i) => ({
    bidId: createBidId(),
    bidderMasked: mine ? ME.masked : bidder,
    isMine: mine,
    amount,
    bidType: auto ? 'AUTO' : 'MANUAL',
    bidAt: lastBidAt - i * 3 * MINUTE,
  }))
}

function auction(
  partial: Pick<
    MockAuction,
    'auctionId' | 'sellerId' | 'product' | 'startPrice' | 'startsAt' | 'endsAt'
  > &
    Partial<MockAuction>,
): MockAuction {
  return {
    productId: partial.auctionId,
    description: '상품 상태가 완전히 좋습니다.',
    bidIncrement: BID_INCREMENT,
    canceled: false,
    aiEstimatedPrice: Math.round((partial.startPrice * 2) / BID_INCREMENT) * BID_INCREMENT,
    aiPriceReason: '유사 거래 데이터를 기반으로 산정했습니다.',
    likeCount: 0,
    isLiked: false,
    bids: [],
    extensionCount: 0,
    myAutoBid: null,
    ...partial,
  }
}

/** 홈 목록 상품. index번째 목 이미지를 대표 이미지로 씁니다. */
function homeProduct(
  index: number,
  brand: string,
  name: string,
  subName: string,
): MockAuction['product'] {
  return { name, brand, subName, grade: 'A', imageUrls: [PRODUCT_IMAGES[index]] }
}

/** 홈에 나오지 않는 경매(상세 · 결과 · 판매자 흐름 테스트용)는 목 이미지 4장을 모두 씁니다. */
const images = () => [...PRODUCT_IMAGES]

export const auctions: MockAuction[] = [
  // 11. LIVE · 다른 사람이 최고가 · 나도 입찰함
  auction({
    auctionId: 11,
    sellerId: 2,
    product: {
      name: '나이키 덩크 로우 레트로 블랙 화이트',
      brand: 'Nike',
      subName: 'Nike Dunk Low Retro Black White',
      grade: 'B',
      imageUrls: images(),
    },
    startPrice: 50000,
    startsAt: fromNow(-1 * HOUR),
    endsAt: fromNow(40 * MINUTE),
    likeCount: 312,
    bids: makeBids(
      [{ amount: 105000, auto: true }, { amount: 100000, mine: true }, { amount: 95000 }],
      fromNow(-2 * MINUTE),
    ),
  }),
  // 12. SCHEDULED · 명세 예시
  auction({
    auctionId: 12,
    sellerId: 2,
    product: {
      name: '아식스 노바블라스트 6 블랙 - 2E 와이드',
      brand: 'ASICS',
      subName: 'Asics Novablast 6 Black - 2E Wide',
      grade: 'A',
      imageUrls: images(),
    },
    startPrice: 50000,
    startsAt: fromNow(2.5 * HOUR),
    endsAt: fromNow(4.5 * HOUR),
    aiEstimatedPrice: 100000,
    likeCount: 132,
  }),
  // 13. ENDED · 내가 낙찰 (주문 50, 결제 대기)
  auction({
    auctionId: 13,
    sellerId: 3,
    product: {
      name: '뉴발란스 993 그레이',
      brand: 'New Balance',
      subName: 'New Balance 993 Grey',
      grade: 'A',
      imageUrls: images(),
    },
    startPrice: 80000,
    startsAt: fromNow(-5 * HOUR),
    endsAt: fromNow(-3 * HOUR),
    likeCount: 87,
    bids: makeBids([{ amount: 105000, mine: true }, { amount: 100000 }], fromNow(-3.1 * HOUR)),
  }),
  // 14. ENDED · 패찰(2위) · 차순위 후보
  auction({
    auctionId: 14,
    sellerId: 3,
    product: {
      name: '아디다스 삼바 OG 화이트',
      brand: 'adidas',
      subName: 'adidas Samba OG White',
      grade: 'B',
      imageUrls: images(),
    },
    startPrice: 70000,
    startsAt: fromNow(-6 * HOUR),
    endsAt: fromNow(-4 * HOUR),
    likeCount: 45,
    bids: makeBids([{ amount: 105000 }, { amount: 100000, mine: true }], fromNow(-4.1 * HOUR)),
  }),
  // 15. ENDED · 차순위 제안 생성됨 (제안 90)
  auction({
    auctionId: 15,
    sellerId: 2,
    product: {
      name: '살로몬 XT-6 블랙',
      brand: 'Salomon',
      subName: 'Salomon XT-6 Black',
      grade: 'A',
      imageUrls: images(),
    },
    startPrice: 80000,
    startsAt: fromNow(-1 * DAY - 2 * HOUR),
    endsAt: fromNow(-1 * DAY),
    likeCount: 210,
    bids: makeBids(
      [{ amount: 105000 }, { amount: 100000, mine: true }],
      fromNow(-1 * DAY - 5 * MINUTE),
    ),
  }),
  // 16. ENDED · 내가 낙찰했지만 결제 기한 만료 (주문 51)
  auction({
    auctionId: 16,
    sellerId: 3,
    product: {
      name: '아식스 젤 카야노 14 실버',
      brand: 'ASICS',
      subName: 'Asics Gel-Kayano 14 Silver',
      grade: 'C',
      imageUrls: images(),
    },
    startPrice: 60000,
    startsAt: fromNow(-3 * DAY - 2 * HOUR),
    endsAt: fromNow(-3 * DAY),
    likeCount: 19,
    bids: makeBids(
      [{ amount: 85000, mine: true }, { amount: 80000 }],
      fromNow(-3 * DAY - 5 * MINUTE),
    ),
  }),
  // 17. LIVE · 내가 판매자
  auction({
    auctionId: 17,
    sellerId: ME.userId,
    product: {
      name: '컨버스 척 70 하이 블랙',
      brand: 'Converse',
      subName: 'Converse Chuck 70 Hi Black',
      grade: 'A',
      imageUrls: images(),
    },
    startPrice: 40000,
    startsAt: fromNow(-30 * MINUTE),
    endsAt: fromNow(90 * MINUTE),
    likeCount: 23,
    bids: makeBids([{ amount: 50000 }, { amount: 45000, bidder: 'sne****' }], fromNow(-5 * MINUTE)),
  }),
  // 18. SCHEDULED · 내가 판매자 (취소 · 시작가 수정 가능)
  auction({
    auctionId: 18,
    sellerId: ME.userId,
    product: {
      name: '반스 올드스쿨 블랙',
      brand: 'Vans',
      subName: 'Vans Old Skool Black',
      grade: 'S',
      imageUrls: images(),
    },
    startPrice: 30000,
    startsAt: fromNow(3 * HOUR),
    endsAt: fromNow(5 * HOUR),
    likeCount: 8,
  }),
  // 19. ENDED · 내가 판매자 · 입찰 0건(유찰) → 재경매 가능
  auction({
    auctionId: 19,
    sellerId: ME.userId,
    product: {
      name: '오니츠카 타이거 멕시코 66 옐로우',
      brand: 'Onitsuka Tiger',
      subName: 'Onitsuka Tiger Mexico 66 Yellow',
      grade: 'A',
      imageUrls: images(),
    },
    startPrice: 90000,
    startsAt: fromNow(-2 * DAY - 2 * HOUR),
    endsAt: fromNow(-2 * DAY),
    likeCount: 4,
  }),
  // 20. LIVE · 내가 최고 입찰자 · 자동입찰 ACTIVE
  auction({
    auctionId: 20,
    sellerId: 3,
    product: {
      name: '나이키 에어포스 1 로우 화이트',
      brand: 'Nike',
      subName: "Nike Air Force 1 '07 Low White",
      grade: 'DS',
      imageUrls: images(),
    },
    startPrice: 60000,
    startsAt: fromNow(-50 * MINUTE),
    endsAt: fromNow(12 * MINUTE),
    likeCount: 301,
    bids: makeBids(
      [
        { amount: 90000, mine: true, auto: true },
        { amount: 85000 },
        { amount: 80000, mine: true, auto: true },
      ],
      fromNow(-1 * MINUTE),
    ),
    myAutoBid: { autoBidSettingId: 15, status: 'ACTIVE', maxAmount: 150000 },
  }),
  // 21. SCHEDULED · 비슷한 상품 예시
  auction({
    auctionId: 21,
    sellerId: 2,
    product: {
      name: '베이프 슬라이드 #1 블랙',
      brand: 'BAPE',
      subName: 'BAPE Slide #1 Black',
      grade: 'A',
      imageUrls: images(),
    },
    startPrice: 234000,
    startsAt: fromNow(1 * DAY),
    endsAt: fromNow(1 * DAY + 2 * HOUR),
    likeCount: 200,
    isLiked: false,
  }),
  // 22. LIVE
  auction({
    auctionId: 22,
    sellerId: 3,
    product: {
      name: '조던 1 로우 OG 시카고',
      brand: 'Jordan',
      subName: 'Jordan 1 Low OG Chicago',
      grade: 'B',
      imageUrls: images(),
    },
    startPrice: 120000,
    startsAt: fromNow(-20 * MINUTE),
    endsAt: fromNow(2 * HOUR),
    likeCount: 98,
    bids: makeBids([{ amount: 125000, bidder: 'sne****' }], fromNow(-10 * MINUTE)),
  }),
  /* ───────── 홈 목록 상품(나에게 딱 맞는 상품 · 지금 인기 있는 경매 모두 이 4개) ─────────
   * 금액 · 관심 수 · 등급은 홈 Figma(572:7790) 카드 값(234,000원 · 관심 556 · A등급)을 따릅니다. */
  // 1. 경매 예정
  auction({
    auctionId: 1,
    sellerId: 2,
    product: homeProduct(
      0,
      'Nike',
      '나이키 에어포스 1 로우 화이트',
      "Nike Air Force 1 '07 Low White",
    ),
    startPrice: 234000,
    startsAt: fromNow(2 * HOUR),
    endsAt: fromNow(4 * HOUR),
    likeCount: 556,
  }),
  // 2. LIVE · 최고가 234,000원
  auction({
    auctionId: 2,
    sellerId: 3,
    product: homeProduct(1, 'Salomon', '살로몬 XT-6 ADV 블랙', 'Salomon XT-6 ADV Black'),
    startPrice: 224000,
    startsAt: fromNow(-30 * MINUTE),
    endsAt: fromNow(90 * MINUTE),
    likeCount: 556,
    bids: makeBids(
      [{ amount: 234000 }, { amount: 229000, bidder: 'sne****' }],
      fromNow(-4 * MINUTE),
    ),
  }),
  // 3. 경매 예정
  auction({
    auctionId: 3,
    sellerId: 2,
    product: homeProduct(
      2,
      'Vans',
      '반스 x 베이프 프리미엄 뉴스쿨 카모 그린',
      'Vans x BAPE Premium Old Skool Camo Green',
    ),
    startPrice: 234000,
    startsAt: fromNow(5 * HOUR),
    endsAt: fromNow(7 * HOUR),
    likeCount: 556,
  }),
  // 4. 경매 종료 · 최종가 234,000원
  auction({
    auctionId: 4,
    sellerId: 3,
    product: homeProduct(
      3,
      'Nike',
      '나이키 덩크 로우 레트로 블랙 화이트',
      'Nike Dunk Low Retro Black White',
    ),
    startPrice: 224000,
    startsAt: fromNow(-1 * DAY - 2 * HOUR),
    endsAt: fromNow(-1 * DAY),
    likeCount: 556,
    bids: makeBids(
      [{ amount: 234000 }, { amount: 229000, bidder: 'sne****' }],
      fromNow(-1 * DAY - 5 * MINUTE),
    ),
  }),
]

/* ───────── 조회 · 계산 ───────── */

export function findAuction(auctionId: number) {
  const a = auctions.find((x) => x.auctionId === auctionId)
  // 시작 시각이 지나면 예약된 자동입찰을 켭니다.
  if (a && statusOf(a) === 'LIVE' && a.myAutoBid?.status === 'RESERVED') {
    a.myAutoBid.status = 'ACTIVE'
    runProxyBidding(a)
  }
  return a
}

export function statusOf(a: MockAuction): AuctionStatus {
  if (a.canceled) return 'CANCELED'
  const now = Date.now()
  if (now < a.startsAt) return 'SCHEDULED'
  if (now < a.endsAt) return 'LIVE'
  return 'ENDED'
}

export function currentPriceOf(a: MockAuction) {
  return a.bids[0]?.amount ?? a.startPrice
}

export function minNextBidOf(a: MockAuction) {
  return currentPriceOf(a) + a.bidIncrement
}

export function isSeller(a: MockAuction) {
  return a.sellerId === ME.userId
}

export function isMyHighest(a: MockAuction) {
  return a.bids[0]?.isMine ?? false
}

/** 경매 상세 myState · 실시간 상태 공통 규칙 */
export function cannotBidReasonOf(a: MockAuction): CannotBidReason | null {
  const status = statusOf(a)
  if (status === 'SCHEDULED') return 'AUCTION_NOT_STARTED'
  if (status !== 'LIVE') return 'AUCTION_CLOSED'
  if (isSeller(a)) return 'SELLER_CANNOT_BID'
  if (isBidRestricted()) return 'PENALTY_RESTRICTED'
  if (isMyHighest(a)) return 'ALREADY_HIGHEST_BIDDER'
  return null
}

function restrictedUntil(reason: CannotBidReason | null) {
  return reason === 'PENALTY_RESTRICTED' && penaltyState.bidRestrictedUntil
    ? kst(penaltyState.bidRestrictedUntil)
    : null
}

/** 내 자동입찰 (취소된 설정은 상세 · 실시간에 보이지 않음) */
function activeAutoBid(a: MockAuction) {
  return a.myAutoBid && a.myAutoBid.status !== 'CANCELED' ? a.myAutoBid : null
}

export function toProductSummary(a: MockAuction): ProductSummary {
  return {
    productId: a.productId,
    name: a.product.name,
    subName: a.product.subName,
    imageUrl: a.product.imageUrls[0],
  }
}

export function toDetail(a: MockAuction): AuctionDetail {
  const status = statusOf(a)
  const reason = cannotBidReasonOf(a)
  const autoBid = activeAutoBid(a)
  const seller = SELLERS[a.sellerId]
  return {
    auctionId: a.auctionId,
    status,
    product: { productId: a.productId, ...a.product },
    seller: {
      sellerId: a.sellerId,
      nickname: seller.nickname,
      profileImageUrl: null,
      completedSalesCount: seller.completedSalesCount,
    },
    description: a.description,
    startPrice: a.startPrice,
    currentPrice: currentPriceOf(a),
    bidIncrement: a.bidIncrement,
    minNextBidAmount: minNextBidOf(a),
    minCapAmount: minNextBidOf(a),
    startsAt: kst(a.startsAt),
    endsAt: kst(a.endsAt),
    serverTime: kst(Date.now()),
    aiEstimatedPrice: a.aiEstimatedPrice,
    aiRecommendedAutoBidCap: a.aiEstimatedPrice,
    aiPriceReason: a.aiPriceReason,
    bidCount: a.bids.length,
    isLiked: a.isLiked,
    likeCount: a.likeCount,
    myState: {
      isSeller: isSeller(a),
      isHighestBidder: isMyHighest(a),
      canBid: reason === null,
      cannotBidReason: reason,
      bidRestrictedUntil: restrictedUntil(reason),
      autoBidStatus: autoBid?.status ?? null,
      autoBidCap: autoBid?.maxAmount ?? null,
    },
    finalPrice: status === 'ENDED' && a.bids.length > 0 ? currentPriceOf(a) : null,
  }
}

export function toLive(a: MockAuction): AuctionLive {
  const reason = cannotBidReasonOf(a)
  const autoBid = activeAutoBid(a)
  return {
    auctionId: a.auctionId,
    status: statusOf(a),
    currentPrice: currentPriceOf(a),
    minNextBidAmount: minNextBidOf(a),
    bidIncrement: a.bidIncrement,
    highestBidderMasked: a.bids[0]?.bidderMasked ?? null,
    isMine: isMyHighest(a),
    canBid: reason === null,
    cannotBidReason: reason,
    bidRestrictedUntil: restrictedUntil(reason),
    endsAt: kst(a.endsAt),
    serverTime: kst(Date.now()),
    extensionCount: a.extensionCount,
    maxExtensions: MAX_EXTENSIONS,
    myAutoBidStatus: autoBid?.status ?? null,
    myCap: autoBid?.maxAmount ?? null,
    minCapAmount: minNextBidOf(a),
  }
}

export function toBid(b: MockBid, index: number): Bid {
  return { ...b, bidAt: kst(b.bidAt), isHighest: index === 0 }
}

export function toSimilar(a: MockAuction): SimilarAuction {
  return {
    productId: a.productId,
    auctionId: a.auctionId,
    brand: a.product.brand,
    name: a.product.name,
    thumbnailUrl: a.product.imageUrls[0],
    price: currentPriceOf(a),
    likeCount: a.likeCount,
    isLiked: a.isLiked,
  }
}

/** [ASSUMED] 명세에 없는 경매 목록 항목 */
export function toListItem(a: MockAuction): AuctionListItem {
  return {
    ...toSimilar(a),
    status: statusOf(a),
    grade: a.product.grade,
    startsAt: kst(a.startsAt),
    endsAt: kst(a.endsAt),
  }
}

/* ───────── 변경 ───────── */

/** 다른 사람(ham****)의 자동입찰 상한. 내가 입찰하면 이 금액까지 즉시 반격합니다. */
export const rivalAutoBidCap: Record<number, number> = {
  11: 120000,
}
const RIVAL = 'ham****'

function pushBid(a: MockAuction, amount: number, mine: boolean, bidType: BidType) {
  const bid: MockBid = {
    bidId: createBidId(),
    bidderMasked: mine ? ME.masked : RIVAL,
    isMine: mine,
    amount,
    bidType,
    bidAt: Date.now(),
  }
  a.bids.unshift(bid)
  return bid
}

/** 사용자가 직접 입찰합니다. */
export function placeManualBid(a: MockAuction, amount: number) {
  return pushBid(a, amount, true, 'MANUAL')
}

/**
 * 자동입찰끼리 한 단위씩 응찰합니다. 상한에 닿으면 멈추고, 내 자동입찰은 CAP_REACHED가 됩니다.
 * 결과: 내 자동입찰로 생긴 마지막 입찰가, 상대 자동입찰이 반격했는지
 */
export function runProxyBidding(a: MockAuction) {
  let myLastAutoBid: number | null = null
  let rivalResponded = false
  for (let guard = 0; guard < 200; guard++) {
    const next = minNextBidOf(a)
    const rivalCap = rivalAutoBidCap[a.auctionId]
    const myAuto = a.myAutoBid?.status === 'ACTIVE' ? a.myAutoBid : null

    if (isMyHighest(a)) {
      if (!rivalCap || rivalCap < next) break
      pushBid(a, next, false, 'AUTO')
      rivalResponded = true
    } else if (myAuto && myAuto.maxAmount >= next) {
      myLastAutoBid = pushBid(a, next, true, 'AUTO').amount
    } else {
      break
    }
  }
  if (
    a.myAutoBid?.status === 'ACTIVE' &&
    !isMyHighest(a) &&
    a.myAutoBid.maxAmount < minNextBidOf(a)
  ) {
    a.myAutoBid.status = 'CAP_REACHED'
  }
  return { myLastAutoBid, rivalResponded }
}

/** 마감 3분 이내 입찰이면 3분 연장(최대 MAX_EXTENSIONS회) */
export function extendIfClosing(a: MockAuction) {
  const EXTEND_WINDOW = 3 * MINUTE
  if (a.endsAt - Date.now() <= EXTEND_WINDOW && a.extensionCount < MAX_EXTENSIONS) {
    a.endsAt += EXTEND_WINDOW
    a.extensionCount += 1
  }
}
