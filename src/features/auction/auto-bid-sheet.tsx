import { useRef, useState } from 'react'
import {
  useCreateAutoBidMutation,
  useInvalidateAutoBid,
  useUpdateMyAutoBidMutation,
} from '@/api/auto-bids'
import { isApiError } from '@/api/client'
import type { MyAutoBid } from '@/features/auction/auto-bid'
import {
  DEFAULT_BID_INCREMENT,
  canOnlyRaise,
  hasErrorCode,
  isRetryableError,
} from '@/features/auction/auto-bid'
import { BidAmountSheet } from '@/features/auction/bid-amount-sheet'
import { formatNumber, formatPrice } from '@/lib/format'
import { createUuid } from '@/lib/uuid'

export interface AutoBidSheetProps {
  open: boolean
  /** 딤 · 끌어내리기 · 저장 성공 · 종료 안내 확인 때 호출됩니다. */
  onClose: () => void
  auctionId: number
  /** 지금 현재가. 상한가 최솟값 = 현재가 + 최소 입찰 단위 */
  currentPrice: number
  /** 최소 입찰 단위(명세 bidIncrement). 없으면 5,000원 */
  bidIncrement?: number | null
  /** 이미 설정한 자동 입찰. 있으면 그 상한가로 시작하고 수정 API를 씁니다. */
  myAutoBid?: MyAutoBid | null
  /** 'AI 적정 시세' 행. 없으면 현재가 행을 보여줍니다. */
  aiEstimatedPrice?: number | null
  /** 처음 설정할 때의 시작값(명세 aiRecommendedAutoBidCap). 없으면 최솟값 */
  recommendedCap?: number | null
  /** 저장에 성공하면(상세 · 실시간 데이터를 다시 받은 뒤) 호출됩니다. */
  onSaved?: () => void
}

type SheetError =
  /** 금액 때문에 실패: 스테퍼 테두리 + 아래 문구. 값을 고치면 사라집니다. */
  | { target: 'amount'; message: string }
  /** 요청 실패: 캡션 아래 문구. retry면 버튼이 '다시 시도'가 됩니다. */
  | { target: 'request'; message: string; retry: boolean }

/**
 * 자동 입찰 상한가 설정 · 수정 바텀시트(Figma 572:5760 · 572:5902). 골격은 BidAmountSheet(직접 입찰 시트와 같이 씀).
 * 상품 상세와 실시간 경매 화면에서 함께 씁니다.
 * 성공하면 자동입찰 · 상세 · 실시간 · 입찰 이력 쿼리를 다시 불러온 뒤 닫힙니다.
 */
