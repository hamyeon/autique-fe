import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  useAuctionDetailQuery,
  useSimilarAuctionsQuery,
  useToggleAuctionLikeMutation,
} from '@/api/auctions'
import { isApiError } from '@/api/client'
import type { AuctionDetail, SimilarAuction } from '@/api/schemas/auctions'
import type { AuctionStatus } from '@/api/schemas/common'
import { AuctionGrid } from '@/components/auction-grid'
import type { ChipKind, InfoRowData } from '@/components/ds'
import {
  BottomButtonBar,
  Button,
  Chip,
  Divider,
  Header,
  InfoBanner,
  InfoRow,
  LoadMoreButton,
  SellerProfile,
  SummaryCard,
} from '@/components/ds'
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/feedback'
import { useNow } from '@/hooks/use-now'
import { Screen } from '@/layouts/screen'
import { formatDateTime, formatGrade, formatPrice } from '@/lib/format'
import { formatRemaining } from '@/lib/remaining-time'
import { DetailBodySkeleton, DetailTopSkeleton } from '@/pages/product-detail/detail-skeleton'
import { ImageCarousel } from '@/pages/product-detail/image-carousel'

const STATUS_CHIP: Record<AuctionStatus, { kind: ChipKind; label: string }> = {
  SCHEDULED: { kind: 'plan', label: '경매 예정' },
  LIVE: { kind: 'live', label: 'LIVE' },
  ENDED: { kind: 'finish', label: '경매 종료' },
  CANCELED: { kind: 'finish', label: '경매 취소' },
}

/** 상품 상세 (/products/:id, id = auctionId). Figma 경매 예정 661:3429 · 경매 중 661:3742 · 경매 종료 661:4446 */
export function ProductDetailPage() {
  const { id } = useParams()
  const auctionId = Number(id)
  const valid = Number.isInteger(auctionId) && auctionId > 0
  /* 비슷한 상품으로 다른 상세에 가면 이미지 위치 · 펼침 상태를 새로 시작합니다. */
  return <ProductDetail key={auctionId} auctionId={auctionId} valid={valid} />
}

