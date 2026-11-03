import { z } from 'zod'
import { dateTimeSchema, pageMetaSchema, pageQuerySchema } from '@/api/schemas/common'

/**
 * resourceId 뜻이 타입마다 다릅니다(항상 주문 ID가 아님).
 * AUCTION_WON · PAYMENT_EXPIRED: 주문 ID / BACKUP_OFFER_CREATED: 차순위 제안 ID / PURCHASE_AGENT_*: 구매 목표 ID
 */
export const notificationTypeSchema = z.enum([
  'AUCTION_WON',
  'BACKUP_OFFER_CREATED',
  'PAYMENT_EXPIRED',
  /** 구매 에이전트가 조건에 맞는 경매에 자동입찰을 등록(시작 전 예약 포함, 경매 시작을 뜻하지 않음) */
  'PURCHASE_AGENT_ENGAGED',
  /** 에이전트가 참여한 경매의 패배 · 취소가 목표에 반영됨 */
  'PURCHASE_AGENT_LOST',
])
export type NotificationType = z.infer<typeof notificationTypeSchema>

/* ───────── GET /api/notifications (최신순 고정) ───────── */

export const notificationListQuerySchema = pageQuerySchema
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>

export const notificationSchema = z.object({
  id: z.number().int(),
  type: notificationTypeSchema,
  auctionId: z.number().int(),
  /** 타입에 따라 주문 · 차순위 제안 · 구매 목표 ID(notificationTypeSchema 참고) */
  resourceId: z.number().int(),
  title: z.string(),
  body: z.string(),
  /** 읽지 않았으면 null */
  readAt: dateTimeSchema.nullish(),
  createdAt: dateTimeSchema,
})
export type Notification = z.infer<typeof notificationSchema>

export const notificationListSchema = pageMetaSchema.extend({
  notifications: z.array(notificationSchema),
})
export type NotificationList = z.infer<typeof notificationListSchema>

/* ───────── PATCH /api/notifications/{notificationId}/read ───────── */

/** 이미 읽은 알림이면 최초 읽은 시각을 그대로 돌려줍니다. */
export const readNotificationResponseSchema = z.object({
  notificationId: z.number().int(),
  readAt: dateTimeSchema,
})
export type ReadNotificationResponse = z.infer<typeof readNotificationResponseSchema>

/* ───────── GET /api/notifications/unread-count ───────── */

export const unreadNotificationCountSchema = z.object({
  unreadCount: z.number().int(),
})
export type UnreadNotificationCount = z.infer<typeof unreadNotificationCountSchema>
