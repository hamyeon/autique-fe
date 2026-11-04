import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { CreatePurchaseGoalRequest } from '@/api/schemas/purchase-goals'
import {
  AgentBubble,
  AgentInput,
  AgentMessageGroup,
  AgentThread,
  AgentTyping,
  Header,
} from '@/components/ds'
import { ErrorState, Skeleton } from '@/components/feedback'
import { Screen } from '@/layouts/screen'
import { AgentConfirmSheet } from './agent-confirm-sheet'
import type { AgentScenario, AgentState } from './agent-demo'
import { DEMO_REPLY_MS, demoParse, demoState, nextDemoGoalId, parseScenario } from './agent-demo'
import type { AgentAction, AgentEntry } from './agent-messages'
import {
  cancelPromptEntry,
  cancelledEntry,
  confirmedEntry,
  draftEntry,
  isCancelRequest,
  searchingEntry,
  userEntry,
} from './agent-messages'

/** AI 말풍선이 하나씩 나오는 간격. 그동안 점 3개가 보입니다. */
const BUBBLE_GAP_MS = 700

/**
 * 경매 AI Agent(Figma 01 온보딩 986:3839 · 02 조건 설정 988:5022 · 03-1~03-5 989:5200 ~ 989:5315).
 * API 연결 전이라 대화는 데모 시나리오(?scenario=)로 채우고, 보내기 · 확인 · 취소는 화면 안에서만 이어집니다.
 */
export function AgentPage() {
  const [params, setParams] = useSearchParams()
  const scenario = parseScenario(params.get('scenario'))
  /* 시나리오가 바뀌면 대화 · 입력을 처음부터 다시 그립니다. */
  return (
    <AgentView
      key={scenario}
      scenario={scenario}
      onRetry={() => setParams({}, { replace: true })}
    />
  )
}

