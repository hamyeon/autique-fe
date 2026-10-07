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
      partialize: ({ accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt }) => ({
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      }),
    },
  ),
)
