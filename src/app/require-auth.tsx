import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'

/**
 * 로그인이 필요한 화면 묶음(라우트 element로 씁니다). 토큰이 없으면 /login으로 보내고, 돌아올 곳을 state.from에 남깁니다.
 * 토큰 재발급이 실패해 auth 스토어가 비워져도 바로 /login으로 갑니다.
 */
export function RequireAuth() {
  const loggedIn = useAuthStore((s) => s.accessToken !== null || s.refreshToken !== null)
  const location = useLocation()

  if (!loggedIn) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
