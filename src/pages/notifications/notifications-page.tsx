import type { ReactNode } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { auctionKeys, getAuctionDetail } from '@/api/auctions'
import { useNotificationsInfiniteQuery, useReadNotificationMutation } from '@/api/notifications'
import type { Notification, NotificationType } from '@/api/schemas/notifications'
import { Header } from '@/components/ds'
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { usePressed } from '@/hooks/use-pressed'
import { Screen } from '@/layouts/screen'
import { formatDateTime } from '@/lib/format'

/** 알림을 누르면 갈 화면. 명세: resourceId 뜻이 타입마다 달라 type을 먼저 봅니다. */
const TARGET: Record<NotificationType, (n: Notification) => string> = {
  AUCTION_WON: (n) => `/auctions/${n.auctionId}/result`,
  BACKUP_OFFER_CREATED: (n) => `/backup-offers/${n.resourceId}`,
  PAYMENT_EXPIRED: (n) => `/orders/${n.resourceId}`,
  // resourceId = 구매 목표 ID. 목표별 화면 없이 PIKI 대화 하나에 모든 목표가 이어져 있어 대화로 갑니다.
  PURCHASE_AGENT_ENGAGED: () => '/agent',
  PURCHASE_AGENT_LOST: () => '/agent',
}

/**
 * 알림 (/notifications. Figma에 없음, DESIGN-CHANGES.md). 헤더 알림 아이콘으로 들어옵니다.
 * 최신순 무한 스크롤. 목록을 보는 것만으로는 읽음 처리되지 않고(명세), 누르면 읽음 처리한 뒤 관련 화면으로 갑니다.
 * 제목 자리에는 그 경매의 상품명을, 본문은 서버 문구를 그대로 씁니다(사용자 결정, 2026-11-03).
 */
export function NotificationsPage() {
  const query = useNotificationsInfiniteQuery({ size: 20 })
  const read = useReadNotificationMutation()
  const navigate = useNavigate()

  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled: query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError,
    onLoadMore: () => query.fetchNextPage(),
  })

  const items = query.data?.pages.flatMap((page) => page.notifications) ?? []
  const productNames = useProductNames(items.map((n) => n.auctionId))
  const open = (n: Notification) => {
    if (!n.readAt) read.mutate(n.id)
    navigate(TARGET[n.type](n))
  }

  let content: ReactNode
  if (query.isPending) {
    content = <NotificationsSkeleton />
  } else if (query.isLoadingError) {
    content = (
      <ErrorState
        title="알림을 불러오지 못했어요"
        retrying={query.isRefetching}
        onRetry={() => query.refetch()}
      />
    )
  } else if (items.length === 0) {
    content = (
      <EmptyState
        title="아직 알림이 없어요"
        description="낙찰 · 결제 소식이 생기면 여기에서 알려드릴게요"
      />
    )
  } else {
    content = (
      <>
        <ul className="divide-gray1 -mx-layout-gutter flex flex-col divide-y">
          {items.map((n) => (
            <li key={n.id}>
              <NotificationItem
                notification={n}
                productName={productNames.get(n.auctionId)}
                onClick={() => open(n)}
              />
            </li>
          ))}
          {query.isFetchingNextPage && (
            <li>
              <NotificationsSkeleton count={2} />
            </li>
          )}
        </ul>
        <div ref={loadMoreRef} aria-hidden />
        {query.isFetchNextPageError && (
          <ErrorState
            title="더 불러오지 못했어요"
            description={null}
            onRetry={() => query.fetchNextPage()}
            className="py-0"
          />
        )}
      </>
    )
  }

  return (
    <Screen header={<Header title="알림" />} top="none">
      {content}
    </Screen>
  )
}

/**
 * 알림 응답에는 상품명이 없어(명세: auctionId만) 알림에 나온 경매의 상세를 불러 상품명을 찾습니다.
 * 같은 경매는 한 번만 부르고, 상세 캐시(auctionKeys.detail)를 함께 써서 알림을 눌러 상세로 가면 바로 그립니다.
 * 값: 상품명, 불러오는 중이면 undefined, 실패하면 null(서버 제목으로 대신)
 */
function useProductNames(auctionIds: number[]) {
  const ids = [...new Set(auctionIds)]
  const results = useQueries({
    queries: ids.map((auctionId) => ({
      queryKey: auctionKeys.detail(auctionId),
      queryFn: ({ signal }: { signal: AbortSignal }) => getAuctionDetail(auctionId, signal),
      staleTime: 5 * 60 * 1000,
    })),
  })
  return new Map(
    ids.map((id, i) => [id, results[i].isError ? null : results[i].data?.product.name]),
  )
}

/** 한 줄: (안 읽음 점) 상품명(body03) · 시각(caption01 gray5) → 4 → 본문(body05 gray6, 두 줄까지). 위아래 16 */
function NotificationItem({
  notification,
  productName,
  onClick,
}: {
  notification: Notification
  /** 불러오는 중이면 undefined, 못 불러왔으면 null(서버 제목으로 대신) */
  productName: string | null | undefined
  onClick: () => void
}) {
  const { pressed, handlers } = usePressed()
  const unread = !notification.readAt
  return (
    <button
      type="button"
      onClick={onClick}
      data-pressed={pressed ? '' : undefined}
      {...handlers}
      className="px-layout-gutter py-space-16 gap-stack-tight data-pressed:bg-gray0 focus-visible:outline-primary1 flex w-full flex-col text-left focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
      <span className="gap-space-8 flex w-full items-center justify-between">
        <span className="gap-space-8 flex min-w-0 items-center">
          {unread && (
            <>
              <span aria-hidden className="bg-primary1 size-1.5 shrink-0 rounded-full" />
              <span className="sr-only">안 읽음</span>
            </>
          )}
          <span
            className={
              unread ? 'text-body03 text-black0 truncate' : 'text-body04 text-gray6 truncate'
            }
          >
            {productName === undefined ? (
              /* 버튼 안이라 Skeleton(div) 대신 같은 모양의 span */
              <span
                aria-hidden
                className="bg-gray1 inline-block h-4 w-32 animate-pulse rounded-sm align-middle"
              />
            ) : (
              (productName ?? notification.title)
            )}
          </span>
        </span>
        <span className="text-caption01 text-gray5 shrink-0">
          {formatDateTime(new Date(notification.createdAt))}
        </span>
      </span>
      <span className="text-body05 text-gray6 line-clamp-2">{notification.body}</span>
    </button>
  )
}

function NotificationsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden className="flex flex-col">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="px-layout-gutter py-space-16 gap-space-8 flex flex-col">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  )
}
