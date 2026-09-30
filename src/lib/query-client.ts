import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분 동안은 캐시를 신선한 데이터로 간주
      retry: 1,
      // 모바일에서 앱 전환 후 돌아올 때마다 재요청하는 것을 막음
      refetchOnWindowFocus: false,
    },
  },
})
