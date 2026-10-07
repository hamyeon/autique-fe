import { z } from 'zod'
import { ApiError } from '@/api/client'
import { API_ERROR_CODE } from '@/api/schemas/common'
import type { RegisterStep } from '@/features/register/schemas'

/*
 * 경매 등록(사진 분석 · 제출) 실패를 화면 문구와 다음 행동으로 바꿉니다.
 * 입력값은 어떤 실패에서도 지우지 않습니다(스토어 · IndexedDB에 그대로).
 */

export type RegisterFailureKind =
  /** 네트워크 끊김 · 타임아웃 → 다시 시도 */
  | 'connection'
  /** 401(재발급도 실패) → 다시 로그인 안내 */
  | 'auth'
  /** 입력값 문제 → 해당 단계로 가서 고치기 */
  | 'invalid'
  /** 분석 세션이 없거나(40408) 분석 자체가 실패 → 다시 분석 또는 사진 고치기 */
  | 'analysis'
  /** 그 밖의 서버 오류 → 다시 시도 */
  | 'server'

export interface RegisterFailure {
  kind: RegisterFailureKind
  title: string
  message: string
  /** 'invalid' · 'analysis'에서 고치러 갈 단계 */
  step?: RegisterStep
}

const CONNECTION: RegisterFailure = {
  kind: 'connection',
  title: '연결이 불안정해요',
  message: '인터넷 연결을 확인하고 다시 시도해 주세요. 입력한 정보는 그대로 남아 있어요.',
}

const AUTH: RegisterFailure = {
  kind: 'auth',
  title: '로그인이 만료됐어요',
  message: '다시 로그인한 뒤 이어서 등록해 주세요. 입력한 정보는 그대로 남아 있어요.',
}

const SERVER: RegisterFailure = {
  kind: 'server',
  title: '잠시 후 다시 시도해 주세요',
  message: '일시적인 오류로 처리하지 못했어요. 입력한 정보는 그대로 남아 있어요.',
}

export const ANALYSIS_FAILED: RegisterFailure = {
  kind: 'analysis',
  title: '분석에 실패했어요',
  // 명세: failureMessage는 서버 내부 메시지라 그대로 보여주지 않음
  message: '사진을 다시 분석하거나, 더 밝은 곳에서 찍은 사진으로 바꿔 주세요.',
  step: '1',
}

export const ANALYSIS_TOO_SLOW: RegisterFailure = {
  kind: 'server',
  title: '분석이 오래 걸리고 있어요',
  message: '잠시 후 다시 시도해 주세요. 입력한 정보는 그대로 남아 있어요.',
}

export const PRICE_FAILED: RegisterFailure = {
  kind: 'server',
  title: 'AI 기준가를 계산하지 못했어요',
  message: '잠시 후 다시 시도해 주세요. 입력한 정보는 그대로 남아 있어요.',
}

export const ANALYSIS_NOT_FOUND: RegisterFailure = {
  kind: 'analysis',
  title: '사진 분석 정보를 찾을 수 없어요',
  message: '분석 정보가 만료됐어요. 사진을 다시 분석해 주세요.',
  step: '1',
}

/** 제출용 스키마 검증에서 걸린 필드 → 고칠 단계 */
const FIELD_STEP: Record<string, RegisterStep> = {
  imageUrls: '1',
  brand: '2',
  modelName: '2',
  color: '2',
  size: '2',
  conditionGrade: '2',
  componentStatus: '3',
  sellerDescription: '3',
  recommendedPrice: '3',
  baseMarketPrice: '3',
  priceRange: '3',
  reason: '3',
  sellingPrice: '4',
  auctionStartPrice: '4',
  auctionStartAt: '5',
  auctionEndAt: '5',
}

/** 제출 전 Zod 검증 실패 → 첫 문제 필드의 단계로 */
export function fromValidationError(error: z.ZodError): RegisterFailure {
  const issue = error.issues[0]
  const field = String(issue?.path[0] ?? '')
  const step = FIELD_STEP[field] ?? '6'
  console.warn('[등록] 제출 전 검증 실패', error.issues)
  return {
    kind: 'invalid',
    title: '확인이 필요한 정보가 있어요',
    // 스키마 메시지는 화면용 해요체 문장(필드 메시지가 없으면 일반 문구)
    message:
      issue?.message && /요\.?$/.test(issue.message)
        ? issue.message
        : '입력한 정보를 다시 확인해 주세요.',
    step,
  }
}

/** API 응답이 아닌 등록 흐름 자체의 실패(사진 파일이 없음 등)를 실어 보내는 오류 */
export class RegisterFailureError extends Error {
  readonly failure: RegisterFailure
  constructor(failure: RegisterFailure) {
    super(failure.title)
    this.name = 'RegisterFailureError'
    this.failure = failure
  }
}

export const PHOTOS_MISSING: RegisterFailure = {
  kind: 'invalid',
  title: '사진을 다시 올려 주세요',
  message: '올린 사진을 찾을 수 없어요. 사진을 다시 골라 주세요.',
  step: '1',
}

/** API 오류 → 화면 실패. 명세 오류 코드 기준 */
export function toRegisterFailure(error: unknown): RegisterFailure {
  if (error instanceof RegisterFailureError) return error.failure
  if (error instanceof z.ZodError) return fromValidationError(error)
  if (!(error instanceof ApiError)) {
    console.error('[등록] 알 수 없는 오류', error)
    return SERVER
  }

  if (error.kind === 'network' || error.kind === 'timeout') return CONNECTION

  if (error.status === 401) {
    if (import.meta.env.DEV) {
      console.warn(
        '[DEV] 액세스 토큰이 만료됐고 재발급도 실패했어요(401). .env.local의 VITE_DEV_ACCESS_TOKEN · VITE_DEV_REFRESH_TOKEN을 새 토큰으로 바꾼 뒤 새로고침하세요.',
      )
    }
    return AUTH
  }

  switch (error.code) {
    case API_ERROR_CODE.AUCTION_TIME_INVALID:
      return {
        kind: 'invalid',
        title: '경매 일정을 확인해 주세요',
        message: '경매 시간은 1시간 이상이어야 하고, 시작 시간은 지금 이후여야 해요.',
        step: '5',
      }
    case API_ERROR_CODE.INVALID_REQUEST:
      return {
        kind: 'invalid',
        title: '확인이 필요한 정보가 있어요',
        message: '사진 개수나 빠진 정보가 없는지 확인해 주세요.',
        step: '6',
      }
    case API_ERROR_CODE.IMAGE_FILE_MISSING:
      return PHOTOS_MISSING
    case API_ERROR_CODE.ANALYSIS_SESSION_NOT_FOUND:
      return ANALYSIS_NOT_FOUND
    case API_ERROR_CODE.S3_UPLOAD_FAILED:
    case API_ERROR_CODE.ANALYSIS_QUEUE_FAILED:
      return { ...SERVER, title: '사진을 올리지 못했어요' }
  }

  console.error(`[등록] ${error.endpoint} 실패`, error.status, error.code, error.message)
  return SERVER
}
