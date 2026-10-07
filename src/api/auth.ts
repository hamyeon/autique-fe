import { useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { KakaoLoginRequest, LogoutRequest, RefreshTokenRequest } from '@/api/schemas/auth'
import { useAuthStore } from '@/stores/auth-store'

/* ───────── API 함수 ───────── */

export function kakaoLogin(body: KakaoLoginRequest) {
  return request(endpoints.kakaoLogin, { body })
}

/** 보통은 client.ts가 401에서 자동으로 호출합니다. */
export function refreshToken(body: RefreshTokenRequest) {
  return request(endpoints.refreshToken, { body })
}

export function logout(body: LogoutRequest) {
  return request(endpoints.logout, { body })
}

/* ───────── 훅 ───────── */

/** Kakao SDK 토큰을 넘기면 서버 JWT를 받아 저장합니다. */
export function useKakaoLoginMutation() {
  const setTokens = useAuthStore((s) => s.setTokens)
  return useMutation({
    mutationFn: kakaoLogin,
    onSuccess: (tokens) => setTokens(tokens),
  })
}

/** 서버의 Refresh Token을 무효화하고, 성공 여부와 관계없이 로컬 토큰과 캐시를 비웁니다. */
export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState()
      if (refreshToken) await logout({ refreshToken })
    },
    onSettled: () => {
      useAuthStore.getState().clear()
      queryClient.clear()
    },
  })
}
