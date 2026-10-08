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
      /*
       * 브라우저의 온라인 표시와 상관없이 요청합니다. 기본값(online)은 offline 이벤트 뒤 online 이벤트를 놓치면
       * (카메라 · 사진 선택 앱 전환, 와이파이 ↔ LTE 전환 중 모바일에서 종종 생김) 새 요청을 계속 멈춰 두어
       * 화면이 스켈레톤에서 넘어가지 않습니다. 정말 끊겼으면 request()가 network 오류로 바꿔 에러 · 다시 시도 화면이 나옵니다.
       */
      networkMode: 'always',
    },
    mutations: {
      // 제출 등도 같은 이유로 멈추지 않게(끊겼으면 '연결이 불안정해요' 안내)
      networkMode: 'always',
    },
  },
})
