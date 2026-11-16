import { useAuthStore } from '@/stores/auth-store'

/**
 * 개발용 로그인(개발 모드 전용): .env.local 의 VITE_DEV_REFRESH_TOKEN(필수) · VITE_DEV_ACCESS_TOKEN(선택)으로 로그인 상태를 채웁니다.
 * - 저절로 채우지 않습니다. 주소에 ?dev-login 을 붙여 열었을 때만 부릅니다(src/main.tsx, /dev/routes 링크).
 *   예전에는 비어 있으면 항상 채워서, 처음 들어온 사람도 개발용 계정으로 로그인돼 있었습니다.
 * - 직접 요청한 것이므로 이미 로그인돼 있어도 개발용 토큰으로 바꿉니다.
 * - access가 없거나 만료되면 client.ts가 401에서 refresh로 재발급합니다(자동 갱신).
 * - refreshTokenExpiresAt을 비워 두므로 카카오 로그인 토큰과 구분됩니다(auth-store.ts migrate).
 */
export function seedDevTokens() {
  const refreshToken = import.meta.env.VITE_DEV_REFRESH_TOKEN
  if (!refreshToken) return
  useAuthStore.setState({
    accessToken: import.meta.env.VITE_DEV_ACCESS_TOKEN || null,
    refreshToken,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
  })
}
