import { endpoints } from '@/api/endpoints'
import { ME } from '@/mocks/data/common'
import { mockEndpoint } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

/*
 * [ASSUMED] 명세에 없는 엔드포인트의 목 핸들러.
 * 백엔드에 API가 생기면 명세에 맞춰 스키마를 고치고 이 파일에서 옮기세요.
 */
/** 마이페이지에 보이는 닉네임. 입찰 내역 · 판매자 목 데이터(ME.nickname)와는 따로 둡니다. */
const PROFILE_NICKNAME = 'hamyeon'

export const assumedMeHandlers = [
  // [ASSUMED] GET /api/me — 로그인한 나(마이페이지 프로필 표시용 값). ?mock=empty는 이메일 · 사진이 없는 계정
  mockEndpoint(endpoints.getMyProfile, {
    error: mockErrors.INTERNAL_SERVER_ERROR,
    empty: ({ ok }) =>
      ok({ userId: ME.userId, nickname: PROFILE_NICKNAME, email: null, profileImageUrl: null }),
    resolve: ({ ok }) =>
      ok({
        userId: ME.userId,
        nickname: PROFILE_NICKNAME,
        email: 'hamyeon@ewha.ac.kr',
        profileImageUrl: null,
      }),
  }),
]