function AgentView({ scenario, onRetry }: { scenario: AgentScenario; onRetry: () => void }) {
  const [state, setState] = useState(() => demoState(scenario))
  const [value, setValue] = useState('')
  /* 보낸 뒤 AI 답(parse · 등록 · 취소)을 기다리는 중. 두 번 보내지 않게 입력을 잠급니다. */
  const [pending, setPending] = useState(false)
  /* 확인 시트: 열림 여부와 초안 id(닫히는 동안에도 내용이 남도록 따로 둡니다) */
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetDraftId, setSheetDraftId] = useState<string | null>(null)
  /* 새 초안이 다 보이면 시트를 한 번 자동으로 엽니다. */
  const autoOpenDraftId = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  /* 온보딩은 Figma처럼 바로 입력할 수 있게 포커스를 줍니다. */
  useEffect(() => {
    if (scenario === 'onboarding') inputRef.current?.focus()
  }, [scenario])

  const entries = state?.entries ?? []
  /* 들어올 때 있던 대화는 한꺼번에, 온보딩과 이후 새 말풍선은 하나씩 */
  const { visible, revealing } = useReveal(entries, scenario === 'onboarding')
  /* 탐색 중 점 3개: 탐색 중인 목표가 있고, 마지막 묶음이 탐색을 이어가는 문장(02 · 03-4)일 때만 */
  const searching =
    (state?.goals.some((g) => g.status === 'ACTIVE') ?? false) && !!entries.at(-1)?.searching
  const typing = revealing || pending || searching

  useScrollToLatest(`${visible}-${typing}`)

  /* 초안이 다 보이면 시트 자동 열기 */
  useEffect(() => {
    const draftId = autoOpenDraftId.current
    if (!revealing && draftId) {
      autoOpenDraftId.current = null
      setSheetDraftId(draftId)
      setSheetOpen(true)
    }
  }, [revealing])

  const later = (fn: () => void) => {
    timers.current.push(setTimeout(fn, DEMO_REPLY_MS))
  }
  const update = (fn: (prev: AgentState) => AgentState) =>
    setState((prev) => (prev ? fn(prev) : prev))
  const append = (...added: AgentEntry[]) =>
    update((prev) => ({ ...prev, entries: [...prev.entries, ...added] }))
  /** AI 답을 기다렸다가(데모: 1.2초) 반영 */
  const reply = (fn: () => void) => {
    setPending(true)
    later(() => {
      fn()
      setPending(false)
    })
  }

  const send = (text: string) => {
    setValue('')
    append(userEntry(text))
    if (isCancelRequest(text)) {
      reply(() =>
        update((prev) => ({ ...prev, entries: [...prev.entries, cancelPromptEntry(prev.goals)] })),
      )
      return
    }
    /* 진행 중인 목표가 있어도 새 문장이면 새 탐색(목표를 하나 더 만듭니다). */
    reply(() => {
      const draft = demoParse(text)
      const draftId = `draft-${Date.now()}`
      autoOpenDraftId.current = draftId
      update((prev) => ({
        ...prev,
        drafts: { ...prev.drafts, [draftId]: draft },
        entries: [...prev.entries, draftEntry(draft, draftId)],
      }))
    })
  }

  /** 버튼 말풍선을 쓴 묶음은 버튼을 일반 말풍선으로 */
  const markDone = (entryId: string) =>
    update((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.id === entryId ? { ...e, actionsDone: true } : e)),
    }))

  const handleAction = (entryId: string, action: AgentAction) => {
    if (action.type === 'confirm-draft') {
      setSheetDraftId(action.draftId)
      setSheetOpen(true)
      return
    }
    const goal = state?.goals.find((g) => g.id === action.goalId)
    if (!goal) return
    markDone(entryId)
    /* 명세: ACTIVE → CANCELLED, ENGAGED → CANCEL_REQUESTED(참여 중 경매의 자동입찰은 유지) */
    const status = goal.status === 'ENGAGED' ? 'CANCEL_REQUESTED' : 'CANCELLED'
    reply(() =>
      update((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === goal.id ? { ...g, status } : g)),
        entries: [...prev.entries, cancelledEntry(goal, status)],
      })),
    )
  }

  const confirm = (values: CreatePurchaseGoalRequest) => {
    const draftId = sheetDraftId
    setSheetOpen(false)
    update((prev) => ({
      ...prev,
      entries: [
        ...prev.entries.map((e) =>
          e.bubbles.some((b) => b.action?.type === 'confirm-draft' && b.action.draftId === draftId)
            ? { ...e, actionsDone: true }
            : e,
        ),
        confirmedEntry(values),
      ],
    }))
    reply(() =>
      update((prev) => ({
        ...prev,
        goals: [
          ...prev.goals,
          { id: nextDemoGoalId(), modelQuery: values.modelQuery, status: 'ACTIVE' },
        ],
        entries: [...prev.entries, searchingEntry()],
      })),
    )
  }

  const input = (
    /* Figma 하단 Stack: 좌우 20 · 위아래 12. 바탕은 투명(Screen background="grad") */
    <div className="px-layout-gutter py-space-12">
      <AgentInput
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSend={send}
        disabled={!state || pending}
        maxLength={300}
      />
    </div>
  )

  return (
    <Screen
      header={<Header title="쇼핑메이트 PIKI" />}
      background="grad"
      top="none"
      className="pt-space-20"
      bottom={input}
    >
      {scenario === 'loading' ? (
        <AgentThreadSkeleton />
      ) : !state ? (
        <ErrorState title="대화를 불러오지 못했어요" onRetry={onRetry} />
      ) : (
        <AgentConversationView
          entries={entries}
          visible={visible}
          typing={typing}
          onAction={handleAction}
        />
      )}
      <AgentConfirmSheet
        open={sheetOpen}
        draft={sheetDraftId ? (state?.drafts[sheetDraftId] ?? null) : null}
        onClose={() => setSheetOpen(false)}
        onConfirm={confirm}
      />
    </Screen>
  )
}

