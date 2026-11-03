import type { InfiniteData } from '@tanstack/react-query'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { NotificationList, NotificationListQuery } from '@/api/schemas/notifications'
import { useAuthStore } from '@/stores/auth-store'

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
export function useUnreadNotificationCountQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => getUnreadNotificationCount(signal),
    enabled,
  })
}

/** 헤더 알림 아이콘의 빨간 점. 로그인하지 않았으면 부르지 않고 false */
export function useHasUnreadNotifications() {
  const loggedIn = useAuthStore((s) => s.accessToken !== null || s.refreshToken !== null)
  const count = useUnreadNotificationCountQuery({ enabled: loggedIn })
  return loggedIn && (count.data?.unreadCount ?? 0) > 0
}

/** 누르는 즉시 목록에서 읽음으로 바꾸고(낙관적 업데이트), 끝나면 목록 · 안 읽은 개수를 다시 불러옵니다. */
export function useReadNotificationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: readNotification,
    onMutate: (notificationId: number) => {
      const readAt = new Date().toISOString()
      queryClient.setQueriesData<InfiniteData<NotificationList>>(
        { queryKey: notificationKeys.lists() },
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((n) =>
                n.id === notificationId && !n.readAt ? { ...n, readAt } : n,
              ),
            })),
          },
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
