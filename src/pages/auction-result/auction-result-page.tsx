import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate, useParams } from 'react-router'
import {
  auctionKeys,
  useAuctionDetailQuery,
  useAuctionResultQuery,
  useForfeitAwardMutation,
} from '@/api/auctions'
import { isApiError } from '@/api/client'
import { usePenaltiesQuery } from '@/api/me'
import type { AuctionResult } from '@/api/schemas/auctions'
import type { InfoRowData } from '@/components/ds'
import { BottomButtonBar, BottomSheet, Header } from '@/components/ds'
import { hasErrorCode } from '@/features/auction/auto-bid'
import { BrowseBottom, PurchaseStateScreen } from '@/features/purchase/purchase-screen'
import type { PurchaseSummaryProps } from '@/features/purchase/purchase-summary'
import { NO_SHOW_NOTICE, isPastDeadline, penaltyRows } from '@/features/purchase/purchase'
import { PurchaseSummary } from '@/features/purchase/purchase-summary'
import { useNow } from '@/hooks/use-now'
import { Screen } from '@/layouts/screen'
import { formatDateTime, formatPrice } from '@/lib/format'

/**
 * 경매 결과 (/auctions/:id/result, id = auctionId). 실시간 경매가 끝나면 이리로 replace 이동합니다.
 * 결과(명세 result)마다 Figma 낙찰 396:5865 · 차순위 입찰자 396:6204 · 결제 기한 만료 396:6776 모양으로 그리고,
 * Figma에 없는 결과(결제 완료 · 패찰 · 유찰 · 구매 포기)는 같은 틀에 문구만 바꿉니다(DESIGN-CHANGES.md).
 * 차순위 제안을 받은 경우(BACKUP_WAITING)는 차순위 구매 기회 화면으로 바꿔 보냅니다.
 */
export function AuctionResultPage() {
  const auctionId = Number(useParams().id)
  const result = useAuctionResultQuery(auctionId)

  if (!result.data) {
    return (
      <PurchaseStateScreen
        title="경매 결과"
        invalid={!Number.isInteger(auctionId)}
        pending={result.isPending}
        error={result.error}
        notFoundTitle="경매 결과를 찾을 수 없어요"
        errorTitle="경매 결과를 불러오지 못했어요"
        retrying={result.isRefetching}
        onRetry={() => result.refetch()}
      />
    )
  }

  const data = result.data
  if (data.result === 'BACKUP_WAITING' && data.backupOfferId != null) {
    return <Navigate to={`/backup-offers/${data.backupOfferId}`} replace />
  }
  return <ResultContent result={data} receivedAt={result.dataUpdatedAt} />
}

function ResultContent({ result, receivedAt }: { result: AuctionResult; receivedAt: number }) {
  if (result.result === 'WON') return <WonContent result={result} receivedAt={receivedAt} />
  if (result.result === 'FORFEITED' || result.result === 'PAYMENT_EXPIRED') {
    return <PenaltyContent result={result} />
  }
  return <EndedContent result={result} />
}

/** 패찰(차순위 후보 포함) · 참여하지 않은 경매 · 유찰 · 차순위 제안 ID가 없는 BACKUP_WAITING */
function EndedContent({ result }: { result: AuctionResult }) {
  const participated = result.myLastBidAmount != null
  const detail = useAuctionDetailQuery(result.auctionId, {
    enabled: !participated && result.result !== 'NO_BIDS',
  })
  const eligible = result.backupEligible || result.result === 'BACKUP_WAITING'
  let summary: Omit<PurchaseSummaryProps, 'product' | 'auctionId'>
  if (result.result === 'NO_BIDS') {
    summary = { chip: { kind: 'plan', label: '경매 종료' }, title: '입찰 없이 경매가 끝났어요' }
  } else if (!participated) {
    /* 참여하지 않은 경매(사용자 결정, 2026-11-03): 시작가 · 최종 낙찰가 | 현재 결과. 시작가는 결과 응답에 없어 상세에서 */
    summary = {
      chip: { kind: 'plan', label: '경매 종료' },
      title: '경매가 종료되었어요',
      rows: [
        ...(detail.data ? [{ label: '시작가', value: formatPrice(detail.data.startPrice) }] : []),
        ...finalPriceRow(result),
        { label: '현재 결과', value: '참여하지 않은 경매', emphasis: 'regular' },
      ],
      dividerAfter: detail.data ? 2 : 1,
    }
  } else {
    summary = {
      chip: eligible
        ? { kind: 'recommend', label: '차순위 입찰자' }
        : { kind: 'finish', label: '패찰' },
      title: '경매가 종료되었어요',
      rows: [
        ...finalPriceRow(result),
        { label: '내 마지막 입찰가', value: formatPrice(result.myLastBidAmount!) },
        eligible
          ? { label: '현재 결과', value: '차순위 입찰자', emphasis: 'totalDanger' }
          : { label: '현재 결과', value: '패찰', emphasis: 'regular' },
      ],
      dividerAfter: 2,
      notice: eligible ? '낙찰자가 결제하지 않을 경우 구매 기회가 제공될 수 있어요.' : undefined,
    }
  }

  return (
    <Screen header={<Header title="경매 결과" />} bottom={<BrowseBottom />}>
      <PurchaseSummary product={result.product} auctionId={result.auctionId} {...summary} />
    </Screen>
  )
}

function finalPriceRow(result: AuctionResult): InfoRowData[] {
  return result.finalPrice != null
    ? [{ label: '최종 낙찰가', value: formatPrice(result.finalPrice) }]
    : []
}