function ProductDetail({ auctionId, valid }: { auctionId: number; valid: boolean }) {
  const navigate = useNavigate()
  const detail = useAuctionDetailQuery(auctionId, { enabled: valid })
  const toggleLike = useToggleAuctionLikeMutation()

  const notFound =
    !valid || (detail.isError && isApiError(detail.error) && detail.error.status === 404)
  const data = notFound ? undefined : detail.data
  const loaded = !!data && !detail.isPlaceholderData

  const header = (
    <Header
      title="경매 상품"
      trailing={data ? 'favorite' : undefined}
      favorited={data?.isLiked}
      onFavorite={data ? () => toggleLike.mutate({ auctionId, liked: !data.isLiked }) : undefined}
    />
  )

  if (notFound) {
    return (
      <Screen header={header} className="justify-center">
        <EmptyState
          title="상품을 찾을 수 없어요"
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

  if (!data) {
    return (
      <Screen header={header} top="none">
        {detail.isError ? (
          <ErrorState
            title="상품 정보를 불러오지 못했어요"
            retrying={detail.isFetching}
            onRetry={() => detail.refetch()}
            className="flex-1 justify-center"
          />
        ) : (
          <>
            <DetailTopSkeleton />
            <div className="mt-layout-section">
              <DetailBodySkeleton />
            </div>
          </>
        )}
      </Screen>
    )
  }

  return (
    <Screen
      header={header}
      top="none"
      bottom={loaded && hasBottomAction(data) ? <DetailBottom detail={data} /> : undefined}
    >
      <ImageCarousel images={data.product.imageUrls} alt={data.product.name} />
      <div className="mt-layout-section gap-layout-section flex flex-col">
        {loaded ? (
          /* refetch는 렌더마다 같은 함수라 시작 시각이 지났을 때 한 번만 다시 불러옵니다. */
          <DetailBody detail={data} onRefetch={detail.refetch} />
        ) : (
          <>
            <TitleBlock detail={data} />
            <DetailBodySkeleton />
          </>
        )}
        {loaded && <SimilarSection auctionId={auctionId} />}
      </div>
    </Screen>
  )
}

/** 칩 줄(상태 + 등급, 간격 4) → 8 → 상품명(head02) + 영문명(body05 gray5) */
function TitleBlock({ detail }: { detail: AuctionDetail }) {
  const chip = STATUS_CHIP[detail.status]
  const grade = formatGrade(detail.product.grade)
  return (
    <div className="gap-space-8 flex flex-col">
      <div className="gap-space-4 flex">
        <Chip kind={chip.kind}>{chip.label}</Chip>
        {grade && <Chip kind="level">{grade}</Chip>}
      </div>
      <div className="flex flex-col">
        <h2 className="text-head02 text-black0">{detail.product.name}</h2>
        {detail.product.subName && (
          <p className="text-body05 text-gray5">{detail.product.subName}</p>
        )}
      </div>
    </div>
  )
}

function DetailBody({ detail, onRefetch }: { detail: AuctionDetail; onRefetch: () => unknown }) {
  const navigate = useNavigate()
  const { status } = detail
  const toLive = () => navigate(`/auctions/${detail.auctionId}/live`)

  /* 종료된 경매는 날짜를 '2026년 9월 30일 오후 8시'로, 그 밖에는 '오늘 오후 8시'처럼 (Figma) */
  const relative = status === 'SCHEDULED' || status === 'LIVE'
  const rows: InfoRowData[] = [
    {
      label: '경매 시작',
      value: formatDateTime(new Date(detail.startsAt), { relative }),
      emphasis: 'regular',
    },
    {
      label: '경매 종료',
      value: formatDateTime(new Date(detail.endsAt), { relative }),
      emphasis: 'regular',
    },
    { label: '시작가', value: formatPrice(detail.startPrice) },
    { label: '최소 입찰 단위', value: formatPrice(detail.bidIncrement) },
  ]
  if (status === 'LIVE') {
    rows.push(
      detail.bidCount > 0
        ? {
            label: '현재 최고 입찰가',
            value: formatPrice(detail.currentPrice),
            emphasis: 'primary',
          }
        : { label: '현재 최고 입찰가', value: '입찰 없음', emphasis: 'regular' },
    )
  }
  if (status === 'ENDED') {
    rows.push(
      detail.finalPrice != null
        ? { label: '최종 낙찰가', value: formatPrice(detail.finalPrice), emphasis: 'primary' }
        : { label: '최종 낙찰가', value: '유찰', emphasis: 'regular' },
    )
  }

  return (
    <>
      {/* 제목 → 12 → 구분선 → 16 → 정보 행 → 16 → 더보기 */}
      <div className="gap-space-16 flex flex-col">
        <div className="gap-stack-related flex flex-col">
          <TitleBlock detail={detail} />
          <Divider />
        </div>
        <div className="gap-space-8 flex flex-col">
          {rows.map((row) => (
            <InfoRow key={String(row.label)} {...row} />
          ))}
        </div>
        {status === 'LIVE' && (
          <LoadMoreButton onClick={toLive}>실시간 경매 상황 자세히 보기</LoadMoreButton>
        )}
        {status === 'ENDED' && (
          <LoadMoreButton onClick={toLive}>입찰 내역 자세히 보기</LoadMoreButton>
        )}
      </div>

      {status === 'SCHEDULED' && <ScheduledSummary detail={detail} onStarted={onRefetch} />}

      {detail.aiPriceReason && (
        <DetailSection title="AI 가격 산정 근거" divider>
          {/* Figma처럼 전체 문단을 보여줍니다. 줄바꿈(\n)은 그대로 */}
          <p className="text-body05 text-gray6 whitespace-pre-line">{detail.aiPriceReason}</p>
        </DetailSection>
      )}

      {/* 판매자 설명 → 프로필 간격은 AI 가격 산정 근거 → 판매자 설명과 같은 24(layout-section) */}
      <div className="gap-layout-section flex flex-col">
        <DetailSection title="판매자 설명">
          {detail.description && (
            <p className="text-body05 text-gray6 whitespace-pre-line">{detail.description}</p>
          )}
        </DetailSection>
        <SellerProfile
          name={detail.seller.nickname}
          meta={`누적 판매 건수 ${detail.seller.completedSalesCount}회`}
          avatar={detail.seller.profileImageUrl ?? undefined}
        />
      </div>
    </>
  )
}

/** 경매 예정: SummaryCard(primary) → 12 → InfoBanner */
function ScheduledSummary({
  detail,
  onStarted,
}: {
  detail: AuctionDetail
  onStarted: () => unknown
}) {
  const now = useNow(1000)
  const remaining = Date.parse(detail.startsAt) - now
  const started = remaining <= 0

  /* 시작 시각이 지나면 상태(LIVE)를 다시 받아 화면을 바꿉니다. */
  useEffect(() => {
    if (started) onStarted()
  }, [started, onStarted])

  const { myState } = detail
  let state = '자동 입찰 예약 전'
  if (myState.isSeller) state = '내가 등록한 경매'
  else if (myState.autoBidStatus === 'RESERVED') state = '자동 입찰 예약 완료'

  return (
    <div className="gap-stack-related flex flex-col">
      <SummaryCard
        tone="primary"
        dividerAfter={2}
        rows={[
          { label: '상태', value: state, emphasis: 'regular' },
          {
            label: 'AI 적정 시세',
            value:
              detail.aiEstimatedPrice != null ? formatPrice(detail.aiEstimatedPrice) : '산정 전',
            emphasis: 'hero',
          },
          { label: '경매 시작까지', value: formatRemaining(remaining, 'duration', '곧 시작') },
        ]}
      />
      <InfoBanner>경매 시작 전에도 자유롭게 자동 입찰을 예약할 수 있어요.</InfoBanner>
    </div>
  )
}

/** (구분선 → 16 →) 제목(body03) → 8 → 내용 */
function DetailSection({
  title,
  divider = false,
  children,
}: {
  title: string
  divider?: boolean
  children?: ReactNode
}) {
  return (
    <section className="gap-space-16 flex flex-col">
      {divider && <Divider />}
      <div className="gap-space-8 flex flex-col">
        <h3 className="text-body03 text-black0">{title}</h3>
        {children}
      </div>
    </section>
  )
}

/** 구분선 → 16 → '비슷한 상품 보기' → 16 → ProductCard 2열. 없으면 섹션을 숨깁니다. */
function SimilarSection({ auctionId }: { auctionId: number }) {
  const similar = useSimilarAuctionsQuery(auctionId)
  const toggleLike = useToggleAuctionLikeMutation()
  const onToggleLike = (item: SimilarAuction) =>
    toggleLike.mutate({ auctionId: item.auctionId, liked: !item.isLiked })

  let content: ReactNode
  if (similar.isPending) content = <ProductGridSkeleton />
  else if (similar.isError)
    content = (
      <ErrorState
        title="비슷한 상품을 불러오지 못했어요"
        description={null}
        retrying={similar.isFetching}
        onRetry={() => similar.refetch()}
        className="py-0"
      />
    )
  else if (similar.data.items.length === 0) return null
  else content = <AuctionGrid items={similar.data.items} onToggleLike={onToggleLike} />

  return (
    <section className="gap-space-16 flex flex-col">
      <Divider />
      <h3 className="text-body03 text-black0">비슷한 상품 보기</h3>
      {content}
    </section>
  )
}

/** 경매 종료에는 할 수 있는 행동이 없어 하단 버튼을 두지 않습니다(DESIGN-CHANGES.md). */
function hasBottomAction(detail: AuctionDetail) {
  return detail.status === 'SCHEDULED' || detail.status === 'LIVE'
}

/**
 * 하단 버튼. 경매 예정 · 경매 중은 Figma대로 '자동 입찰 예약'(바텀시트는 입찰 작업에서 연결),
 * 판매자 본인이면 잠급니다.
 */
function DetailBottom({ detail }: { detail: AuctionDetail }) {
  return (
    <BottomButtonBar
      layout="single"
      primaryLabel="자동 입찰 예약"
      primaryDisabled={detail.myState.isSeller}
    />
  )
}
