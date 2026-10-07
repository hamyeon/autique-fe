import { endpoints } from '@/api/endpoints'
import { findNotification, notifications, toNotification } from '@/mocks/data/notifications'
import { idParam, mockEndpoint, pageParams, paginate } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

export const notificationHandlers = [
  mockEndpoint(endpoints.getNotifications, {
    error: mockErrors.UNAUTHORIZED,
    empty: ({ query, ok }) => ok({ notifications: [], ...pageParams(query), hasNext: false }),
    resolve: ({ query, ok }) => {
      const { page, size } = pageParams(query)
      const { items, ...meta } = paginate(notifications.map(toNotification), page, size)
      return ok({ notifications: items, ...meta })
    },
  }),

  /** 이미 읽었으면 최초 readAt 유지 */
  mockEndpoint(endpoints.readNotification, {
    error: mockErrors.NOTIFICATION_NOT_FOUND,
    resolve: ({ params, ok, fail }) => {
      const notification = findNotification(idParam(params, 'notificationId'))
      if (!notification) return fail(mockErrors.NOTIFICATION_NOT_FOUND)
      notification.readAt ??= Date.now()
      return ok({ notificationId: notification.id, readAt: toNotification(notification).readAt! })
    },
  }),

  mockEndpoint(endpoints.getUnreadNotificationCount, {
    error: mockErrors.UNAUTHORIZED,
    empty: ({ ok }) => ok({ unreadCount: 0 }),
    resolve: ({ ok }) => ok({ unreadCount: notifications.filter((n) => n.readAt === null).length }),
  }),
]
