import { useAuthStore } from '@/stores/auth-store'

/**
 * 개발 모드 전용: .env.local 의 VITE_DEV_REFRESH_TOKEN(필수) · VITE_DEV_ACCESS_TOKEN(선택)으로 로그인 상태를 채웁니다.
 * - access가 없거나 만료되면 client.ts가 401에서 refresh로 재발급합니다(자동 갱신).
 * - 저장된 refresh 토큰이 .env.local 값과 같으면 덮어쓰지 않아, 재발급받은 access를 그대로 씁니다.
 * - 카카오 로그인 화면이 생기면 이 파일과 .env.local 토큰은 지웁니다.
 */
export function seedDevTokens() {
  const refreshToken = import.meta.env.VITE_DEV_REFRESH_TOKEN
  if (!refreshToken) return
  if (useAuthStore.getState().refreshToken === refreshToken) return
  useAuthStore.setState({
    accessToken: import.meta.env.VITE_DEV_ACCESS_TOKEN || null,
    refreshToken,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
  })
}
