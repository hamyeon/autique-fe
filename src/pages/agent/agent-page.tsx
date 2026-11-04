import { useEffect, useRef, useState } from 'react'
import {
  useCancelPurchaseGoalMutation,
  useCreatePurchaseGoalMutation,
  useParsePurchaseGoalMutation,
} from '@/api/purchase-goals'
import type { CreatePurchaseGoalRequest, PurchaseGoalDraft } from '@/api/schemas/purchase-goals'
import {
  AgentBubble,
  AgentInput,
  AgentMessageGroup,
  AgentThread,
  AgentTyping,
  Header,
} from '@/components/ds'
import { ErrorState, Skeleton } from '@/components/feedback'
import { hasErrorCode } from '@/features/auction/auto-bid'
import { Screen } from '@/layouts/screen'
import { AgentConfirmSheet } from './agent-confirm-sheet'
import { goalEndId, mergeConversation } from './agent-conversation'
import type { AgentAction, AgentEntry } from './agent-messages'
import {
  cancelPromptEntry,
  cancelledEntry,
  draftEntry,
  failedEntry,
  isCancelRequest,
  unsupportedModelEntry,
  userEntry,
} from './agent-messages'
import { useAgentHistory } from './use-agent-history'

/** AI 말풍선이 하나씩 나오는 간격. 그동안 점 3개가 보입니다. */
const BUBBLE_GAP_MS = 700

/** 화면에서 받은 초안과, 등록하면 목표 묶음으로 옮길 말풍선(원문 · 조건 정리) */
interface DraftRecord {
  draft: PurchaseGoalDraft
  entryIds: string[]
}

/**
 * 쇼핑메이트 PIKI(경매 AI Agent, Figma 01 온보딩 986:3839 · 02 조건 설정 988:5022 · 03-1~03-5 989:5200 ~ 989:5315).
 * 대화는 구매 목표 · 참여 이력 · 참여 경매 상세 · 결과로 만들고(use-agent-history), 문장 해석 · 조건 확인 · 취소처럼
 * 서버에 남지 않는 말풍선은 이 화면에서만 붙입니다.
 */
export function AgentPage() {
  const { goalsQuery, goals, goalsOldestFirst, history, ready } = useAgentHistory()
  const parse = useParsePurchaseGoalMutation()
  const create = useCreatePurchaseGoalMutation()
  const cancel = useCancelPurchaseGoalMutation()

  const [local, setLocal] = useState<AgentEntry[]>([])
  const [drafts, setDrafts] = useState<Record<string, DraftRecord>>({})
  const [value, setValue] = useState('')
  /* 확인 시트: 열림 여부와 초안 id(닫히는 동안에도 내용이 남도록 따로 둡니다) */
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetDraftId, setSheetDraftId] = useState<string | null>(null)
  /* 새 초안이 다 보이면 시트를 한 번 자동으로 엽니다. */
  const autoOpenDraftId = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const entries = mergeConversation(goalsOldestFirst, history, local)
  /* 처음 그릴 때 있던 대화는 한꺼번에, 목표가 없으면(처음 온 사람) 온보딩부터 하나씩 */
  const { isVisible, revealing } = useReveal(entries, ready, goals.length === 0)
  const waiting = parse.isPending || cancel.isPending
  /* 탐색 중 점 3개: 탐색 중인 목표가 있고, 마지막 묶음이 탐색을 이어가는 문장(02 · 03-4)일 때만 */
  const searching = goals.some((g) => g.status === 'ACTIVE') && !!entries.at(-1)?.searching
  const typing = ready && (revealing || waiting || searching)
  const visibleCount = entries.reduce(
    (sum, e) => sum + e.bubbles.filter((_, i) => isVisible(e, i)).length,
    0,
  )

  useScrollToLatest(`${visibleCount}-${typing}`)

  /* 처음 온 사람은 Figma처럼 바로 입력할 수 있게 포커스 */
  const firstVisit = ready && goals.length === 0
  useEffect(() => {
    if (firstVisit) inputRef.current?.focus()
  }, [firstVisit])

  /* 초안이 다 보이면 시트 자동 열기 */
  useEffect(() => {
    const draftId = autoOpenDraftId.current
    if (!revealing && draftId) {
      autoOpenDraftId.current = null
      setSheetDraftId(draftId)
      setSheetOpen(true)
    }
  }, [revealing])

  const append = (...added: AgentEntry[]) =>
    setLocal((prev) => [...prev, ...added.map((e) => ({ ...e, at: Date.now() }))])
  const markDone = (entryId: string) =>
    setLocal((prev) => prev.map((e) => (e.id === entryId ? { ...e, actionsDone: true } : e)))

  const send = (text: string) => {
    setValue('')
    const asked = userEntry(text)
    append(asked)
    if (isCancelRequest(text)) {
      append(cancelPromptEntry(goals))
      return
    }
    /* 진행 중인 목표가 있어도 새 문장이면 새 탐색(목표를 하나 더 만듭니다). */
    parse.mutate(text, {
      onSuccess: (draft) => {
        /* 시세 없는 모델은 탐색할 수 없어 경고만 하고 끝냅니다(조건 확인 · 등록 없음). */
        if (!draft.modelKey) {
          append(unsupportedModelEntry(draft.modelQuery))
          return
        }
        const draftId = `draft-${Date.now()}`
        const entry = draftEntry(draft, draftId)
        setDrafts((prev) => ({ ...prev, [draftId]: { draft, entryIds: [asked.id, entry.id] } }))
        autoOpenDraftId.current = draftId
        append(entry)
      },
      onError: (e) =>
        append(
          hasErrorCode(e, 'INVALID_REQUEST')
            ? failedEntry('조건을 300자 안에서 다시 입력해 주세요')
            : failedEntry('조건을 이해하지 못했어요', '잠시 후 다시 보내 주세요'),
        ),
    })
  }

  const handleAction = (entryId: string, action: AgentAction) => {
    if (action.type === 'confirm-draft') {
      setSheetDraftId(action.draftId)
      setSheetOpen(true)
      return
    }
    const goal = goals.find((g) => g.id === action.goalId)
    if (!goal || cancel.isPending) return
    cancel.mutate(goal.id, {
      /* 명세: ACTIVE → CANCELLED, ENGAGED → CANCEL_REQUESTED(참여 중 경매의 자동입찰은 유지) */
      onSuccess: (result) => {
        markDone(entryId)
        append({ ...cancelledEntry(goal, result.status), id: goalEndId(goal.id) })
      },
      onError: (e) => {
        if (hasErrorCode(e, 'INVALID_PURCHASE_GOAL_STATUS')) {
          markDone(entryId)
          append(failedEntry('이미 끝났거나 취소를 요청한 탐색이에요'))
        } else {
          append(failedEntry('탐색을 취소하지 못했어요', '잠시 후 다시 시도해 주세요'))
        }
      },
    })
  }

  /** 등록 → 목록을 다시 받은 뒤, 원문 · 조건 정리 말풍선을 새 목표 묶음 앞으로 옮깁니다. 실패는 시트가 처리 */
  const confirm = async (values: CreatePurchaseGoalRequest) => {
    const draftId = sheetDraftId
    const created = await create.mutateAsync(values)
    const moved = draftId ? drafts[draftId]?.entryIds : undefined
    setLocal((prev) =>
      prev.map((e) =>
        moved?.includes(e.id) ? { ...e, goalId: created.id, actionsDone: true } : e,
      ),
    )
    setSheetOpen(false)
  }

  const input = (
    /* Figma 하단 Stack: 좌우 20 · 위아래 12. 바탕은 투명(Screen background="grad") */
    <div className="px-layout-gutter py-space-12">
      <AgentInput
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSend={send}
        disabled={!ready || waiting}
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
      {goalsQuery.isError && !goalsQuery.data ? (
        <ErrorState
          title="대화를 불러오지 못했어요"
          retrying={goalsQuery.isRefetching}
          onRetry={() => goalsQuery.refetch()}
        />
      ) : !ready ? (
        <AgentThreadSkeleton />
      ) : (
        <AgentConversationView
          entries={entries}
          isVisible={isVisible}
          typing={typing}
          onAction={handleAction}
        />
      )}
      <AgentConfirmSheet
        open={sheetOpen}
        draft={sheetDraftId ? (drafts[sheetDraftId]?.draft ?? null) : null}
        onClose={() => setSheetOpen(false)}
        onConfirm={confirm}
      />
    </Screen>
  )
}

