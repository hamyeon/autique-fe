import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { KakaoLoginButton } from '@/components/ds'
import { KakaoAuthError, startKakaoLogin } from '@/lib/kakao'
import { LoginLayout } from '@/pages/login/login-shared'
import { returnPathFrom } from '@/pages/login/return-path'
import { useAuthStore } from '@/stores/auth-store'
import { showToast } from '@/stores/toast-store'

/**
 * 로그인(Figma 로그인 948:6123). 카카오 버튼(최대 320)을 누르면 카카오 인가 페이지로 이동하고,
 * 로그인 뒤에는 RequireAuth가 넘긴 화면(state.from)으로 돌아갑니다. 이미 로그인했으면 바로 보냅니다.
 */
export function LoginPage() {
  const location = useLocation()
  const loggedIn = useAuthStore((s) => s.accessToken !== null || s.refreshToken !== null)
  const returnTo = returnPathFrom(location.state)
  // 카카오 화면으로 넘어가는 동안 버튼을 잠가 두 번 눌리지 않게 합니다.
  const [redirecting, setRedirecting] = useState(false)

  if (loggedIn) return <Navigate to={returnTo} replace />

  const login = () => {
    try {
      setRedirecting(true)
      startKakaoLogin(returnTo)
    } catch (error) {
      setRedirecting(false)
      if (error instanceof KakaoAuthError && error.kind === 'not-configured') {
        console.error('[카카오] .env.local에 VITE_KAKAO_REST_API_KEY를 넣어 주세요.')
      }
      showToast('카카오 로그인을 시작하지 못했어요')
    }
  }

  return (
    <LoginLayout>
      <KakaoLoginButton disabled={redirecting} onClick={login} className="max-w-80" />
    </LoginLayout>
  )
}