export function AutoBidSheet({
  open,
  onClose,
  auctionId,
  currentPrice,
  bidIncrement,
  myAutoBid = null,
  aiEstimatedPrice,
  recommendedCap,
  onSaved,
}: AutoBidSheetProps) {
  const increment = bidIncrement && bidIncrement > 0 ? bidIncrement : DEFAULT_BID_INCREMENT
  const minCap = currentPrice + increment
  const raiseOnly = canOnlyRaise(myAutoBid)
  /* 경매 중 수정은 지금 상한가 아래로 내릴 수 없습니다. 현재가가 바뀌면(다시 불러오면) 최솟값도 따라 올라갑니다. */
  const min = raiseOnly && myAutoBid ? Math.max(minCap, myAutoBid.maxAmount) : minCap
  const initial = myAutoBid?.maxAmount ?? recommendedCap ?? minCap

  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState<SheetError | null>(null)
  const [ended, setEnded] = useState(false)
  /** 다시 시도할 때 같은 금액이면 같은 Idempotency-Key를 씁니다(명세: 동일 논리 요청 retry 시 재사용). */
  const [attempt, setAttempt] = useState<{ amount: number; key: string } | null>(null)

  /* 열 때마다 처음 상태로 */
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setDraft(initial)
      setError(null)
      setEnded(false)
      setAttempt(null)
    }
  }

  const create = useCreateAutoBidMutation(auctionId)
  const update = useUpdateMyAutoBidMutation(auctionId)
  const invalidate = useInvalidateAutoBid(auctionId)
  const pending = create.isPending || update.isPending
  /* 리렌더 전에 두 번 눌러도 요청은 한 번만 */
  const submitting = useRef(false)

  const amount = Math.max(draft, min)
  const unchanged = raiseOnly && myAutoBid !== null && amount <= myAutoBid.maxAmount

  const handleError = (e: unknown) => {
    if (hasErrorCode(e, 'AUCTION_CLOSED')) {
      setEnded(true)
      return
    }
    if (hasErrorCode(e, 'CAP_TOO_LOW')) {
      // 그사이 다른 입찰(또는 시작가 수정)으로 현재가가 올랐습니다. 최신 현재가를 받아 최솟값을 올립니다.
      setError({
        target: 'amount',
        message: '그사이 현재가가 올라서 상한가를 더 높게 정해야 해요.',
      })
      void invalidate()
      return
    }
    if (hasErrorCode(e, 'CAP_NOT_INCREASED')) {
      setError({
        target: 'amount',
        message: '경매가 진행 중이라 상한가를 지금보다 높게만 바꿀 수 있어요.',
      })
      void invalidate()
      return
    }
    if (hasErrorCode(e, 'AUTO_BID_ALREADY_EXISTS', 'AUTO_BID_NOT_FOUND')) {
      // 다른 기기에서 바꾼 경우. 최신 설정을 받아 등록 · 수정을 다시 고릅니다.
      setError({
        target: 'request',
        message: '자동 입찰 설정이 바뀌어서 최신 정보로 다시 불러왔어요.',
        retry: false,
      })
      void invalidate()
      return
    }
    if (hasErrorCode(e, 'SELLER_CANNOT_BID')) {
      setError({
        target: 'request',
        message: '내가 등록한 경매에는 자동 입찰을 설정할 수 없어요.',
        retry: false,
      })
      return
    }
    if (hasErrorCode(e, 'PENALTY_RESTRICTED')) {
      setError({ target: 'request', message: '지금은 경매 참여가 제한돼 있어요.', retry: false })
      return
    }
    const offline = isApiError(e) && (e.kind === 'network' || e.kind === 'timeout')
    setError({
      target: 'request',
      message: offline
        ? '연결이 불안정해서 자동 입찰을 설정하지 못했어요.'
        : '일시적인 문제로 자동 입찰을 설정하지 못했어요.',
      retry: isRetryableError(e),
    })
  }

  const submit = async () => {
    if (submitting.current || unchanged) return
    submitting.current = true
    const key = attempt?.amount === amount ? attempt.key : createUuid()
    setAttempt({ amount, key })
    setError(null)
    try {
      const variables = { body: { maxAmount: amount }, idempotencyKey: key }
      if (myAutoBid) await update.mutateAsync(variables)
      else await create.mutateAsync(variables)
      onSaved?.()
      onClose()
    } catch (e) {
      handleError(e)
    } finally {
      submitting.current = false
    }
  }

  /* 종료 안내를 보고 닫으면 상세를 다시 불러와 종료 화면으로 바꿉니다. */
  const close = () => {
    if (ended) void invalidate()
    onClose()
  }

  const unit = `${formatNumber(increment)}원`
  let primaryLabel = '자동 입찰 승인'
  if (pending) primaryLabel = '설정하는 중이에요'
  else if (error?.target === 'request' && error.retry) primaryLabel = '다시 시도'

  return (
    <BidAmountSheet
      open={open}
      onClose={close}
      title="자동 입찰 상한가 설정"
      notice={
        ended
          ? {
              title: '경매가 종료됐어요',
              message:
                '자동 입찰을 설정하는 사이에 경매가 끝나서 최신 경매 정보를 다시 불러올게요.',
            }
          : null
      }
      banner={`설정한 금액은 실제 결제 금액이 아니에요. 다른 입찰자가 나타나면 ${unit}씩 자동으로 입찰하고, 이때 설정한 상한가를 넘지 않아요.`}
      infoRow={
        aiEstimatedPrice != null
          ? { label: 'AI 적정 시세', value: formatPrice(aiEstimatedPrice), emphasis: 'primary' }
          : { label: '현재가', value: formatPrice(currentPrice) }
      }
      stepperLabel="내 자동 입찰 상한가"
      value={amount}
      onChange={(next) => {
        setDraft(next)
        if (error?.target === 'amount') setError(null)
      }}
      min={min}
      step={increment}
      amountError={error?.target === 'amount' ? error.message : null}
      caption={`상한가는 현재가보다 ${unit} 이상 높게 정할 수 있어요. 입찰은 ${unit}씩 올라가고, 실제 결제 금액은 경쟁 상황에 따라 달라져요.${raiseOnly ? ' 경매가 진행 중이라 지금 상한가보다 높게만 바꿀 수 있어요.' : ''}`}
      requestError={error?.target === 'request' ? error.message : null}
      primaryLabel={primaryLabel}
      primaryDisabled={pending || unchanged}
      onSubmit={submit}
    />
  )
}
