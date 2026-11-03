import { endpoints } from '@/api/endpoints'
import { ME, kst } from '@/mocks/data/common'
import { toPenalties } from '@/mocks/data/me'
import { mockEndpoint } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

/** 마이페이지에 보이는 닉네임. 입찰 내역 · 판매자 목 데이터(ME.nickname)와는 따로 둡니다. */
const PROFILE_NICKNAME = 'hamyeon'

export const meHandlers = [
  /** ?mock=empty는 이메일이 없는 계정(카카오 이메일 미동의) */
  mockEndpoint(endpoints.getMyProfile, {
    error: mockErrors.INTERNAL_SERVER_ERROR,
    empty: ({ ok }) => ok({ userId: ME.userId, nickname: PROFILE_NICKNAME, email: null }),
    resolve: ({ ok }) =>
      ok({ userId: ME.userId, nickname: PROFILE_NICKNAME, email: 'hamyeon@ewha.ac.kr' }),
  }),
  mockEndpoint(endpoints.getMyPenalties, {
    error: mockErrors.UNAUTHORIZED,
    empty: ({ ok }) =>
      ok({
        noShowCount: 0,
        bidRestricted: false,
        bidRestrictedUntil: null,
        serverTime: kst(Date.now()),
        penalties: [],
      }),
    resolve: ({ ok }) => ok(toPenalties()),
  }),
]