function AgentConversationView({
  entries,
  isVisible,
  typing,
  onAction,
}: {
  entries: AgentEntry[]
  isVisible: (entry: AgentEntry, index: number) => boolean
  typing: boolean
  onAction: (entryId: string, action: AgentAction) => void
}) {
  const shown = entries
    .map((entry) => ({ entry, bubbles: entry.bubbles.filter((_, i) => isVisible(entry, i)) }))
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

const bubbleKey = (entry: AgentEntry, index: number) => `${entry.id}#${index}`

/**
 * 말풍선을 하나씩 보여 줍니다. 사용자 말풍선은 바로, AI 말풍선은 BUBBLE_GAP_MS마다 하나씩.
 * ready가 된 순간 있던 말풍선은 이미 본 것으로 치고(지난 대화), animateInitial이면 그것도 하나씩 보여 줍니다.
 * 말풍선 ID로 기억하므로 서버 대화가 다시 불러와지거나 순서가 바뀌어도 이미 본 말풍선은 그대로입니다.
 */
function useReveal(entries: AgentEntry[], ready: boolean, animateInitial: boolean) {
  const [seen, setSeen] = useState<ReadonlySet<string> | null>(null)
  const keys = entries.flatMap((e) =>
    e.bubbles.map((_, i) => ({ key: bubbleKey(e, i), from: e.from })),
  )
  const next = seen ? keys.find((k) => !seen.has(k.key)) : undefined

  /* 처음 준비됐을 때(렌더 중 상태 맞추기) */
  if (ready && seen === null) {
    setSeen(new Set(animateInitial ? [] : keys.map((k) => k.key)))
  }

  const nextKey = next?.key
  const nextFrom = next?.from
  useEffect(() => {
    if (!nextKey) return
    const timer = setTimeout(
      () => setSeen((prev) => new Set(prev).add(nextKey)),
      nextFrom === 'user' ? 0 : BUBBLE_GAP_MS,
    )
    return () => clearTimeout(timer)
  }, [nextKey, nextFrom])

  return {
    isVisible: (entry: AgentEntry, index: number) => seen?.has(bubbleKey(entry, index)) ?? false,
    revealing: nextFrom === 'agent',
  }
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
