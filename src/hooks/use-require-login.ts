import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { LOGIN_REQUIRED_MESSAGE, showToast, useToastStore } from '@/stores/toast-store'

/** 토스트를 먼저 읽을 수 있게 로그인 화면으로 가기 전에 기다리는 시간 */
const LOGIN_REDIRECT_DELAY_MS = 1000

/**
 * 로그인해야 할 수 있는 행동(찜 · 자동 입찰 등)을 감쌉니다.
 * 로그인했으면 그대로 실행하고, 아니면 '로그인이 필요한 기능이에요' 토스트를 먼저 띄운 뒤 잠시 후 /login으로 보내
 * 로그인 뒤 지금 화면으로 돌아오게 합니다(state.from, RequireAuth와 같은 방식).
 * 기다리는 동안 다시 눌러도 한 번만 이동하고, 그사이 화면을 떠나면 이동하지 않습니다.
 * 둘러보기 화면(홈 · 목록 · 상세)은 로그인 없이 열리므로 행동 단위로 막습니다.
 */
export function useRequireLogin() {
  const loggedIn = useAuthStore((s) => s.accessToken !== null || s.refreshToken !== null)
  const navigate = useNavigate()
  const location = useLocation()
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  return <A extends unknown[]>(action: (...args: A) => void) =>
    (...args: A) => {
      if (loggedIn) {
        action(...args)
        return
      }
      if (timer.current !== null) return
      showToast(LOGIN_REQUIRED_MESSAGE)
      timer.current = window.setTimeout(() => {
        timer.current = null
        /* 로그인 화면에 토스트가 남지 않게 닫고 이동합니다. */
        useToastStore.getState().hide()
        navigate('/login', { state: { from: location } })
      }, LOGIN_REDIRECT_DELAY_MS)
    }
}
