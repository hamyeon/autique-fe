import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { auctionKeys, usePlaceBidMutation } from '@/api/auctions'
import { isApiError } from '@/api/client'
import type { CannotBidReason } from '@/api/schemas/common'
import type { MyAutoBid } from '@/features/auction/auto-bid'
import { DEFAULT_BID_INCREMENT, hasErrorCode, isRetryableError } from '@/features/auction/auto-bid'
import type { BidSheetNotice } from '@/features/auction/bid-amount-sheet'
import { BidAmountSheet } from '@/features/auction/bid-amount-sheet'
import { formatPrice } from '@/lib/format'
import { createUuid } from '@/lib/uuid'

export interface DirectBidSheetProps {
  open: boolean
  onClose: () => void
  auctionId: number
  /** 실시간 현재가. 열려 있는 동안 오르면 최솟값도 따라 오릅니다. */
  currentPrice: number
  /** 최소 입찰 단위(명세 bidIncrement). 없으면 5,000원 */
  bidIncrement?: number | null
  /** 진행 중인 내 자동 입찰. 있으면 '직접 입찰하면 자동 입찰이 중단돼요' 안내(명세 프론트 요구사항) */
  myAutoBid?: MyAutoBid | null
  /** 명세 cannotBidReason. 있으면 금액 입력 대신 이유를 안내합니다. */
  cannotBidReason?: CannotBidReason | null
}

/** 입찰할 수 없는 이유별 안내(해요체) */
const CANNOT_BID_NOTICE: Record<CannotBidReason, BidSheetNotice> = {
  ALREADY_HIGHEST_BIDDER: {
    title: '이미 최고 입찰자예요',
    message: '다른 입찰자가 더 높게 입찰하면 그때 다시 입찰할 수 있어요.',
  },
  AUCTION_NOT_STARTED: {
    title: '아직 경매가 시작되지 않았어요',
    message: '경매가 시작되면 직접 입찰할 수 있어요.',
  },
  AUCTION_CLOSED: {
    title: '경매가 종료됐어요',
    message: '경매가 끝나서 더 이상 입찰할 수 없어요.',
  },
  SELLER_CANNOT_BID: {
    title: '내가 등록한 경매예요',
    message: '내가 등록한 경매에는 입찰할 수 없어요.',
  },
  PENALTY_RESTRICTED: {
    title: '입찰이 제한돼 있어요',
    message: '페널티로 지금은 경매에 참여할 수 없어요.',
  },
}

const ENDED_NOTICE: BidSheetNotice = {
  title: '경매가 종료됐어요',
  message: '입찰하는 사이에 경매가 끝나서 결과를 확인하러 갈게요.',
}

/** 최솟값이 올랐다는 안내를 보여주는 시간 */
const MIN_RAISED_NOTICE_MS = 3000

/** 현재가에서 입찰 단위의 배수가 되도록 올립니다(명세 BID_NOT_ALIGNED 규칙). */
function alignUp(amount: number, currentPrice: number, step: number) {
  return currentPrice + Math.ceil((amount - currentPrice) / step) * step
}

type SheetError =
  { target: 'amount'; message: string } | { target: 'request'; message: string; retry: boolean }

/**
 * 직접 입찰 가격 설정 바텀시트(Figma 397:8018). 자동 입찰 시트와 같은 BidAmountSheet 골격을 씁니다.
 * 성공하면 내 입찰이 내역 맨 위에 먼저 보이고(낙관적), 응답을 받으면 시트가 닫힙니다.
 */
