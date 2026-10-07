import { endpoints } from '@/api/endpoints'
import { DAY, MINUTE, fromNow, kst } from '@/mocks/data/common'
import { mockEndpoint } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

/** 목에서는 어떤 Kakao 토큰이든 로그인에 성공합니다. 'invalid'를 보내면 40102 */
export const authHandlers = [
  mockEndpoint(endpoints.kakaoLogin, {
    error: mockErrors.KAKAO_TOKEN_INVALID,
    resolve: ({ body, ok, fail }) => {
      if (body.accessToken === 'invalid') return fail(mockErrors.KAKAO_TOKEN_INVALID)
      return ok({
        accessToken: `mock-access-${Date.now()}`,
        refreshToken: `mock-refresh-${Date.now()}`,
        accessTokenExpiresAt: kst(fromNow(30 * MINUTE)),
        refreshTokenExpiresAt: kst(fromNow(14 * DAY)),
      })
    },
  }),

  mockEndpoint(endpoints.refreshToken, {
    error: mockErrors.REFRESH_TOKEN_INVALID,
    resolve: ({ body, ok, fail }) => {
      if (!body.refreshToken.startsWith('mock-refresh-'))
        return fail(mockErrors.REFRESH_TOKEN_INVALID)
      return ok({
        accessToken: `mock-access-${Date.now()}`,
        accessTokenExpiresAt: kst(fromNow(30 * MINUTE)),
      })
    },
  }),

  /** 이미 로그아웃된 토큰도 200 */
  mockEndpoint(endpoints.logout, {
    error: mockErrors.REFRESH_TOKEN_INVALID,
    resolve: ({ ok }) => ok(null),
  }),
]
