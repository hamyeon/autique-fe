import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { auctionKeys, useCancelAuctionMutation, useUpdateStartPriceMutation } from '@/api/auctions'
import { isApiError } from '@/api/client'
import type { AuctionDetail } from '@/api/schemas/auctions'
import { AmountStepper, BottomButtonBar, BottomSheet, InfoBanner } from '@/components/ds'
import { DEFAULT_BID_INCREMENT, hasErrorCode } from '@/features/auction/auto-bid'
import { formatNumber, formatPrice } from '@/lib/format'

/*
 * 내가 등록한 경매의 상품 상세 하단(판매자 관리, Figma에 없음 · DESIGN-CHANGES.md).
 * - 경매 예정: 한 줄에 검정 '시작가 수정'(시작 1시간 전까지) + 흰 '경매 취소'(시작 전까지)
 * - 유찰(입찰 없이 종료) · 취소된 경매: 검정 '재경매 등록' → 재경매 화면(상품당 등록 최대 2회, 서버가 판정)
 * - 그 밖(진행 중 · 입찰이 있던 종료)은 할 수 있는 일이 없어 하단을 두지 않습니다(상품 상세 hasBottomAction).
 */

const HOUR_MS = 60 * 60 * 1000

export function SellerBottom({ detail }: { detail: AuctionDetail }) {
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<'cancel' | 'price' | null>(null)

  if (detail.status !== 'SCHEDULED') {
    return (
      <BottomButtonBar
        layout="single"
        primaryLabel="재경매 등록"
        onPrimary={() => navigate(`/products/${detail.auctionId}/relist`)}
      />
    )
  }

  /* 명세: 시작가 수정은 시작 1시간 전까지(40922). 서버 시각 기준으로 미리 막고, 경계는 서버 응답으로 처리합니다. */
  const priceEditable = Date.parse(detail.startsAt) - Date.parse(detail.serverTime) > HOUR_MS

  return (
    <>
      <BottomButtonBar
        layout="double"
        primaryLabel={priceEditable ? '시작가 수정' : '시작가 수정 마감'}
        primaryDisabled={!priceEditable}
        onPrimary={() => setSheet('price')}
        secondaryLabel="경매 취소"
        onSecondary={() => setSheet('cancel')}
      />
      <CancelAuctionSheet
        open={sheet === 'cancel'}
        onClose={() => setSheet(null)}
        auctionId={detail.auctionId}
      />
      <StartPriceSheet
        /* 열 때마다 지금 시작가부터 */
        key={sheet === 'price' ? 'open' : 'closed'}
        open={sheet === 'price'}
        onClose={() => setSheet(null)}
        detail={detail}
      />
    </>
  )
}

function failureMessage(e: unknown, action: string) {
  const offline = isApiError(e) && (e.kind === 'network' || e.kind === 'timeout')
  return offline ? `연결이 불안정해서 ${action} 못했어요.` : `일시적인 문제로 ${action} 못했어요.`
}

/** 경매 취소 확인. 취소한 경매도 등록 횟수(상품당 2회)에 들어갑니다(명세). */
function CancelAuctionSheet({
  open,
  onClose,
  auctionId,
}: {
  open: boolean
  onClose: () => void
  auctionId: number
}) {
  const cancel = useCancelAuctionMutation(auctionId)
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setError(null)
    try {
      await cancel.mutateAsync()
      onClose()
    } catch (e) {
      if (hasErrorCode(e, 'CANCEL_NOT_ALLOWED')) {
        // 그사이 경매가 시작됐습니다. 상세를 다시 불러오면 그 상태로 바뀝니다.
        await queryClient.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) })
        onClose()
        return
      }
      setError(failureMessage(e, '경매를 취소하지'))
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="경매를 취소할까요?"
      footer={
        <BottomButtonBar
          layout="double"
          primaryLabel={cancel.isPending ? '취소하는 중이에요' : error ? '다시 시도' : '취소하기'}
          primaryDisabled={cancel.isPending}
          onPrimary={() => void confirm()}
          secondaryLabel="돌아가기"
          onSecondary={onClose}
        />
      }
    >
      <p className="text-body05 text-gray6">
        취소한 경매도 상품당 최대 2번인 경매 등록 횟수에 들어가요. 취소한 뒤에는 재경매로 다시
        등록할 수 있어요.
      </p>
      {error && (
        <p role="alert" className="text-caption01 text-error1">
          {error}
        </p>
      )}
    </BottomSheet>
  )
}

/** 시작가 수정(등록 4/6 가격 수정 시트와 같은 모양). 입찰 단위로 조정, 0보다 커야 함 */
function StartPriceSheet({
  open,
  onClose,
  detail,
}: {
  open: boolean
  onClose: () => void
  detail: AuctionDetail
}) {
  const update = useUpdateStartPriceMutation(detail.auctionId)
  const step = detail.bidIncrement || DEFAULT_BID_INCREMENT
  const [price, setPrice] = useState(detail.startPrice)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    try {
      await update.mutateAsync({ startPrice: price })
      onClose()
    } catch (e) {
      if (hasErrorCode(e, 'START_PRICE_EDIT_CLOSED')) {
        setError('경매 시작 1시간 전이 지나 시작가를 바꿀 수 없어요.')
        return
      }
      setError(failureMessage(e, '시작가를 바꾸지'))
    }
  }

  const unchanged = price === detail.startPrice
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="경매 시작가 수정"
      footer={
        <BottomButtonBar
          layout="single"
          primaryLabel={update.isPending ? '바꾸는 중이에요' : '이 가격으로 수정하기'}
          primaryDisabled={unchanged || update.isPending}
          onPrimary={() => void submit()}
        />
      }
    >
      <InfoBanner>경매 시작 1시간 전까지 시작가를 바꿀 수 있어요.</InfoBanner>
      <AmountStepper
        label="시작가"
        value={price}
        onChange={setPrice}
        min={step}
        step={step}
        hint={`지금 시작가 ${formatPrice(detail.startPrice)} · ${formatNumber(step)}원 단위로 조정할 수 있어요.`}
        error={error}
      />
    </BottomSheet>
  )
}
