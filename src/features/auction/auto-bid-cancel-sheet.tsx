import { useRef, useState } from 'react'
import { useCancelMyAutoBidMutation, useInvalidateAutoBid } from '@/api/auto-bids'
import { isApiError } from '@/api/client'
import { BottomButtonBar, BottomSheet } from '@/components/ds'
import type { MyAutoBid } from '@/features/auction/auto-bid'
import { hasErrorCode } from '@/features/auction/auto-bid'

export interface AutoBidCancelSheetProps {
  open: boolean
  onClose: () => void
  auctionId: number
  /** 취소할 자동 입찰. 시작 전(RESERVED)이면 '예약 취소', 진행 중이면 '중단' 문구 */
  myAutoBid: MyAutoBid
  /** 취소에 성공하면(데이터를 다시 받은 뒤) 호출됩니다. */
  onCanceled?: () => void
}

/** 자동 입찰 예약 취소 · 중단 확인 시트(Figma에 없음, DESIGN-CHANGES.md). 상세와 실시간 경매 화면에서 함께 씁니다. */
export function AutoBidCancelSheet({
  open,
  onClose,
  auctionId,
  myAutoBid,
  onCanceled,
}: AutoBidCancelSheetProps) {
  const reserved = myAutoBid.status === 'RESERVED'
  const cancel = useCancelMyAutoBidMutation(auctionId)
  const invalidate = useInvalidateAutoBid(auctionId)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setError(null)
  }

  const confirm = async () => {
    if (submitting.current) return
    submitting.current = true
    setError(null)
    try {
      await cancel.mutateAsync()
      onCanceled?.()
      onClose()
    } catch (e) {
      if (hasErrorCode(e, 'AUTO_BID_NOT_FOUND', 'AUCTION_CLOSED')) {
        // 이미 취소됐거나 경매가 끝났습니다. 최신 상태로 바꾸고 닫습니다.
        await invalidate()
        onClose()
        return
      }
      const offline = isApiError(e) && (e.kind === 'network' || e.kind === 'timeout')
      const action = reserved ? '예약을 취소하지' : '자동 입찰을 중단하지'
      setError(
        offline ? `연결이 불안정해서 ${action} 못했어요.` : `일시적인 문제로 ${action} 못했어요.`,
      )
    } finally {
      submitting.current = false
    }
  }

  let primaryLabel = reserved ? '예약 취소하기' : '중단하기'
  if (cancel.isPending) primaryLabel = reserved ? '취소하는 중이에요' : '중단하는 중이에요'
  else if (error) primaryLabel = '다시 시도'

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={reserved ? '자동 입찰 예약을 취소할까요?' : '자동 입찰을 중단할까요?'}
      footer={
        <BottomButtonBar
          layout="double"
          primaryLabel={primaryLabel}
          primaryDisabled={cancel.isPending}
          onPrimary={confirm}
          secondaryLabel="돌아가기"
          onSecondary={onClose}
        />
      }
    >
      <p className="text-body05 text-gray6">
        {reserved
          ? '취소해도 경매가 시작되기 전까지 언제든 다시 예약할 수 있어요.'
          : '중단해도 이미 들어간 입찰은 그대로 남고, 경매가 끝나기 전까지 다시 설정할 수 있어요.'}
      </p>
      {error && (
        <p role="alert" className="text-caption01 text-error1">
          {error}
        </p>
      )}
    </BottomSheet>
  )
}
