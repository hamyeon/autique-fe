import type {
  CreatePurchaseGoalRequest,
  PurchaseGoal,
  PurchaseGoalCondition,
  PurchaseGoalDetail,
  PurchaseGoalDraft,
  PurchaseGoalParticipation,
} from '@/api/schemas/purchase-goals'
import { DAY, HOUR, ME, fromNow, kst } from '@/mocks/data/common'

/*
 * 구매 목표 목 데이터. 한 사람이 여러 목표를 가진 상태로 대화의 모든 단계를 한 화면에서 볼 수 있게 둡니다.
 * 참여 경매는 src/mocks/data/auctions.ts의 경매(13 낙찰 · 14 패찰 · 20 진행 중 · 12 예정)를 씁니다.
 * 페이지를 새로 열면 처음 데이터로 돌아갑니다.
 */

interface MockGoal extends Omit<PurchaseGoalDetail, 'createdAt' | 'deadline'> {
  createdAt: number
  deadline: number
}

const participation = (
  auctionId: number,
  status: PurchaseGoalParticipation['status'],
  auctionStatus: PurchaseGoalParticipation['auctionStatus'],
): PurchaseGoalParticipation => ({ auctionId, status, auctionStatus })

function goal(
  partial: Pick<MockGoal, 'id' | 'modelQuery' | 'minCondition' | 'hardMaxAmount' | 'status'> &
    Partial<MockGoal>,
): MockGoal {
  const participations = partial.participations ?? []
  return {
    userId: ME.userId,
    brand: null,
    modelKey: null,
    sizeKr: null,
    freeTextConditions: null,
    createdAt: fromNow(-DAY),
    deadline: fromNow(6 * DAY),
    currentAuctionId: participations.at(-1)?.auctionId ?? null,
    participationCount: participations.length,
    wonCount: participations.filter((p) => p.status === 'WON').length,
    participations,
    ...partial,
  }
}

/** 오래된 것부터: 낙찰 → 패찰 후 만료 → 진행 중 경매 참여 → 예정 경매 참여 → 탐색 중 */
const goals: MockGoal[] = [
  goal({
    id: 31,
    brand: 'New Balance',
    modelQuery: 'New Balance 993',
    minCondition: 'A',
    hardMaxAmount: 250000,
    sizeKr: 270,
    status: 'FULFILLED',
    createdAt: fromNow(-4 * DAY),
    deadline: fromNow(3 * DAY),
    participations: [participation(13, 'WON', 'ENDED')],
  }),
  goal({
    id: 32,
    brand: 'Adidas',
    modelQuery: 'Adidas Samba OG',
    minCondition: 'B',
    hardMaxAmount: 150000,
    status: 'EXPIRED',
    createdAt: fromNow(-3 * DAY),
    deadline: fromNow(-HOUR),
    participations: [participation(14, 'LOST', 'ENDED')],
  }),
  goal({
    id: 33,
    brand: 'Nike',
    modelQuery: 'Nike Air Force 1 Low',
    minCondition: 'S',
    hardMaxAmount: 200000,
    status: 'ENGAGED',
    createdAt: fromNow(-2 * DAY),
    participations: [participation(20, 'LIVE', 'LIVE')],
  }),
  goal({
    id: 34,
    brand: 'Asics',
    modelQuery: 'Asics Novablast',
    minCondition: 'A',
    hardMaxAmount: 300000,
    status: 'ENGAGED',
    createdAt: fromNow(-5 * HOUR),
    participations: [participation(12, 'SCHEDULED', 'SCHEDULED')],
  }),
  goal({
    id: 35,
    brand: 'Salomon',
    modelQuery: 'Salomon XT-6',
    minCondition: 'A',
    hardMaxAmount: 220000,
    status: 'ACTIVE',
    createdAt: fromNow(-HOUR),
  }),
]

let nextGoalId = 100

function toDetail(g: MockGoal): PurchaseGoalDetail {
  return { ...g, createdAt: kst(g.createdAt), deadline: kst(g.deadline) }
}

function toGoal(g: MockGoal): PurchaseGoal {
  const { participations: _participations, ...rest } = toDetail(g)
  return rest
}

/** 생성 최신순 */
export function listGoals(): PurchaseGoal[] {
  return [...goals].sort((a, b) => b.createdAt - a.createdAt).map(toGoal)
}

export function findGoal(id: number) {
  const g = goals.find((x) => x.id === id)
  return g && toDetail(g)
}

export function addGoal(body: CreatePurchaseGoalRequest): PurchaseGoal {
  const g = goal({
    ...body,
    id: ++nextGoalId,
    status: 'ACTIVE',
    createdAt: Date.now(),
    deadline: Date.parse(body.deadline),
  })
  goals.push(g)
  return toGoal(g)
}

