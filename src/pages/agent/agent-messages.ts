import type {
  CreatePurchaseGoalRequest,
  PurchaseGoal,
  PurchaseGoalCondition,
  PurchaseGoalDraft,
} from '@/api/schemas/purchase-goals'
import { formatDateTime, formatPrice } from '@/lib/format'

/*
 * 경매 AI Agent 대화 문장(Figma 경매 AI Agent 986:3839 ~ 989:5315).
 * 명세: 채팅 메시지 API는 없고, 프론트가 구매 목표 상태 · 참여 이력 · 알림으로 문장을 만듭니다.
 * 그래서 단계마다 문장을 만드는 함수만 두고, 어떤 단계를 보여줄지는 화면(지금은 데모 시나리오)이 정합니다.
 * Figma에 없는 단계(조건 확인 · 취소)는 DESIGN-CHANGES.md에 적었습니다.
 */

/** 버튼 말풍선을 눌렀을 때 할 일 */
export type AgentAction =
  { type: 'confirm-draft'; draftId: string } | { type: 'cancel-goal'; goalId: number }

export interface AgentBubbleData {
  text: string
  /** 있으면 밑줄 링크 말풍선 */
  href?: string
  /** 있으면 밑줄 버튼 말풍선 */
  action?: AgentAction
}

/** 한 번에 이어지는 말풍선 묶음 */
export interface AgentEntry {
  /** 목록 key. 같은 대화 안에서 겹치지 않게 만듭니다. */
  id: string
  from: 'agent' | 'user'
  bubbles: AgentBubbleData[]
  /** 탐색을 이어가는 문장(02 · 03-4). 이 묶음이 마지막이고 탐색 중인 목표가 있으면 끝에 점 3개를 붙입니다. */
  searching?: boolean
  /** 버튼을 이미 썼으면 true. 버튼 말풍선을 일반 말풍선으로 그립니다(말풍선 수는 그대로). */
  actionsDone?: boolean
}

/** 대화에 필요한 목표 정보 */
export type AgentGoal = Pick<PurchaseGoal, 'id' | 'modelQuery' | 'status'>

/** 취소할 수 있는 목표(명세: ACTIVE · ENGAGED에서만 취소 가능) */
export function isCancellable(goal: AgentGoal) {
  return goal.status === 'ACTIVE' || goal.status === 'ENGAGED'
}

let seq = 0
const nextId = (prefix: string) => `${prefix}-${++seq}`
const agent = (prefix: string, bubbles: AgentBubbleData[]): AgentEntry => ({
  id: nextId(prefix),
  from: 'agent',
  bubbles,
})

/** 'A' → 'A등급 이상', 'DS' → '새상품만' */
export function conditionLabel(condition: PurchaseGoalCondition) {
  return condition === 'DS' ? '새상품만' : `${condition}등급 이상`
}

/** 01 온보딩: 처음 들어오면 보이는 안내 */
export function onboardingEntry(): AgentEntry {
  return {
    id: 'onboarding',
    from: 'agent',
    bubbles: [
      { text: 'AI가 원하는 조건에 딱 맞는 상품을 찾고\n자동으로 입찰해요!' },
      { text: '예를 들어' },
      { text: '뉴발란스 530, A급 이상, 30만원 이하의 신발. 이번 달 내에 구매하고 싶어.' },
      { text: '와 같이 원하는 조건을 자유롭게 입력할 수 있어요.' },
    ],
  }
}

/** 사용자가 보낸 문장 */
export function userEntry(text: string): AgentEntry {
  return { id: nextId('user'), from: 'user', bubbles: [{ text }] }
}

/** 조건 해석 결과(POST /api/purchase-goals/parse 초안) + 확인 버튼. 마감은 초안에 없어 시트에서 정합니다. */
export function draftEntry(draft: PurchaseGoalDraft, draftId: string): AgentEntry {
  const unknown = '확인이 필요해요'
  const lines = [
    `모델 · ${draft.modelQuery ?? unknown}`,
    `최소 등급 · ${draft.minCondition ? conditionLabel(draft.minCondition) : unknown}`,
    `최대 예산 · ${draft.hardMaxAmount ? formatPrice(draft.hardMaxAmount) : unknown}`,
    `사이즈 · ${draft.sizeKr ? `${draft.sizeKr}mm` : '모든 사이즈'}`,
  ]
  if (draft.freeTextConditions) lines.push(`추가 희망 · ${draft.freeTextConditions}`)
  return agent('draft', [
    { text: '조건을 이렇게 정리했어요' },
    { text: lines.join('\n') },
    { text: '언제까지 찾을지 정하고 확인해 주시면 바로 찾기 시작할게요' },
    { text: '조건 확인하고 찾기 시작하기', action: { type: 'confirm-draft', draftId } },
  ])
}

/** 확인한 조건(POST /api/purchase-goals 요청). 사용자가 보낸 말풍선으로 남깁니다. */
export function confirmedEntry(values: CreatePurchaseGoalRequest): AgentEntry {
  const parts = [
    values.modelQuery,
    conditionLabel(values.minCondition),
    `${formatPrice(values.hardMaxAmount)} 이하`,
    values.sizeKr ? `${values.sizeKr}mm` : '모든 사이즈',
  ]
  return userEntry(`${parts.join(' · ')}\n${formatDateTime(new Date(values.deadline))}까지 찾아줘`)
}

/** 02 목표 등록 후 탐색 시작(목표 ACTIVE) */
export function searchingEntry(): AgentEntry {
  return {
    ...agent('searching', [
      { text: 'AI가 경매를 검색하고 있습니다' },
      { text: '알맞은 상품을 찾으면 알림을 보내 드릴게요' },
    ]),
    searching: true,
  }
}

