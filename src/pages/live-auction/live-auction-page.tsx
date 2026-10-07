import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { isApiError } from '@/api/client'
import type { AuctionLive, Bid } from '@/api/schemas/auctions'
import type { AuctionStatusCardProps, InfoRowData } from '@/components/ds'
import { AuctionStatusCard, BottomButtonBar, Button, Header, InfoBanner } from '@/components/ds'
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback'
import type { MyAutoBid } from '@/features/auction/auto-bid'
import { toMyAutoBid } from '@/features/auction/auto-bid'
import { AutoBidCancelSheet } from '@/features/auction/auto-bid-cancel-sheet'
import { AutoBidSheet } from '@/features/auction/auto-bid-sheet'
import { DirectBidSheet } from '@/features/auction/direct-bid-sheet'
import { useLiveAuction } from '@/features/auction/use-live-auction'
import { Screen } from '@/layouts/screen'
import { formatNumber, formatPrice } from '@/lib/format'
import { formatRemaining } from '@/lib/remaining-time'
import { BidHistory } from '@/pages/live-auction/bid-history'

/** 실시간 경매 (/auctions/:id/live, id = auctionId). Figma 최고가 395:4340 · 상한가 초과 396:5402 · 참여 전 397:7805 */
export function LiveAuctionPage() {
  const { id } = useParams()
  const auctionId = Number(id)
  const valid = Number.isInteger(auctionId) && auctionId > 0
  return <LiveAuction key={auctionId} auctionId={auctionId} valid={valid} />
}