/** ACTIVE → CANCELLED, ENGAGED → CANCEL_REQUESTED. 바꿀 수 없으면 conflict에 현재 상태. 없으면 null */
export function cancelGoal(id: number) {
  const g = goals.find((x) => x.id === id)
  if (!g) return null
  if (g.status === 'ACTIVE') g.status = 'CANCELLED'
  else if (g.status === 'ENGAGED') g.status = 'CANCEL_REQUESTED'
  else return { conflict: g.status }
  return { cancelled: { id: g.id, status: g.status, updatedAt: kst(Date.now()) } }
}

/** 시세 카탈로그 목(실서버처럼 여기 있는 모델만 modelKey가 나옴). 실서버 예: '아식스 노바블라스트' → Asics Novablast · novablast */
const CATALOG: { pattern: RegExp; brand: string; modelKey: string; modelQuery: string }[] = [
  {
    pattern: /노바\s*블라스트|novablast/i,
    brand: 'Asics',
    modelKey: 'novablast',
    modelQuery: 'Asics Novablast',
  },
  {
    pattern: /(뉴발|new\s*balance).*530|\b530\b/i,
    brand: 'New Balance',
    modelKey: 'nb530',
    modelQuery: 'New Balance 530',
  },
  {
    pattern: /(뉴발|new\s*balance).*993|\b993\b/i,
    brand: 'New Balance',
    modelKey: 'nb993',
    modelQuery: 'New Balance 993',
  },
  { pattern: /삼바|samba/i, brand: 'Adidas', modelKey: 'samba-og', modelQuery: 'Adidas Samba OG' },
  {
    pattern: /(에어\s*)?포스|air\s*force/i,
    brand: 'Nike',
    modelKey: 'af1-low',
    modelQuery: 'Nike Air Force 1 Low',
  },
  { pattern: /xt-?6/i, brand: 'Salomon', modelKey: 'xt6', modelQuery: 'Salomon XT-6' },
]

const GRADE_WORDS: Record<string, PurchaseGoalCondition> = {
  새상품: 'DS',
  DS: 'DS',
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
}

/**
 * POST /api/purchase-goals/parse 목: 아주 단순한 규칙 해석.
 * 금액('30만원', '150,000원') · 등급('A급') · 사이즈(220~325, 5mm 단위) · 모델(카탈로그 목, 없으면 첫 마디)만 뽑고,
 * 못 뽑은 값은 null + warnings(실서버 문구)로 돌려줍니다.
 */
export function mockParse(text: string): PurchaseGoalDraft {
  const manwon = text.match(/(\d+(?:\.\d+)?)\s*만\s*원?/)
  const won = text.match(/(\d{1,3}(?:,\d{3})+|\d{4,})\s*원/)
  const hardMaxAmount = manwon
    ? Math.round(Number(manwon[1]) * 10000)
    : won
      ? Number(won[1].replace(/,/g, ''))
      : null

  const grade = text.match(/(새상품|DS|[SABC])\s*급/i)
  const minCondition = grade ? (GRADE_WORDS[grade[1].toUpperCase()] ?? null) : null

  const size = [...text.matchAll(/\b(\d{3})\s*(mm|사이즈)?/g)]
    .map((m) => Number(m[1]))
    .find((n) => n >= 220 && n <= 325 && n % 5 === 0)

  /* 첫 마디(숫자 사이 쉼표는 금액이라 자르지 않음)에서 금액 · 등급 · 사이즈 · '찾고 있는데' 등을 뺀 나머지 */
  const modelQuery =
    text
      .split(/,(?!\d{3})|[.!?\n]/)[0]
      .replace(/\s*(\d[\d,.]*\s*(만\s*)?원|(새상품|DS|[SABC])\s*급|\d{3}\s*(mm|사이즈)).*$/i, '')
      .replace(/\s*(모델)?\s*(을|를)?\s*(찾고\s*있는데|찾아\s*줘|찾아|사고\s*싶어).*$/, '')
      .trim() || null

  const catalog = CATALOG.find((c) => c.pattern.test(text))

  const warnings: string[] = []
  if (modelQuery && !catalog)
    warnings.push('시세 정보가 없는 모델입니다. v1 구매 Agent는 시세가 있는 모델만 탐색합니다.')
  if (!hardMaxAmount)
    warnings.push('예산 상한이 없습니다. 상한을 정하지 않으면 Agent가 참여할 수 없습니다.')
  if (!size)
    warnings.push('사이즈가 없습니다. 사이즈를 지정하지 않으면 모든 사이즈가 후보가 됩니다.')
  if (!minCondition) warnings.push('상태 등급 조건이 없습니다. 모든 등급이 후보가 됩니다.')

  return {
    modelQuery: catalog?.modelQuery ?? modelQuery,
    brand: catalog?.brand ?? null,
    modelKey: catalog?.modelKey ?? null,
    minCondition,
    hardMaxAmount,
    sizeKr: size ?? null,
    freeTextConditions: null,
    confidence: warnings.length > 1 ? 0.5 : 0.9,
    warnings,
  }
}
