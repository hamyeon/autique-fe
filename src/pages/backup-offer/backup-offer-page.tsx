import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import {
  backupOfferKeys,
  useAcceptBackupOfferMutation,
  useBackupOfferQuery,
  useDeclineBackupOfferMutation,
} from '@/api/backup-offers'
import { isApiError } from '@/api/client'
import type { BackupOffer } from '@/api/schemas/backup-offers'
import type { ChipKind } from '@/components/ds'
import { BottomButtonBar, BottomSheet, Header } from '@/components/ds'
import { hasErrorCode } from '@/features/auction/auto-bid'
import { BrowseBottom, PurchaseStateScreen } from '@/features/purchase/purchase-screen'
import { isPastDeadline } from '@/features/purchase/purchase'
import { PurchaseSummary } from '@/features/purchase/purchase-summary'
import { useNow } from '@/hooks/use-now'
import { createUuid } from '@/lib/uuid'
import { Screen } from '@/layouts/screen'
import { formatDateTime, formatPrice } from '@/lib/format'

/**
 * 차순위 구매 기회 (/backup-offers/:id, id = backupOfferId. Figma 396:6814).
 * 제안의 deadline을 '결제 기한' 행으로 보여줍니다(사용자 결정, 2026-11-03. 명세상 deadline은 수락 기한이고
 * 실제 결제 기한은 수락한 뒤 생기는 주문에 정해짐, DESIGN-CHANGES.md). 수락하면 주문이 생겨 결제 화면으로 바꿔 넣습니다.
 */
export function BackupOfferPage() {
  const backupOfferId = Number(useParams().id)
  const offer = useBackupOfferQuery(backupOfferId)

  if (!offer.data) {
    return (
      <PurchaseStateScreen
        title="차순위 구매 기회"
        invalid={!Number.isInteger(backupOfferId)}
        pending={offer.isPending}
        error={offer.error}
        notFoundTitle="구매 기회를 찾을 수 없어요"
        errorTitle="구매 기회를 불러오지 못했어요"
        retrying={offer.isRefetching}
        onRetry={() => offer.refetch()}
      />
    )
  }
  return <OfferContent offer={offer.data} receivedAt={offer.dataUpdatedAt} />
}