export function DirectBidSheet({
  open,
  onClose,
  auctionId,
  currentPrice,
  bidIncrement,
  myAutoBid = null,
  cannotBidReason = null,
}: DirectBidSheetProps) {
  const queryClient = useQueryClient()
  const step = bidIncrement && bidIncrement > 0 ? bidIncrement : DEFAULT_BID_INCREMENT
  const min = currentPrice + step

  const [draft, setDraft] = useState(min)
  const [error, setError] = useState<SheetError | null>(null)
  const [notice, setNotice] = useState<BidSheetNotice | null>(null)
  const [ended, setEnded] = useState(false)
  const [minRaised, setMinRaised] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<{ amount: number; key: string } | null>(null)

  /* 열 때마다 최솟값부터. 입찰할 수 없는 이유는 연 시점 기준(닫히는 동안 문구가 바뀌지 않게) */
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setDraft(min)
      setError(null)
      setEnded(false)
      setMinRaised(null)
      setAttempt(null)
      setNotice(cannotBidReason ? CANNOT_BID_NOTICE[cannotBidReason] : null)
    }
  }

  /* 열려 있는 동안 현재가가 올라 입력값이 최솟값보다 낮아지면 최솟값으로 올리고 짧게 알립니다. */
  const [prevMin, setPrevMin] = useState(min)
  if (min !== prevMin) {
    setPrevMin(min)
    if (open && min > prevMin && draft < min) {
      setDraft(min)
      setMinRaised(`현재가가 올라서 최소 입찰가를 ${formatPrice(min)}으로 올렸어요.`)
    }
  }
  useEffect(() => {
    if (!minRaised) return
    const id = window.setTimeout(() => setMinRaised(null), MIN_RAISED_NOTICE_MS)
    return () => window.clearTimeout(id)
  }, [minRaised])

  const placeBid = usePlaceBidMutation(auctionId)
  const submitting = useRef(false)
  const amount = alignUp(Math.max(draft, min), currentPrice, step)

  const refreshLive = () => queryClient.invalidateQueries({ queryKey: auctionKeys.live(auctionId) })

  const handleError = (e: unknown) => {
    if (hasErrorCode(e, 'AUCTION_CLOSED')) {
      setEnded(true)
      return
    }
    if (hasErrorCode(e, 'BID_AMOUNT_TOO_LOW')) {
      // 명세: live를 다시 불러 최신 현재가 · 최소 입찰가를 반영합니다(mutation onSettled에서 다시 불러옴).
      setError({
        target: 'amount',
        message: '그사이 더 높은 입찰이 들어와서 금액을 더 높게 정해야 해요.',
      })
      return
    }
    if (hasErrorCode(e, 'BID_NOT_ALIGNED')) {
      setError({ target: 'amount', message: '입찰 단위에 맞게 금액을 고쳤어요. 다시 눌러 주세요.' })
      return
    }
    const reason = (
      [
        'ALREADY_HIGHEST_BIDDER',
        'AUCTION_NOT_STARTED',
        'SELLER_CANNOT_BID',
        'PENALTY_RESTRICTED',
      ] as const
    ).find((name) => hasErrorCode(e, name))
    if (reason) {
      setNotice(CANNOT_BID_NOTICE[reason])
      return
    }
    const offline = isApiError(e) && (e.kind === 'network' || e.kind === 'timeout')
    setError({
      target: 'request',
      message: offline
        ? '연결이 불안정해서 입찰하지 못했어요.'
        : '일시적인 문제로 입찰하지 못했어요.',
      retry: isRetryableError(e),
    })
  }

  const submit = async () => {
    if (submitting.current) return
    submitting.current = true
    // 다시 시도할 때 금액이 같으면 같은 Idempotency-Key(명세: 동일 논리 요청 retry 시 재사용)
    const key = attempt?.amount === amount ? attempt.key : createUuid()
    setAttempt({ amount, key })
    setError(null)
    try {
      await placeBid.mutateAsync({ body: { amount }, idempotencyKey: key })
      onClose()
    } catch (e) {
      handleError(e)
    } finally {
      submitting.current = false
    }
  }

  /* 종료 안내를 닫으면 실시간 상태를 다시 받아 결과 화면으로 넘어갑니다. */
  const close = () => {
    if (ended || notice) void refreshLive()
    onClose()
  }

  let primaryLabel = '직접 입찰 경매 참여하기'
  if (placeBid.isPending) primaryLabel = '입찰하는 중이에요'
  else if (error?.target === 'request' && error.retry) primaryLabel = '다시 시도'

  const stopsAutoBid = myAutoBid !== null && myAutoBid.status !== 'RESERVED'

  return (
    <BidAmountSheet
      open={open}
      onClose={close}
      title="직접 입찰 가격 설정"
      notice={ended ? ENDED_NOTICE : notice}
      banner={
        stopsAutoBid
          ? '직접 입찰하면 지금 설정한 자동 입찰이 중단돼요.'
          : '입찰한 금액은 취소할 수 없고, 낙찰되면 이 금액으로 결제해요.'
      }
      value={amount}
      onChange={(next) => {
        setDraft(next)
        setMinRaised(null)
        if (error?.target === 'amount') setError(null)
      }}
      min={min}
      step={step}
      amountError={error?.target === 'amount' ? error.message : null}
      amountNotice={minRaised}
      requestError={error?.target === 'request' ? error.message : null}
      primaryLabel={primaryLabel}
      primaryDisabled={placeBid.isPending}
      onSubmit={submit}
    />
  )
}