function LiveAuction({ auctionId, valid }: { auctionId: number; valid: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { live, bids, remainingMs, timeUp } = useLiveAuction(auctionId, { enabled: valid })

  const toDetail = () => navigate(`/products/${auctionId}`, { replace: true })
  /* 상품 상세에서 들어오므로 이전 화면으로. 주소로 바로 열었으면(기록 없음) 그 상품 상세로 */
  const header = (
    <Header
      title="실시간 경매"
      trailing="live"
      onBack={() => (location.key === 'default' ? toDetail() : navigate(-1))}
    />
  )

  /* 서버가 종료를 확인하면 결과 화면으로(뒤로 가기로 다시 오지 않게 replace) */
  const status = live.data?.status
  useEffect(() => {
    if (status === 'ENDED') navigate(`/auctions/${auctionId}/result`, { replace: true })
  }, [status, auctionId, navigate])

  const notFound = !valid || (live.isError && isApiError(live.error) && live.error.status === 404)
  if (notFound) {
    return (
      <Screen header={header} className="justify-center">
        <EmptyState
          title="경매를 찾을 수 없어요"
          description="경매가 삭제되었거나 주소가 잘못되었어요."
          action={
            <Button
              variant="outline"
              block={false}
              onClick={() => navigate('/', { replace: true })}
            >
              홈으로
            </Button>
          }
        />
      </Screen>
    )
  }

  const data = live.data
  if (!data) {
    return (
      <Screen header={header}>
        {live.isError ? (
          <ErrorState
            title="경매 정보를 불러오지 못했어요"
            retrying={live.isFetching}
            onRetry={() => live.refetch()}
            className="flex-1 justify-center"
          />
        ) : (
          <LiveSkeleton />
        )}
      </Screen>
    )
  }

  if (data.status === 'SCHEDULED' || data.status === 'CANCELED') {
    return (
      <Screen header={header} className="justify-center">
        <EmptyState
          title={data.status === 'SCHEDULED' ? '아직 경매가 시작되지 않았어요' : '취소된 경매예요'}
          description={
            data.status === 'SCHEDULED' ? '경매가 시작되면 실시간 상황을 볼 수 있어요.' : undefined
          }
          action={
            <Button variant="outline" block={false} onClick={toDetail}>
              상품 상세로
            </Button>
          }
        />
      </Screen>
    )
  }

  return (
    <LiveContent
      header={header}
      live={data}
      bids={bids.data?.bids}
      bidsState={bids.data ? 'ready' : bids.isError ? 'error' : 'loading'}
      onRetryBids={() => bids.refetch()}
      retryingBids={bids.isFetching}
      remainingMs={remainingMs ?? 0}
      timeUp={timeUp || data.status === 'ENDED'}
    />
  )
}

/** 참여 전 / 내가 최고가 / 내가 밀림 */
type LiveView = 'watching' | 'leading' | 'exceeded'

function LiveContent({
  header,
  live,
  bids,
  bidsState,
  onRetryBids,
  retryingBids,
  remainingMs,
  timeUp,
}: {
  header: ReactNode
  live: AuctionLive
  bids: Bid[] | undefined
  bidsState: 'ready' | 'loading' | 'error'
  onRetryBids: () => void
  retryingBids: boolean
  remainingMs: number
  timeUp: boolean
}) {
  const [sheet, setSheet] = useState<'auto' | 'direct' | 'cancel' | null>(null)
  /* 중단에 성공하면 myAutoBid가 먼저 사라지므로, 닫히는 동안 연 시점의 설정으로 문구를 유지합니다. */
  const [cancelTarget, setCancelTarget] = useState<MyAutoBid | null>(null)

  const myAutoBid = toMyAutoBid(live.myAutoBidStatus, live.myCap)
  const myBids = (bids ?? []).filter((bid) => bid.isMine)
  /* 내 자동 입찰이 있거나, 내 입찰이 있거나, 내가 최고가면 참여 중 */
  const participated = myAutoBid !== null || myBids.length > 0 || live.isMine
  const view: LiveView = !participated ? 'watching' : live.isMine ? 'leading' : 'exceeded'
  const capReached = myAutoBid?.status === 'CAP_REACHED'
  const isSeller = live.cannotBidReason === 'SELLER_CANNOT_BID'

  const remaining = formatRemaining(remainingMs, 'clock')

  return (
    <Screen
      header={header}
      bottom={
        <LiveBottom
          view={view}
          myAutoBid={myAutoBid}
          isSeller={isSeller}
          timeUp={timeUp}
          onAutoBid={() => setSheet('auto')}
          onDirectBid={() => setSheet('direct')}
          onCancel={() => {
            setCancelTarget(myAutoBid)
            setSheet('cancel')
          }}
        />
      }
    >
      <div className="gap-layout-section flex flex-col">
        <AuctionStatusCard
          /* 상태가 바뀌어도 카드는 그대로 두고 색만 부드럽게 바꿉니다. */
          className="transition-colors duration-300"
          {...statusCardProps({ view, live, myAutoBid, myBids, remaining })}
        />

        <section className="gap-space-8 flex flex-col">
          <h2 className="text-body04 text-gray7">입찰 내역</h2>
          {bidsState === 'loading' && <BidRowsSkeleton />}
          {bidsState === 'error' && (
            <ErrorState
              title="입찰 내역을 불러오지 못했어요"
              description={null}
              retrying={retryingBids}
              onRetry={onRetryBids}
              className="py-space-24"
            />
          )}
          {bidsState === 'ready' && bids && bids.length === 0 && (
            <EmptyState
              title="아직 입찰이 없어요"
              description="첫 입찰자가 되어 보세요."
              className="py-space-24"
            />
          )}
          {bidsState === 'ready' && bids && bids.length > 0 && (
            <div className="gap-stack-related flex flex-col">
              <BidHistory bids={bids} outbid={view === 'exceeded'} />
              <LiveBanner view={view} myAutoBid={myAutoBid} capReached={capReached} />
            </div>
          )}
        </section>
      </div>

      <AutoBidSheet
        open={sheet === 'auto'}
        onClose={() => setSheet(null)}
        auctionId={live.auctionId}
        currentPrice={live.currentPrice}
        bidIncrement={live.bidIncrement}
        myAutoBid={myAutoBid}
      />
      <DirectBidSheet
        open={sheet === 'direct'}
        onClose={() => setSheet(null)}
        auctionId={live.auctionId}
        currentPrice={live.currentPrice}
        bidIncrement={live.bidIncrement}
        myAutoBid={myAutoBid}
        cannotBidReason={live.cannotBidReason}
      />
      {cancelTarget && (
        <AutoBidCancelSheet
          open={sheet === 'cancel'}
          onClose={() => setSheet(null)}
          auctionId={live.auctionId}
          myAutoBid={cancelTarget}
        />
      )}
    </Screen>
  )
}

/**
 * AuctionStatusCard 값(Figma).
 * - watching: 현재가(total) · 남은 시간 · 최소 다음 입찰가
 * - leading: '최고 입찰자 · 나', 남은 시간(danger), 자동 입찰이면 내 상한가 + 진행 바 + '현재가 / 상한가' 캡션
 * - exceeded: 상한가 도달(CAP_REACHED)이면 '상한가 초과' + 'X원 도달'(totalDanger), 그 밖에는 '입찰가 초과'
 */
function statusCardProps({
  view,
  live,
  myAutoBid,
  myBids,
  remaining,
}: {
  view: LiveView
  live: AuctionLive
  myAutoBid: MyAutoBid | null
  myBids: Bid[]
  remaining: string
}): AuctionStatusCardProps {
  const price = formatPrice(live.currentPrice)

  if (view === 'watching') {
    return {
      status: 'watching',
      price,
      rows: [
        { label: '남은 시간', value: remaining },
        { label: '최소 다음 입찰가', value: formatPrice(live.minNextBidAmount) },
      ],
    }
  }

  const timeRow: InfoRowData = { label: '남은 시간', value: remaining, emphasis: 'danger' }

  if (view === 'leading') {
    return {
      status: 'leading',
      price,
      badge: '최고 입찰자 · 나',
      rows: [timeRow],
      ...(myAutoBid && {
        extraRows: [{ label: '내 자동 입찰 상한가', value: formatPrice(myAutoBid.maxAmount) }],
        progress: live.currentPrice / myAutoBid.maxAmount,
        caption: `현재가 ${formatNumber(live.currentPrice)} / 상한가 ${formatNumber(myAutoBid.maxAmount)}`,
      }),
    }
  }

  let extraRows: InfoRowData[] = []
  if (myAutoBid?.status === 'CAP_REACHED') {
    extraRows = [
      {
        label: '내 자동 입찰 상한가',
        value: `${formatPrice(myAutoBid.maxAmount)} 도달`,
        emphasis: 'totalDanger',
      },
    ]
  } else if (myAutoBid) {
    extraRows = [{ label: '내 자동 입찰 상한가', value: formatPrice(myAutoBid.maxAmount) }]
  } else if (myBids.length > 0) {
    const myTop = Math.max(...myBids.map((bid) => bid.amount))
    extraRows = [{ label: '내 최고 입찰가', value: formatPrice(myTop) }]
  }
  return {
    status: 'exceeded',
    price,
    badge: myAutoBid?.status === 'CAP_REACHED' ? '상한가 초과' : '입찰가 초과',
    rows: [timeRow],
    extraRows,
  }
}

/** 입찰 내역 아래 안내. 참여 전에는 없고(Figma), 상한가 초과일 때만 error */
function LiveBanner({
  view,
  myAutoBid,
  capReached,
}: {
  view: LiveView
  myAutoBid: MyAutoBid | null
  capReached: boolean
}) {
  if (view === 'watching') return null
  if (view === 'leading') {
    return (
      <InfoBanner>
        {myAutoBid
          ? `현재 최고 입찰자예요. 다른 입찰자가 참여하면 최대 ${formatPrice(myAutoBid.maxAmount)}까지 자동으로 대응해요.`
          : '현재 최고 입찰자예요. 다른 입찰자가 더 높게 입찰하면 다시 입찰할 수 있어요.'}
      </InfoBanner>
    )
  }
  if (capReached) {
    return (
      <InfoBanner tone="error">
        다른 입찰자가 내 자동 입찰 상한가를 초과하는 금액을 입찰하여 자동 입찰이 종료되었어요. 계속
        참여하려면 상한가를 수정해 주세요.
      </InfoBanner>
    )
  }
  return (
    <InfoBanner>
      다른 입찰자가 더 높은 금액을 입찰했어요. 계속 참여하려면 다시 입찰해 주세요.
    </InfoBanner>
  )
}

/**
 * 하단 버튼.
 * - 참여 전 · 직접 입찰만 한 경우: '자동 입찰하기' / '직접 입찰하기'
 * - 자동 입찰 중(참여 후): triple '자동 입찰 상한가 수정' / '직접 입찰하기' · '입찰 중단하기'
 * - 카운트다운이 0이면 서버 종료 확인 전까지 비활성, 판매자 본인은 비활성
 */
function LiveBottom({
  view,
  myAutoBid,
  isSeller,
  timeUp,
  onAutoBid,
  onDirectBid,
  onCancel,
}: {
  view: LiveView
  myAutoBid: MyAutoBid | null
  isSeller: boolean
  timeUp: boolean
  onAutoBid: () => void
  onDirectBid: () => void
  onCancel: () => void
}) {
  if (timeUp) {
    return <BottomButtonBar layout="single" primaryLabel="경매가 종료됐어요" primaryDisabled />
  }
  if (isSeller) {
    return <BottomButtonBar layout="single" primaryLabel="내가 등록한 경매예요" primaryDisabled />
  }
  if (view !== 'watching' && myAutoBid) {
    return (
      <BottomButtonBar
        layout="triple"
        primaryLabel="자동 입찰 상한가 수정"
        onPrimary={onAutoBid}
        secondaryLabel="직접 입찰하기"
        onSecondary={onDirectBid}
        dangerLabel="입찰 중단하기"
        onDanger={onCancel}
      />
    )
  }
  return (
    <BottomButtonBar
      layout="double"
      primaryLabel="자동 입찰하기"
      onPrimary={onAutoBid}
      secondaryLabel="직접 입찰하기"
      onSecondary={onDirectBid}
    />
  )
}

function LiveSkeleton() {
  return (
    <div aria-hidden className="gap-layout-section flex flex-col">
      <Skeleton className="h-30 w-full" />
      <div className="gap-space-8 flex flex-col">
        <Skeleton className="h-4 w-16" />
        <BidRowsSkeleton />
      </div>
    </div>
  )
}

function BidRowsSkeleton() {
  return (
    <div aria-hidden className="gap-space-12 py-space-8 flex flex-col">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}
