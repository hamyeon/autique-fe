import type { Notification, NotificationType } from '@/api/schemas/notifications'
import { HOUR, fromNow, kst } from '@/mocks/data/common'

/* 알림 목 데이터. 페이지 넘김을 확인할 수 있게 20개보다 많이 둡니다(최신순). */

interface MockNotification {
  id: number
  type: NotificationType
  auctionId: number
  resourceId: number
  title: string
  body: string
  readAt: number | null
  createdAt: number
}

const COPY: Record<NotificationType, { title: string; body: string }> = {
  AUCTION_WON: { title: '낙찰되었습니다', body: '낙찰되었습니다. 결제를 진행해주세요.' },
  BACKUP_OFFER_CREATED: {
    title: '차순위 구매 기회가 생겼어요',
    body: '1순위 낙찰자가 구매를 포기했어요. 24시간 안에 구매를 결정해주세요.',
  },
  PAYMENT_EXPIRED: {
    title: '결제 기한이 만료되었어요',
    body: '결제 기한이 지나 낙찰이 취소되었습니다.',
  },
}

const SEED: Pick<MockNotification, 'type' | 'auctionId' | 'resourceId'>[] = [
  { type: 'AUCTION_WON', auctionId: 3, resourceId: 50 },
  { type: 'BACKUP_OFFER_CREATED', auctionId: 5, resourceId: 90 },
  { type: 'PAYMENT_EXPIRED', auctionId: 6, resourceId: 51 },
]

export const notifications: MockNotification[] = Array.from({ length: 24 }, (_, i) => {
  const seed = SEED[i % SEED.length]
  const createdAt = fromNow(-(i + 1) * 2 * HOUR)
  return {
    id: 100 - i,
    ...seed,
    ...COPY[seed.type],
    // 최근 3개만 안 읽음
    readAt: i < 3 ? null : createdAt + HOUR,
    createdAt,
  }
})

export function findNotification(id: number) {
  return notifications.find((n) => n.id === id)
}

export function toNotification(n: MockNotification): Notification {
  return { ...n, readAt: n.readAt ? kst(n.readAt) : null, createdAt: kst(n.createdAt) }
}
