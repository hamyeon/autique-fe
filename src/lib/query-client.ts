import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/api/client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분 동안은 캐시를 신선한 데이터로 간주
      // 4xx(없는 경매, 권한 없음 등)는 다시 보내도 같은 결과라 재시도하지 않음
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status !== null && error.status < 500) return false
        return failureCount < 1
      },
      // 모바일에서 앱 전환 후 돌아올 때마다 재요청하는 것을 막음
      refetchOnWindowFocus: false,
    },
  },
})
