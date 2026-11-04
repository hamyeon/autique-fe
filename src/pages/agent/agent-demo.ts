import type {
  PurchaseGoalCondition,
  PurchaseGoalDraft,
  PurchaseGoalStatus,
} from '@/api/schemas/purchase-goals'
import type { AgentEntry, AgentGoal } from './agent-messages'
import {
  bidStartedEntry,
  confirmedEntry,
  draftEntry,
  foundEntry,
  lostEntry,
  notFoundEntry,
  onboardingEntry,
  searchingEntry,
  userEntry,
  wonEntry,
} from './agent-messages'

/*
 * API 연결 전 임시 데모(?scenario=). 구매 목표 API(/api/purchase-goals*)를 붙이면 이 파일을 지우고
 * 목표 상태 · 참여 경매 · 알림으로 대화를 만듭니다.
 * 링크 id는 src/mocks/data 기준(상품 12 · 실시간 20 · 주문 50)이라 /dev/routes에서 '목 데이터로 보기'를 켜면 열립니다.
 */

export const AGENT_SCENARIOS = [
  'onboarding',
  'confirm',
  'searching',
  'found',
  'bidding',
  'won',
  'lost',
  'not-found',
  'loading',
  'error',
] as const
export type AgentScenario = (typeof AGENT_SCENARIOS)[number]

export function parseScenario(value: string | null): AgentScenario {
  return AGENT_SCENARIOS.find((s) => s === value) ?? 'onboarding'
}

/** 화면 상태: 대화 · 목표 · 아직 확인하지 않은 초안 */
export interface AgentState {
  entries: AgentEntry[]
  goals: AgentGoal[]
  drafts: Record<string, PurchaseGoalDraft>
}

/** 데모에서 조건을 보낸 뒤 AI가 답하기까지 걸리는 시간(parse · 등록 · 취소 응답 자리) */
export const DEMO_REPLY_MS = 1200

const USER_TEXT =
  '아식스 노바블라스트 모델을 찾고 있는데, 상태는 A급 이상이었으면 좋겠어. 최대 예산은 30만원까지이고, 다음주 중으로 구매하고 싶어!'
const AUCTION_ID = 12
const ORDER_ID = 50

function at(daysFromToday: number, hours: number, minutes = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  d.setHours(hours, minutes, 0, 0)
  return d
}

let goalSeq = 100
/** 데모 목표 id(등록 응답 id 자리) */
export const nextDemoGoalId = () => ++goalSeq

/** 시나리오별 처음 상태. loading · error는 대화가 없으므로 null */
export function demoState(scenario: AgentScenario): AgentState | null {
  if (scenario === 'loading' || scenario === 'error') return null

  const draft = demoParse(USER_TEXT)
  const goal = (status: PurchaseGoalStatus): AgentGoal[] => [
    { id: 1, modelQuery: draft.modelQuery ?? USER_TEXT, status },
  ]
  /* 확인까지 끝난 대화: 사용자 문장 → 초안(버튼은 이미 씀) → 확인한 조건 → 탐색 시작 */
  const asked: AgentEntry[] = [
    onboardingEntry(),
    userEntry(USER_TEXT),
    { ...draftEntry(draft, 'demo'), actionsDone: true },
    confirmedEntry({
      modelQuery: draft.modelQuery ?? USER_TEXT,
      minCondition: draft.minCondition ?? 'A',
      hardMaxAmount: draft.hardMaxAmount ?? 300000,
      sizeKr: draft.sizeKr,
      deadline: at(7, 23, 59).toISOString(),
    }),
    searchingEntry(),
  ]
  const found = foundEntry({
    auctionId: AUCTION_ID,
    productName: '아식스 노바블라스트 6 블랙 - 2E 와이드',
    startAt: at(0, 20),
    startPrice: 50000,
    maxAmount: draft.hardMaxAmount ?? 300000,
  })
  const started = bidStartedEntry({ auctionId: AUCTION_ID })

  switch (scenario) {
    case 'onboarding':
      return { entries: [onboardingEntry()], goals: [], drafts: {} }
    case 'confirm':
      return {
        entries: [onboardingEntry(), userEntry(USER_TEXT), draftEntry(draft, 'demo')],
        goals: [],
        drafts: { demo: draft },
      }
    case 'searching':
      return { entries: asked, goals: goal('ACTIVE'), drafts: {} }
    case 'found':
      return { entries: [...asked, found], goals: goal('ENGAGED'), drafts: {} }
    case 'bidding':
      return { entries: [...asked, found, started], goals: goal('ENGAGED'), drafts: {} }
    case 'won':
      return {
        entries: [
          ...asked,
          found,
          started,
          wonEntry({ finalPrice: 210000, paymentDeadline: at(1, 21), orderId: ORDER_ID }),
        ],
        goals: goal('FULFILLED'),
        drafts: {},
      }
    case 'lost':
      return {
        entries: [...asked, found, started, lostEntry({ finalPrice: 320000 })],
        goals: goal('ACTIVE'),
        drafts: {},
      }
    case 'not-found':
      return { entries: [...asked, notFoundEntry()], goals: goal('EXPIRED'), drafts: {} }
  }
}

const GRADE_WORDS: Record<string, PurchaseGoalCondition> = {
  새상품: 'DS',
  DS: 'DS',
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
}

/**
 * POST /api/purchase-goals/parse 자리의 아주 단순한 규칙 해석(데모 전용).
 * 금액('30만원', '150,000원') · 등급('A급') · 사이즈(220~325, 5mm 단위) · 모델(첫 마디)만 뽑고,
 * 못 뽑은 값은 null + warnings로 돌려줍니다(명세 응답 모양 그대로).
 */
export function demoParse(text: string): PurchaseGoalDraft {
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

  const warnings: string[] = []
  if (!modelQuery) warnings.push('모델을 알아보지 못했어요. 모델명을 입력해 주세요.')
  if (!minCondition) warnings.push('최소 등급이 없어요. 원하는 등급을 골라 주세요.')
  if (!hardMaxAmount) warnings.push('예산이 없어요. 최대 예산을 정해 주세요.')
  if (!size)
    warnings.push('사이즈가 없습니다. 사이즈를 지정하지 않으면 모든 사이즈가 후보가 됩니다.')

  return {
    modelQuery,
    brand: null,
    modelKey: null,
    minCondition,
    hardMaxAmount,
    sizeKr: size ?? null,
    freeTextConditions: null,
    confidence: warnings.length > 1 ? 0.5 : 0.9,
    warnings,
  }
}
