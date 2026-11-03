import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { isApiError } from '@/api/client'
import { usePenaltiesQuery } from '@/api/me'
import { orderKeys, useOrderQuery, usePayOrderMutation } from '@/api/orders'
import type { Order } from '@/api/schemas/orders'
import type { InfoRowData, RadioOption } from '@/components/ds'
import { BottomButtonBar, Header, RadioList } from '@/components/ds'
import { hasErrorCode } from '@/features/auction/auto-bid'
import { BrowseBottom, PurchaseStateScreen } from '@/features/purchase/purchase-screen'
import { NO_SHOW_NOTICE, isPastDeadline, penaltyRows } from '@/features/purchase/purchase'
import { PurchaseSummary } from '@/features/purchase/purchase-summary'
import { useNow } from '@/hooks/use-now'
import { Screen } from '@/layouts/screen'
import kakaoPayBadge from '@/assets/illustrations/img_kakao_pay.png'
import naverPayBadge from '@/assets/illustrations/img_naver_pay.png'
import { formatDateTime, formatPrice } from '@/lib/format'

/**
 * 결제 (/orders/:id, id = orderId. Figma 396:6406). 최초 낙찰자와 차순위 수락자가 같은 화면을 씁니다.
 * 결제 수단은 고르기만 하고 서버로 보내지 않습니다(명세: Mock 결제, POST .../pay 본문 없음).
 * 결제 대기가 아니면(결제 완료 · 기한 만료 · 취소) 같은 틀에 상태만 보여줍니다(Figma에 없음, DESIGN-CHANGES.md).
 */
export function OrderPage() {
  const orderId = Number(useParams().id)
  const order = useOrderQuery(orderId)

  if (!order.data) {
    return (
      <PurchaseStateScreen
        title="결제"
        invalid={!Number.isInteger(orderId)}
        pending={order.isPending}
        error={order.error}
        notFoundTitle="주문을 찾을 수 없어요"
        errorTitle="주문 정보를 불러오지 못했어요"
        retrying={order.isRefetching}
        onRetry={() => order.refetch()}
      />
    )
  }
  return <OrderContent order={order.data} receivedAt={order.dataUpdatedAt} />
}

const PAYMENT_METHODS: RadioOption[] = [
  { value: 'card', label: '신용/체크카드' },
  { value: 'kakao', label: '카카오페이', badge: kakaoPayBadge },
  { value: 'naver', label: '네이버페이', badge: naverPayBadge },
  { value: 'etc', label: '기타 결제' },
]

/** 상품 금액 라벨. 명세: 유형을 모르면(null) 최초 낙찰 · 차순위 문구를 쓰지 않습니다. */
const PRICE_LABEL = {
  WINNER: '최종 낙찰가',
  BACKUP_ACCEPT: '구매 가능 금액',
} as const

function OrderContent({ order, receivedAt }: { order: Order; receivedAt: number }) {
  const navigate = useNavigate()
  const now = useNow(1000)
  const pay = usePayOrderMutation(order.orderId)
  const queryClient = useQueryClient()
  const [method, setMethod] = useState('card')
  const [error, setError] = useState<string | null>(null)

  const pending = order.status === 'PAYMENT_PENDING'
  const expired =
    pending &&
    isPastDeadline(order.paymentDeadline, { serverTime: order.serverTime, receivedAt, now })
  const paid = order.status === 'PAID'
  /* 결제 기한 만료(노쇼): 경매 결과의 결제 기한 만료 화면처럼 노쇼 누적 · 이용 제한을 보여줍니다(사용자 결정, 2026-11-03). */
  const noShow = order.status === 'PAYMENT_EXPIRED' || expired
  const penalties = usePenaltiesQuery({ enabled: noShow })

  /* 상품 금액은 주문의 purchasePrice(카드의 currentPrice가 아님) */
  const rows: InfoRowData[] = [
    {
      label: order.orderType ? PRICE_LABEL[order.orderType] : '구매 금액',
      value: formatPrice(order.purchasePrice),
    },
    { label: '배송비', value: formatPrice(order.shippingFee) },
    {
      label: paid ? '결제한 금액' : '결제할 금액',
      value: formatPrice(order.totalAmount),
      emphasis: 'total',
    },
  ]
  if (pending) {
    rows.push({
      label: '결제 기한',
      value: formatDateTime(new Date(order.paymentDeadline)),
      emphasis: expired ? 'danger' : 'regular',
    })
  }
  if (paid && order.paidAt) {
    rows.push({
      label: '결제 시각',
      value: formatDateTime(new Date(order.paidAt)),
      emphasis: 'regular',
    })
  }

  const submit = async () => {
    setError(null)
    try {
      await pay.mutateAsync()
      navigate(`/orders/${order.orderId}/complete`, { replace: true })
    } catch (e) {
      if (hasErrorCode(e, 'ALREADY_PAID')) {
        navigate(`/orders/${order.orderId}/complete`, { replace: true })
        return
      }
      if (hasErrorCode(e, 'PAYMENT_EXPIRED', 'ORDER_CANCELED')) {
        // 그사이 기한이 지났거나 취소됐습니다. 주문을 다시 불러오면 그 상태로 바뀝니다.
        await queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.orderId) })
        return
      }
      const offline = isApiError(e) && (e.kind === 'network' || e.kind === 'timeout')
      setError(
        offline ? '연결이 불안정해서 결제하지 못했어요.' : '일시적인 문제로 결제하지 못했어요.',
      )
    }
  }

  /* 결제할 수 있을 때만 결제 버튼, 아니면(결제 완료 · 기한 만료 · 취소) 다른 상품 둘러보기(사용자 결정) */
  let bottom
  if (pending && !expired) {
    let label = `${formatPrice(order.totalAmount)} 결제하기`
    if (pay.isPending) label = '결제하는 중이에요'
    else if (error) label = '다시 시도'
    bottom = (
      <BottomButtonBar
        layout="single"
        primaryLabel={label}
        primaryDisabled={pay.isPending}
        onPrimary={() => void submit()}
      />
    )
  } else {
    bottom = <BrowseBottom />
  }

  let status: {
    chip: { kind: 'best' | 'caution' | 'finish'; label: string }
    title: string
  } | null = null
  if (paid) status = { chip: { kind: 'best', label: '결제 완료' }, title: '결제가 완료되었어요' }
  else if (noShow)
    status = {
      chip: { kind: 'caution', label: '결제 기한 만료' },
      title: '결제 기한이 만료되어\n낙찰 권한이 취소되었어요',
    }
  else if (order.status === 'CANCELED')
    status = { chip: { kind: 'finish', label: '주문 취소' }, title: '취소된 주문이에요' }

  return (
    <Screen header={<Header title={paid ? '주문 상세' : '결제'} />} bottom={bottom}>
      <div className="gap-layout-section flex flex-col">
        <PurchaseSummary
          product={order.product}
          auctionId={order.auctionId}
          chip={status?.chip}
          title={status?.title}
          rows={noShow ? (penalties.data ? penaltyRows(penalties.data) : undefined) : rows}
          dividerAfter={2}
          notice={noShow ? NO_SHOW_NOTICE : undefined}
          noticeTone="error"
        />
        {pending && !expired && (
          <section className="gap-section-title flex flex-col">
            <h3 className="text-body03 text-black0">결제 수단</h3>
            <RadioList
              label="결제 수단"
              options={PAYMENT_METHODS}
              value={method}
              onChange={setMethod}
            />
            {error && (
              <p role="alert" className="text-caption01 text-error1">
                {error}
              </p>
            )}
          </section>
        )}
      </div>
    </Screen>
  )
}
