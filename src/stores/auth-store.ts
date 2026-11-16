import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthTokens, RefreshTokenResponse } from '@/api/schemas/auth'
import { appStorage } from '@/lib/storage'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: string | null
  refreshTokenExpiresAt: string | null
  /** 카카오 로그인 성공 시 */
  setTokens: (tokens: AuthTokens) => void
  /** Access Token 재발급 성공 시 (Refresh Token은 그대로) */
  setAccessToken: (tokens: RefreshTokenResponse) => void
  clear: () => void
}

const EMPTY = {
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
}

/** 서버가 발급한 JWT. 서버 데이터가 아니라 클라이언트 인증 상태라 Zustand에 둡니다. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...EMPTY,
      setTokens: (tokens) => set(tokens),
      setAccessToken: ({ accessToken, accessTokenExpiresAt }) =>
        set({ accessToken, accessTokenExpiresAt }),
      clear: () => set(EMPTY),
    }),
    {
      name: 'autique-auth',
      storage: createJSONStorage(() => appStorage),
      /*
       * v1(2026-11-16): 예전 버전은 처음 들어온 사람에게도 개발용 토큰을 자동으로 채웠습니다(dev-auth.ts).
       * 그렇게 저장된 로그인은 한 번 지웁니다. 개발용 토큰은 refreshTokenExpiresAt이 비어 있고,
       * 카카오 로그인 토큰은 항상 값이 있어(명세 POST /api/auth/kakao) 카카오 로그인은 그대로 둡니다.
       */
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Partial<typeof EMPTY> | undefined
        if (version < 1 && state?.refreshToken && !state.refreshTokenExpiresAt) return EMPTY
        return { ...EMPTY, ...state }
      },
      partialize: ({ accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt }) => ({
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      }),
    },
  ),
)
