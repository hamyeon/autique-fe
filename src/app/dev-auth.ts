import { useAuthStore } from '@/stores/auth-store'

/**
 * 개발용 로그인: VITE_DEV_REFRESH_TOKEN(필수) · VITE_DEV_ACCESS_TOKEN(선택)으로 로그인 상태를 채웁니다.
 * - 개발은 .env.local, 배포는 Vercel 환경 변수에서 읽습니다. 빌드에 넣은 토큰은 공개 JS 번들에 그대로 들어갑니다.
 * - access가 없거나 만료되면 client.ts가 401에서 refresh로 재발급합니다(자동 갱신).
 * - 이미 로그인 상태(카카오 로그인 토큰 · 재발급받은 access)면 덮어쓰지 않습니다. 비어 있을 때만 채워서,
 *   로그아웃한 뒤 새로고침하면 다시 개발용 토큰으로 로그인됩니다.
 * - 카카오 로그인이 개발 · 배포에서 동작하는 것을 확인하면 이 파일과 VITE_DEV_* 토큰은 지웁니다.
 */
export function seedDevTokens() {
  const refreshToken = import.meta.env.VITE_DEV_REFRESH_TOKEN
  if (!refreshToken) return
  if (useAuthStore.getState().refreshToken !== null) return
  useAuthStore.setState({
    accessToken: import.meta.env.VITE_DEV_ACCESS_TOKEN || null,
    refreshToken,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
  })
}