/** 03-1 조건에 맞는 경매를 찾아 자동입찰 등록(목표 ENGAGED · 알림 PURCHASE_AGENT_ENGAGED) */
export function foundEntry({
  auctionId,
  productName,
  startAt,
  startPrice,
  maxAmount,
}: {
  auctionId: number
  productName: string
  startAt: Date
  startPrice: number
  /** 예산 상한(목표 hardMaxAmount) */
  maxAmount: number
}): AgentEntry {
  return agent('found', [
    { text: 'AI가 조건에 맞는 상품을 찾았어요' },
    {
      text:
        `조건에 맞는 “${productName}” 경매를 찾았어요!\n` +
        `${formatDateTime(startAt)}에 경매가 시작되고, 시작가는 ${formatPrice(startPrice)}이에요. ` +
        `설정하신 최대 예산 ${formatPrice(maxAmount)}에 맞게 자동 입찰을 시도할게요.`,
    },
    { text: '상품 상세 화면 바로 보러가기', href: `/products/${auctionId}` },
  ])
}

/** 03-2 참여 경매가 시작됨(참여 경매 status로 판단, 전용 알림 없음) */
export function bidStartedEntry({ auctionId }: { auctionId: number }): AgentEntry {
  return agent('bid-started', [
    { text: '경매 시작 시간이 되어 자동 입찰을 시작할게요' },
    { text: '실시간 경매 화면 바로 보러가기', href: `/auctions/${auctionId}/live` },
  ])
}

/** 03-3 낙찰(목표 FULFILLED · 알림 AUCTION_WON) */
export function wonEntry({
  finalPrice,
  paymentDeadline,
  orderId,
}: {
  finalPrice: number
  paymentDeadline: Date
  orderId: number
}): AgentEntry {
  return agent('won', [
    {
      text:
        `${formatPrice(finalPrice)}에 낙찰에 성공했어요! ` +
        `${formatDateTime(paymentDeadline)}까지 결제를 완료해 주세요. ` +
        '기한 내에 결제하지 않으면 낙찰이 취소되고 차순위 입찰자에게 구매 기회가 넘어가요.',
    },
    { text: '결제 화면 바로 가기', href: `/orders/${orderId}` },
  ])
}

/** 03-4 낙찰 실패 후 다시 탐색(알림 PURCHASE_AGENT_LOST → 목표 ACTIVE) */
export function lostEntry({ finalPrice }: { finalPrice: number }): AgentEntry {
  return {
    ...agent('lost', [
      { text: `최종 낙찰가 ${formatPrice(finalPrice)}으로 낙찰에 실패했어요` },
      { text: '조건에 맞는 경매를 다시 찾아볼게요' },
    ]),
    searching: true,
  }
}

/** 03-5 마감까지 찾지 못함(목표 EXPIRED) */
export function notFoundEntry(): AgentEntry {
  return agent('not-found', [
    { text: 'AI가 조건에 맞는 상품을 찾지 못했어요' },
    { text: '원하는 조건의 경매가 있다면 다시 저를 찾아주세요' },
  ])
}

/** '취소'를 입력했을 때: 진행 중인 목표마다 취소 버튼. 없으면 안내만 */
export function cancelPromptEntry(goals: AgentGoal[]): AgentEntry {
  const cancellable = goals.filter(isCancellable)
  if (cancellable.length === 0) {
    return agent('cancel-none', [
      { text: '지금 진행 중인 탐색이 없어요' },
      { text: '원하는 조건을 입력하면 새로 찾아 드릴게요' },
    ])
  }
  if (cancellable.length === 1) {
    const [goal] = cancellable
    return agent('cancel-prompt', [
      { text: `“${goal.modelQuery}” 탐색을 취소할까요?` },
      { text: '탐색 취소하기', action: { type: 'cancel-goal', goalId: goal.id } },
    ])
  }
  return agent('cancel-prompt', [
    { text: '어떤 탐색을 취소할까요?' },
    ...cancellable.map((goal) => ({
      text: `“${goal.modelQuery}” 탐색 취소하기`,
      action: { type: 'cancel-goal', goalId: goal.id } as const,
    })),
  ])
}

/** 취소 결과(DELETE /api/purchase-goals/{id}): ACTIVE → CANCELLED, ENGAGED → CANCEL_REQUESTED */
export function cancelledEntry(
  goal: AgentGoal,
  status: 'CANCELLED' | 'CANCEL_REQUESTED',
): AgentEntry {
  if (status === 'CANCELLED') {
    return agent('cancelled', [{ text: `“${goal.modelQuery}” 탐색을 취소했어요` }])
  }
  return agent('cancel-requested', [
    { text: `“${goal.modelQuery}” 탐색을 그만할게요` },
    { text: '이미 자동 입찰 중인 경매는 결과가 나올 때까지 그대로 진행돼요' },
  ])
}

/**
 * 취소 요청 문장인지. '취소', '취소해줘', '그만 찾아줘', '탐색 중단' 같은 짧은 문장만 봅니다.
 * '취소된 경매 말고 …'처럼 조건 문장 안의 '취소'는 걸리지 않게 문장 전체가 맞아야 합니다.
 */
const CANCEL_PATTERN =
  /^(탐색|검색|찾기|자동\s*입찰)?\s*(취소|중단|그만)\s*(해|해요|해줘|해 줘|해주세요|해 주세요|할래|할래요|할게|할게요|하기|찾아줘|찾아 줘|해도 돼)?\s*[.!~]*$/

export function isCancelRequest(text: string) {
  return CANCEL_PATTERN.test(text.trim())
}
