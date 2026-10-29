import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { isApiError } from '@/api/client'
import { useKakaoLoginMutation } from '@/api/auth'
import { API_ERROR_CODE } from '@/api/schemas/common'
import { KakaoLoginButton } from '@/components/ds'
import { ErrorState } from '@/components/feedback'
import { exchangeKakaoCode, KakaoAuthError, readKakaoCallback } from '@/lib/kakao'
import { LoginLayout } from '@/pages/login/login-shared'

type CallbackState =
  | { status: 'pending'; returnTo: string }
  | { status: 'cancelled'; returnTo: string }
  | { status: 'error'; returnTo: string; title: string; description: string }

const CONNECTION = {
  title: '연결이 불안정해요',
  description: '인터넷 연결을 확인한 뒤 다시 시도해 주세요',
}
const FAILED = { title: '로그인하지 못했어요', description: '잠시 후 다시 시도해 주세요' }

/** 실패 원인 → 화면 문구. 서버 · 카카오 메시지는 개발자용이라 그대로 보여주지 않습니다. */
function describeFailure(error: unknown) {
  if (error instanceof KakaoAuthError) {
    if (error.kind === 'network') return CONNECTION
    if (error.kind === 'invalid') {
      return { title: '로그인 요청이 만료됐어요', description: '처음부터 다시 로그인해 주세요' }
    }
    return FAILED
  }
  if (isApiError(error)) {
    if (error.kind === 'network' || error.kind === 'timeout') return CONNECTION
    if (error.code === API_ERROR_CODE.KAKAO_API_FAILED) {
      return { title: '카카오 연결이 원활하지 않아요', description: '잠시 후 다시 시도해 주세요' }
    }
  }
  console.error('[로그인] 실패', error)
  return FAILED
}

/**
 * 카카오 로그인 후 돌아오는 화면(/login/kakao?code=&state=).
 * 인가 코드 → 카카오 Access Token → POST /api/auth/kakao → 서버 JWT 저장 → 원래 가려던 화면.
 * - 진행 중: 로그인 화면과 같은 배치에 버튼만 '로그인하는 중이에요'로 잠가 화면이 튀지 않게 합니다.
 * - 동의 화면에서 취소: 로그인 화면으로 조용히 돌아갑니다.
 * - 실패: ErrorState. 인가 코드는 한 번만 쓸 수 있어 '다시 시도'는 로그인 화면에서 새로 시작합니다.
 * 이 화면은 기록에 남기지 않도록 모두 replace로 이동합니다.
 */
export function KakaoCallbackPage() {
  const navigate = useNavigate()
  const login = useKakaoLoginMutation()
  const { mutateAsync } = login
  const [state, setState] = useState<CallbackState>({ status: 'pending', returnTo: '/' })
  // StrictMode에서 effect가 두 번 돌아도 한 번만 교환합니다(code는 일회용).
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    let returnTo = '/'
    ;(async () => {
      try {
        const callback = readKakaoCallback(window.location.search)
        returnTo = callback.returnTo
        setState({ status: 'pending', returnTo })
        const accessToken = await exchangeKakaoCode(callback.code)
        await mutateAsync({ accessToken })
        navigate(returnTo, { replace: true })
      } catch (error) {
        if (error instanceof KakaoAuthError && error.kind === 'cancelled') {
          setState({ status: 'cancelled', returnTo })
          return
        }
        setState({ status: 'error', returnTo, ...describeFailure(error) })
      }
    })()
  }, [mutateAsync, navigate])

  if (state.status === 'cancelled') {
    return <Navigate to="/login" replace state={{ from: state.returnTo }} />
  }

  if (state.status === 'error') {
    return (
      <LoginLayout>
        <ErrorState
          title={state.title}
          description={state.description}
          onRetry={() => navigate('/login', { replace: true, state: { from: state.returnTo } })}
        />
      </LoginLayout>
    )
  }

  return (
    <LoginLayout>
      <KakaoLoginButton label="로그인하는 중이에요" disabled aria-busy className="max-w-80" />
    </LoginLayout>
  )
}