function OfferContent({ offer, receivedAt }: { offer: BackupOffer; receivedAt: number }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const now = useNow(1000)
  const accept = useAcceptBackupOfferMutation(offer.backupOfferId)
  /* 같은 수락을 다시 보낼 때는 같은 Idempotency-Key를 씁니다(명세). */
  const acceptKey = useRef(createUuid())
  const [declineOpen, setDeclineOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expired =
    offer.status === 'EXPIRED' ||
    (offer.status === 'WAITING' &&
      isPastDeadline(offer.deadline, { serverTime: offer.serverTime, receivedAt, now }))
  const waiting = offer.status === 'WAITING' && !expired
  const deadline = formatDateTime(new Date(offer.deadline))

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: backupOfferKeys.detail(offer.backupOfferId) })

  const submit = async () => {
    setError(null)
    try {
      const { orderId } = await accept.mutateAsync(acceptKey.current)
      navigate(`/orders/${orderId}`, { replace: true })
    } catch (e) {
      if (hasErrorCode(e, 'BACKUP_OFFER_EXPIRED', 'BACKUP_OFFER_ALREADY_RESOLVED')) {
        await refresh()
        return
      }
      const offline = isApiError(e) && (e.kind === 'network' || e.kind === 'timeout')
      setError(
        offline ? '연결이 불안정해서 구매하지 못했어요.' : '일시적인 문제로 구매하지 못했어요.',
      )
    }
  }

  let status: { chip: { kind: ChipKind; label: string }; title: string }
  if (waiting) {
    status = {
      chip: { kind: 'recommend', label: '차순위 구매 대기' },
      title: '차순위 구매 기회가\n도착했어요',
    }
  } else if (offer.status === 'ACCEPTED') {
    status = { chip: { kind: 'best', label: '구매 수락' }, title: '구매를 수락했어요' }
  } else if (offer.status === 'DECLINED') {
    status = { chip: { kind: 'finish', label: '구매 포기' }, title: '차순위 구매를 포기했어요' }
  } else {
    status = { chip: { kind: 'caution', label: '기한 만료' }, title: '구매 기한이 지났어요' }
  }

  let bottom
  if (waiting) {
    let label = `${formatPrice(offer.totalAmount)}에 구매하기`
    if (accept.isPending) label = '구매하는 중이에요'
    else if (error) label = '다시 시도'
    bottom = (
      <BottomButtonBar
        layout="primaryDanger"
        dangerLabel="구매 포기하기"
        onDanger={() => setDeclineOpen(true)}
        primaryLabel={label}
        primaryDisabled={accept.isPending}
        onPrimary={() => void submit()}
      />
    )
  } else if (offer.status === 'ACCEPTED') {
    /* 수락으로 생긴 주문은 경매 결과(WON)의 orderId로 찾아 결제합니다. */
    bottom = (
      <BottomButtonBar
        layout="single"
        primaryLabel="결제하러 가기"
        onPrimary={() => navigate(`/auctions/${offer.auctionId}/result`)}
      />
    )
  } else {
    /* 포기함 · 기한 만료: 결제할 수 없어 다른 상품 둘러보기만(사용자 결정) */
    bottom = <BrowseBottom />
  }

  return (
    <Screen header={<Header title="차순위 구매 기회" />} bottom={bottom}>
      <PurchaseSummary
        product={offer.product}
        auctionId={offer.auctionId}
        chip={status.chip}
        title={status.title}
        rows={[
          { label: '구매 가능 금액', value: formatPrice(offer.purchasePrice) },
          { label: '배송비', value: formatPrice(offer.shippingFee) },
          { label: '결제할 금액', value: formatPrice(offer.totalAmount), emphasis: 'total' },
          ...(waiting
            ? [{ label: '결제 기한', value: deadline, emphasis: 'regular' as const }]
            : []),
        ]}
        dividerAfter={2}
        notice={
          waiting
            ? `마지막으로 입찰한 금액으로 상품을 구매할 수 있어요. ${deadline}까지 구매하지 않으면 다음 입찰자에게 구매 기회가 넘어가요.`
            : undefined
        }
      />
      {error && (
        <p role="alert" className="text-caption01 text-error1 mt-stack-related">
          {error}
        </p>
      )}
      <DeclineSheet
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        backupOfferId={offer.backupOfferId}
        onResolved={refresh}
      />
    </Screen>
  )
}

/** 차순위 구매 포기 확인 */
function DeclineSheet({
  open,
  onClose,
  backupOfferId,
  onResolved,
}: {
  open: boolean
  onClose: () => void
  backupOfferId: number
  onResolved: () => Promise<unknown>
}) {
  const decline = useDeclineBackupOfferMutation(backupOfferId)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setError(null)
    try {
      await decline.mutateAsync()
      onClose()
    } catch (e) {
      if (hasErrorCode(e, 'BACKUP_OFFER_EXPIRED', 'BACKUP_OFFER_ALREADY_RESOLVED')) {
        await onResolved()
        onClose()
        return
      }
      const offline = isApiError(e) && (e.kind === 'network' || e.kind === 'timeout')
      setError(
        offline ? '연결이 불안정해서 포기하지 못했어요.' : '일시적인 문제로 포기하지 못했어요.',
      )
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="구매 기회를 포기할까요?"
      footer={
        <BottomButtonBar
          layout="double"
          primaryLabel={decline.isPending ? '포기하는 중이에요' : error ? '다시 시도' : '포기하기'}
          primaryDisabled={decline.isPending}
          onPrimary={() => void confirm()}
          secondaryLabel="돌아가기"
          onSecondary={onClose}
        />
      }
    >
      <p className="text-body05 text-gray6">포기하면 이 상품을 다시 구매할 수 없어요.</p>
      {error && (
        <p role="alert" className="text-caption01 text-error1">
          {error}
        </p>
      )}
    </BottomSheet>
  )
}
