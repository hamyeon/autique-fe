import { createUuid } from '@/lib/uuid'
import { sessionAppStorage } from '@/lib/storage'

/*
 * 카카오 로그인(웹). 명세(POST /api/auth/kakao)는 'Kakao SDK가 발급한 Access Token'을 받으므로
 * 1) 카카오 인가 페이지로 이동 → 2) 돌아온 인가 코드(code)를 카카오 Access Token으로 교환 → 3) 그 토큰을 서버에 보냅니다.
 * - 웹은 카카오 JS SDK v2에 토큰을 바로 받는 함수가 없어 REST API로 받습니다(새 의존성 없음).
 * - 앱(Capacitor)으로 감쌀 때는 이 파일만 네이티브 카카오 SDK 플러그인(로그인 → Access Token)으로 바꿉니다.
 * - 카카오 개발자 콘솔에 Redirect URI(KAKAO_REDIRECT_PATH)를 접속 주소별로 등록해야 합니다.
 *   예: http://localhost:5173/login/kakao, 배포 주소/login/kakao
 * - 클라이언트 시크릿은 브라우저에 둘 수 없어 콘솔에서 꺼 둡니다.
 */

const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY ?? ''
const PENDING_KEY = 'autique-kakao-login'

/** 카카오 로그인 후 돌아오는 화면 경로(src/app/router.tsx) */
export const KAKAO_REDIRECT_PATH = '/login/kakao'

function redirectUri() {
  return `${window.location.origin}${KAKAO_REDIRECT_PATH}`
}

/**
 * - not-configured: VITE_KAKAO_REST_API_KEY가 없음
 * - cancelled: 사용자가 동의 화면에서 취소함
 * - invalid: 돌아온 주소가 우리가 시작한 로그인과 맞지 않음(state 불일치 · code 없음)
 * - network: 카카오에 닿지 못함
 * - kakao: 카카오가 토큰 발급을 거절함(만료된 code, 앱 설정 문제 등)
 */
export type KakaoAuthErrorKind = 'not-configured' | 'cancelled' | 'invalid' | 'network' | 'kakao'

export class KakaoAuthError extends Error {
  readonly kind: KakaoAuthErrorKind

  constructor(kind: KakaoAuthErrorKind, message: string) {
    super(message)
    this.name = 'KakaoAuthError'
    this.kind = kind
  }
}

export function isKakaoLoginConfigured() {
  return REST_API_KEY !== ''
}

/** 로그인 뒤 돌아갈 앱 안 경로만 받습니다(외부 주소 · 로그인 화면 자체는 홈으로). */
export function safeReturnPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/'
  if (path === '/login' || path.startsWith('/login/') || path.startsWith('/login?')) return '/'
  return path
}

/**
 * 카카오 인가 페이지로 이동합니다(전체 페이지 이동). 돌아올 경로와 위조 방지 state는 탭 세션에 남깁니다.
 * @param returnTo 로그인 뒤 돌아갈 앱 안 경로
 */
export function startKakaoLogin(returnTo: string) {
  if (!isKakaoLoginConfigured()) {
    throw new KakaoAuthError('not-configured', 'VITE_KAKAO_REST_API_KEY가 없습니다.')
  }
  const state = createUuid()
  sessionAppStorage.setItem(
    PENDING_KEY,
    JSON.stringify({ state, returnTo: safeReturnPath(returnTo) }),
  )

  const url = new URL('https://kauth.kakao.com/oauth/authorize')
  url.searchParams.set('client_id', REST_API_KEY)
  url.searchParams.set('redirect_uri', redirectUri())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  // 외부 OAuth 화면이라 라우터 이동이 아니라 전체 페이지 이동입니다.
  window.location.assign(url.toString())
}

export interface KakaoCallback {
  code: string
  returnTo: string
}

/** 시작할 때 남긴 값을 읽고 지웁니다. 새로고침 등으로 없으면 null */
function takePending(): { state: string; returnTo: string } | null {
  const raw = sessionAppStorage.getItem(PENDING_KEY)
  sessionAppStorage.removeItem(PENDING_KEY)
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as { state?: unknown; returnTo?: unknown }
    if (typeof value.state !== 'string') return null
    return {
      state: value.state,
      returnTo: safeReturnPath(typeof value.returnTo === 'string' ? value.returnTo : null),
    }
  } catch {
    return null
  }
}

/**
 * 돌아온 주소(?code=&state= 또는 ?error=)를 확인합니다. 한 번만 부르세요(시작 기록을 지웁니다).
 * 실패하면 KakaoAuthError를 throw 합니다.
 */
export function readKakaoCallback(search: string): KakaoCallback {
  const params = new URLSearchParams(search)
  const pending = takePending()

  const error = params.get('error')
  if (error === 'access_denied') {
    throw new KakaoAuthError('cancelled', '사용자가 카카오 로그인을 취소했습니다.')
  }
  if (error) {
    throw new KakaoAuthError(
      'kakao',
      `카카오 인가 실패: ${error} ${params.get('error_description') ?? ''}`,
    )
  }

  const code = params.get('code')
  if (!code || !pending || params.get('state') !== pending.state) {
    throw new KakaoAuthError('invalid', '시작한 로그인 요청과 돌아온 주소가 맞지 않습니다.')
  }
  return { code, returnTo: pending.returnTo }
}

/** 인가 코드 → 카카오 Access Token. 코드는 한 번만 쓸 수 있습니다. */
export async function exchangeKakaoCode(code: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: REST_API_KEY,
    redirect_uri: redirectUri(),
    code,
  })

  let response: Response
  try {
    response = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    })
  } catch {
    throw new KakaoAuthError('network', '카카오 서버에 연결할 수 없습니다.')
  }

  const json = (await response.json().catch(() => null)) as {
    access_token?: unknown
    error?: unknown
    error_code?: unknown
  } | null
  if (!response.ok || typeof json?.access_token !== 'string') {
    console.error('[카카오] 토큰 발급 실패', response.status, json?.error, json?.error_code)
    throw new KakaoAuthError('kakao', '카카오 Access Token을 받지 못했습니다.')
  }
  return json.access_token
}