/** 낙찰(Figma 396:5865). 결제할 수 있으면 구매 포기(빨강) · 결제(검정), 아니면(결제 완료 · 기한 지남) 다른 상품 둘러보기 */
function WonContent({ result, receivedAt }: { result: AuctionResult; receivedAt: number }) {
  const navigate = useNavigate()
  const now = useNow(1000)
  const [forfeitOpen, setForfeitOpen] = useState(false)

  const paid = result.orderStatus === 'PAID'
  const pending = result.orderStatus === 'PAYMENT_PENDING'
  /* 명세: 결제 기한(paymentDeadline)이 서버 시각보다 이전이면 결제 버튼을 막습니다. */
  const expired =
    result.paymentDeadline != null &&
    isPastDeadline(result.paymentDeadline, { serverTime: result.serverTime, receivedAt, now })

  const price = result.finalPrice
  const rows: InfoRowData[] = [
    ...finalPriceRow(result),
    ...(result.shippingFee != null
      ? [{ label: '배송비', value: formatPrice(result.shippingFee) }]
      : []),
    ...(result.totalAmount != null
      ? [
          {
            label: paid ? '결제한 금액' : '결제할 금액',
            value: formatPrice(result.totalAmount),
            emphasis: 'total' as const,
          },
        ]
      : []),
  ]

  let notice: string | undefined
  if (pending && result.paymentDeadline) {
    notice = expired
      ? '결제 기한이 지났어요. 낙찰이 취소되고 차순위 입찰자에게 구매 기회가 넘어가요.'
      : `${formatDateTime(new Date(result.paymentDeadline))}까지 결제를 완료해 주세요. 기한 내에 결제하지 않으면 낙찰이 취소되고 차순위 입찰자에게 구매 기회가 넘어가요.`
  }

  const payable = pending && !expired && result.orderId != null && result.totalAmount != null
  const bottom = payable ? (
    <BottomButtonBar
      layout="primaryDanger"
      dangerLabel="구매 포기하기"
      onDanger={() => setForfeitOpen(true)}
      primaryLabel={`${formatPrice(result.totalAmount!)} 결제하기`}
      onPrimary={() => navigate(`/orders/${result.orderId}`)}
    />
  ) : (
    <BrowseBottom />
  )

  return (
    <Screen header={<Header title="경매 결과" />} bottom={bottom}>
      <PurchaseSummary
        product={result.product}
        auctionId={result.auctionId}
        chip={paid ? { kind: 'best', label: '결제 완료' } : { kind: 'best', label: '낙찰' }}
        title={
          paid ? (
            '결제가 완료된 상품이에요'
          ) : (
            <>
              축하합니다!
              {price != null && (
                <span className="text-primary1 block">{formatPrice(price)}에 낙찰되었어요</span>
              )}
            </>
          )
        }
        rows={rows}
        dividerAfter={rows.length - 1}
        notice={notice}
      />
      <ForfeitSheet
        open={forfeitOpen}
        onClose={() => setForfeitOpen(false)}
        auctionId={result.auctionId}
      />
    </Screen>
  )
}

/** 낙찰 포기 확인. 포기하면 결과가 FORFEITED로 바뀌어 페널티 화면이 됩니다. */
function ForfeitSheet({
  open,
  onClose,
  auctionId,
}: {
  open: boolean
  onClose: () => void
  auctionId: number
}) {
  const forfeit = useForfeitAwardMutation(auctionId)
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setError(null)
    try {
      await forfeit.mutateAsync()
      onClose()
    } catch (e) {
      if (hasErrorCode(e, 'ALREADY_PAID', 'PAYMENT_EXPIRED', 'NOT_AWARDEE')) {
        // 그사이 결제했거나 기한이 지났습니다. 결과를 다시 불러오면 그 상태로 바뀝니다.
        await queryClient.invalidateQueries({ queryKey: auctionKeys.result(auctionId) })
        onClose()
        return
      }
      const offline = isApiError(e) && (e.kind === 'network' || e.kind === 'timeout')
      setError(
        offline
          ? '연결이 불안정해서 구매를 포기하지 못했어요.'
          : '일시적인 문제로 구매를 포기하지 못했어요.',
      )
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="구매를 포기할까요?"
      footer={
        <BottomButtonBar
          layout="double"
          primaryLabel={forfeit.isPending ? '포기하는 중이에요' : error ? '다시 시도' : '포기하기'}
          primaryDisabled={forfeit.isPending}
          onPrimary={() => void confirm()}
          secondaryLabel="돌아가기"
          onSecondary={onClose}
        />
      }
    >
      <p className="text-body05 text-gray6">
        포기하면 노쇼로 기록되고 일정 기간 경매에 참여할 수 없어요. 구매 기회는 차순위 입찰자에게
        넘어가요.
      </p>
      {error && (
        <p role="alert" className="text-caption01 text-error1">
          {error}
        </p>
      )}
    </BottomSheet>
  )
}

/** 결제 기한 만료(Figma 396:6776) · 구매 포기: 노쇼 누적과 이용 제한(GET /api/me/penalties) */
function PenaltyContent({ result }: { result: AuctionResult }) {
  const penalties = usePenaltiesQuery()
  const expired = result.result === 'PAYMENT_EXPIRED'

  const rows = penalties.data ? penaltyRows(penalties.data) : undefined

  return (
    <Screen header={<Header title="경매 결과" />} bottom={<BrowseBottom />}>
      <PurchaseSummary
        auctionId={result.auctionId}
        product={result.product}
        chip={
          expired
            ? { kind: 'caution', label: '결제 기한 만료' }
            : { kind: 'caution', label: '구매 포기' }
        }
        title={expired ? '결제 기한이 만료되어\n낙찰 권한이 취소되었어요' : '구매를 포기했어요'}
        rows={rows}
        dividerAfter={2}
        notice={expired ? NO_SHOW_NOTICE : undefined}
        noticeTone="error"
      />
    </Screen>
  )
}
