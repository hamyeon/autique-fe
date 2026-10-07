import { z } from 'zod'
import { dateTimeSchema, pageMetaSchema, pageQuerySchema } from '@/api/schemas/common'

export const notificationTypeSchema = z.enum([
  'AUCTION_WON',
  'BACKUP_OFFER_CREATED',
  'PAYMENT_EXPIRED',
])
export type NotificationType = z.infer<typeof notificationTypeSchema>

/* ───────── GET /api/notifications (최신순 고정) ───────── */

export const notificationListQuerySchema = pageQuerySchema
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>

export const notificationSchema = z.object({
  id: z.number().int(),
  type: notificationTypeSchema,
  auctionId: z.number().int(),
  /** 이벤트를 발생시킨 Order 또는 BackupOffer ID */
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
