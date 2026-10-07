import { z } from 'zod'
import { dateTimeSchema } from '@/api/schemas/common'

/* POST /api/auth/kakao */
export const kakaoLoginRequestSchema = z.object({
  /** Kakao SDK가 발급한 Access Token */
  accessToken: z.string().trim().min(1),
})
export type KakaoLoginRequest = z.infer<typeof kakaoLoginRequestSchema>

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessTokenExpiresAt: dateTimeSchema,
  refreshTokenExpiresAt: dateTimeSchema,
})
export type AuthTokens = z.infer<typeof authTokensSchema>

/* POST /api/auth/refresh */
export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().trim().min(1),
})
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>

export const refreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: dateTimeSchema,
})
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>

/* POST /api/auth/logout — 성공 시 data는 null */
export const logoutRequestSchema = z.object({
  refreshToken: z.string().trim().min(1),
})
export type LogoutRequest = z.infer<typeof logoutRequestSchema>

export const logoutResponseSchema = z.null()
