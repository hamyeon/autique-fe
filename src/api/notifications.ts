import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { NotificationListQuery } from '@/api/schemas/notifications'

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (query: Omit<NotificationListQuery, 'page'> = {}) =>
    [...notificationKeys.lists(), query] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

/* ───────── API 함수 ───────── */

/** 최신순 고정 */
export function getNotifications(query: NotificationListQuery = {}, signal?: AbortSignal) {
  return request(endpoints.getNotifications, { query, signal })
}

/** 이미 읽은 알림도 200, readAt은 최초 읽은 시각 그대로 */
export function readNotification(notificationId: number) {
  return request(endpoints.readNotification, { params: { notificationId } })
}

export function getUnreadNotificationCount(signal?: AbortSignal) {
  return request(endpoints.getUnreadNotificationCount, { signal })
}

/* ───────── 훅 ───────── */

/** page는 0부터 */
export function useNotificationsInfiniteQuery(query: Omit<NotificationListQuery, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(query),
    queryFn: ({ pageParam, signal }) => getNotifications({ ...query, page: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}

/** 상단 알림 벨 배지 */
export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => getUnreadNotificationCount(signal),
  })
}

export function useReadNotificationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: readNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
