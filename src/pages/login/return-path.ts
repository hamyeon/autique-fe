import type { Location } from 'react-router'
import { safeReturnPath } from '@/lib/kakao'

/** RequireAuth · 카카오 콜백 실패 화면이 /login에 넘기는 state */
export interface LoginLocationState {
  from?: Pick<Location, 'pathname' | 'search' | 'hash'> | string
}

/** location.state.from → 로그인 뒤 돌아갈 경로 */
export function returnPathFrom(state: unknown) {
  const from = (state as LoginLocationState | null)?.from
  if (!from) return '/'
  if (typeof from === 'string') return safeReturnPath(from)
  return safeReturnPath(`${from.pathname}${from.search ?? ''}${from.hash ?? ''}`)
}