function AgentConversationView({
  entries,
  visible,
  typing,
  onAction,
}: {
  entries: AgentEntry[]
  /** 보이는 말풍선 수(앞에서부터) */
  visible: number
  typing: boolean
  onAction: (entryId: string, action: AgentAction) => void
}) {
  /* 보이는 만큼만 묶음별로 자릅니다. start = 이 묶음 앞까지의 말풍선 수 */
  const starts = entries.map((_, i) =>
    entries.slice(0, i).reduce((sum, e) => sum + e.bubbles.length, 0),
  )
  const shown = entries
    .map((entry, i) => ({
      entry,
      bubbles: entry.bubbles.slice(0, Math.max(0, visible - starts[i])),
    }))
    .filter(({ bubbles }) => bubbles.length > 0)
  const last = shown.at(-1)
  /* 점 3개는 마지막 AI 묶음 끝에 붙고, 마지막이 사용자 말풍선이면 새 AI 묶음으로 나옵니다. */
  const typingInLast = typing && last?.entry.from === 'agent'

  return (
    <AgentThread>
      {shown.map(({ entry, bubbles }) => (
        <AgentMessageGroup key={entry.id} from={entry.from}>
          {bubbles.map((bubble, i) => {
            const action = entry.actionsDone ? undefined : bubble.action
            return (
              <AgentBubble
                key={i}
                from={entry.from}
                href={bubble.href}
                onClick={action && (() => onAction(entry.id, action))}
                className={BUBBLE_IN}
              >
                {bubble.text}
              </AgentBubble>
            )
          })}
          {typingInLast && entry === last.entry && <AgentTyping className={BUBBLE_IN} />}
        </AgentMessageGroup>
      ))}
      {typing && !typingInLast && (
        <AgentMessageGroup from="agent">
          <AgentTyping className={BUBBLE_IN} />
        </AgentMessageGroup>
      )}
    </AgentThread>
  )
}

/** 말풍선이 나타날 때 아래에서 살짝 올라오며 보입니다(모션 줄이기면 바로). */
const BUBBLE_IN =
  'animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none'

/**
 * 말풍선을 하나씩 보여 줍니다. 사용자 말풍선은 바로, AI 말풍선은 BUBBLE_GAP_MS마다 하나씩.
 * animateInitial이 false면 처음 있던 대화는 한꺼번에 보입니다(지난 대화).
 */
function useReveal(entries: AgentEntry[], animateInitial: boolean) {
  const order = entries.flatMap((e) => e.bubbles.map(() => e.from))
  const total = order.length
  const [visible, setVisible] = useState(() => (animateInitial ? 0 : total))
  const next = order[visible]

  useEffect(() => {
    if (visible >= total) return
    const timer = setTimeout(() => setVisible((v) => v + 1), next === 'user' ? 0 : BUBBLE_GAP_MS)
    return () => clearTimeout(timer)
  }, [visible, total, next])

  return { visible: Math.min(visible, total), revealing: visible < total && next === 'agent' }
}

/** 불러오는 중: 말풍선 자리(높이 38, radius-lg)를 AI 쪽에 3개 */
function AgentThreadSkeleton() {
  return (
    <div role="status" aria-label="대화를 불러오는 중" className="gap-stack-related flex flex-col">
      <Skeleton className="h-9.5 w-3/5 rounded-lg" />
      <Skeleton className="h-9.5 w-1/4 rounded-lg" />
      <Skeleton className="h-9.5 w-4/5 rounded-lg" />
    </div>
  )
}

/** 새 말풍선이 생기면 맨 아래로 내립니다. 처음 열 때는 바로, 이후에는 부드럽게. */
function useScrollToLatest(signal: string) {
  const first = useRef(true)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: first.current || reduce ? 'auto' : 'smooth',
    })
    first.current = false
  }, [signal])
}
