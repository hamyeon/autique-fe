import type { z } from 'zod'
import type { ApiErrorCodeName } from '@/api/schemas/common'
import { API_ERROR_CODE } from '@/api/schemas/common'

/** 목이 돌려줄 실패 응답. 상태 · 코드 · 메시지는 노션 명세 그대로입니다. */
export interface MockError {
  status: number
  code: number
  message: string
}

function error(status: number, name: ApiErrorCodeName, message: string): MockError {
  return { status, code: API_ERROR_CODE[name], message }
}

export const mockErrors = {
  INVALID_REQUEST: error(400, 'INVALID_REQUEST', '유효하지 않은 요청입니다.'),
  IDEMPOTENCY_KEY_MISSING: error(
    400,
    'IDEMPOTENCY_KEY_MISSING',
    'Idempotency-Key 헤더가 필요합니다.',
  ),
  IMAGE_FILE_MISSING: error(400, 'IMAGE_FILE_MISSING', '이미지 파일이 존재하지 않습니다.'),
  ANALYSIS_STATUS_INVALID: (status: string) =>
    error(
      400,
      'ANALYSIS_STATUS_INVALID',
      `가격 계산을 요청할 수 없는 분석 상태입니다. 현재 상태: ${status}`,
    ),
  AUCTION_TIME_INVALID: error(
    400,
    'AUCTION_TIME_INVALID',
    '경매 진행 시간은 최소 1시간이어야 합니다.',
  ),
  START_PRICE_INVALID: error(400, 'INVALID_REQUEST', '시작가는 0보다 커야 합니다.'),

  UNAUTHORIZED: error(401, 'UNAUTHORIZED', '인증이 필요합니다.'),
  KAKAO_TOKEN_INVALID: error(401, 'KAKAO_TOKEN_INVALID', 'Kakao access token이 유효하지 않습니다.'),
  REFRESH_TOKEN_INVALID: error(401, 'REFRESH_TOKEN_INVALID', '유효하지 않은 Refresh Token입니다.'),

  SELLER_CANNOT_BID: error(403, 'SELLER_CANNOT_BID', '본인이 등록한 경매에는 입찰할 수 없습니다.'),
  PENALTY_RESTRICTED: error(403, 'PENALTY_RESTRICTED', '경매 참여가 제한된 상태입니다.'),
  NOT_AWARDEE: error(403, 'NOT_AWARDEE', '낙찰자가 아닙니다.'),
  ORDER_ACCESS_DENIED: error(403, 'ORDER_ACCESS_DENIED', '접근 권한이 없는 주문입니다.'),
  BACKUP_OFFER_ACCESS_DENIED: error(
    403,
    'BACKUP_OFFER_ACCESS_DENIED',
    '본인 명의의 차순위 제안이 아닙니다.',
  ),
  NOT_AUCTION_OWNER: error(403, 'NOT_PRODUCT_OWNER', '본인 경매가 아닙니다.'), // 명세에 메시지 예시 없음
  NOT_PRODUCT_OWNER: (auctionId: number) =>
    error(
      403,
      'NOT_PRODUCT_OWNER',
      `본인 상품에 대해서만 재경매를 등록할 수 있습니다. previousAuctionId: ${auctionId}`,
    ),

  AUCTION_NOT_FOUND: error(404, 'AUCTION_NOT_FOUND', '존재하지 않는 경매입니다.'),
  ORDER_NOT_FOUND: error(404, 'ORDER_NOT_FOUND', '존재하지 않는 주문입니다.'),
  ANALYSIS_NOT_FOUND: (analysisId: string) =>
    error(
      404,
      'ANALYSIS_SESSION_NOT_FOUND',
      `분석 세션을 찾을 수 없습니다. analysisId: ${analysisId}`,
    ),
  BACKUP_OFFER_NOT_FOUND: error(404, 'BACKUP_OFFER_NOT_FOUND', '존재하지 않는 차순위 제안입니다.'),
  AUTO_BID_NOT_FOUND: error(404, 'AUTO_BID_NOT_FOUND', '등록된 자동입찰이 없습니다.'),
  NOTIFICATION_NOT_FOUND: error(404, 'NOTIFICATION_NOT_FOUND', '존재하지 않는 알림입니다.'),

  ALREADY_HIGHEST_BIDDER: error(409, 'ALREADY_HIGHEST_BIDDER', '이미 최고 입찰자입니다.'),
  AUCTION_NOT_STARTED: error(409, 'AUCTION_NOT_STARTED', '아직 시작되지 않은 경매입니다.'),
  AUCTION_CLOSED: error(409, 'AUCTION_CLOSED', '종료된 경매입니다.'),
  BID_AMOUNT_TOO_LOW: error(409, 'BID_AMOUNT_TOO_LOW', '이미 더 높은 입찰가가 있습니다.'),
  IDEMPOTENCY_PAYLOAD_MISMATCH: error(
    409,
    'IDEMPOTENCY_PAYLOAD_MISMATCH',
    '동일한 키로 다른 요청이 접수되었습니다.',
  ),
  CAP_TOO_LOW: error(409, 'CAP_TOO_LOW', '자동입찰 상한가가 너무 낮습니다.'),
  CAP_NOT_INCREASED: error(409, 'CAP_NOT_INCREASED', '상한가는 현재 설정값보다 높아야 합니다.'),
  AUTO_BID_ALREADY_EXISTS: error(
    409,
    'AUTO_BID_ALREADY_EXISTS',
    '이미 자동입찰이 등록되어 있습니다.',
  ),
  PAYMENT_EXPIRED: error(409, 'PAYMENT_EXPIRED', '결제 기한이 만료되었습니다.'),
  BACKUP_OFFER_EXPIRED: error(409, 'BACKUP_OFFER_EXPIRED', '차순위 구매 기한이 만료되었습니다.'),
  BACKUP_OFFER_ALREADY_RESOLVED: error(
    409,
    'BACKUP_OFFER_ALREADY_RESOLVED',
    '이미 처리된 제안입니다.',
  ),
  BID_NOT_ALIGNED: error(409, 'BID_NOT_ALIGNED', '입찰 단위에 맞지 않는 금액입니다.'),
  ALREADY_PAID: error(409, 'ALREADY_PAID', '이미 결제가 완료된 주문입니다.'),
  ORDER_CANCELED: error(409, 'ORDER_CANCELED', '취소된 주문입니다.'),
  RELIST_NOT_ALLOWED: (auctionId: number) =>
    error(
      409,
      'RELIST_NOT_ALLOWED',
      `유찰되었거나 시작 전 취소된 경매만 재경매할 수 있습니다. previousAuctionId: ${auctionId}`,
    ),
  ACTIVE_AUCTION_EXISTS: error(
    409,
    'ACTIVE_AUCTION_EXISTS',
    '이미 예약 또는 진행 중인 경매가 있습니다.',
  ),
  RELIST_LIMIT_EXCEEDED: error(
    409,
    'RELIST_LIMIT_EXCEEDED',
    '최대 2회의 등록 횟수를 모두 사용했습니다.',
  ),
  CANCEL_NOT_ALLOWED: (auctionId: number) =>
    error(
      409,
      'CANCEL_NOT_ALLOWED',
      `경매가 시작되기 전까지만 취소할 수 있습니다. auctionId: ${auctionId}`,
    ),
  START_PRICE_EDIT_CLOSED: (auctionId: number) =>
    error(
      409,
      'START_PRICE_EDIT_CLOSED',
      `경매 시작 1시간 전까지만 시작가를 수정할 수 있습니다. auctionId: ${auctionId}`,
    ),

  INTERNAL_SERVER_ERROR: error(500, 'INTERNAL_SERVER_ERROR', '서버 내부 오류: ...'),
  S3_UPLOAD_FAILED: error(500, 'S3_UPLOAD_FAILED', 'S3 이미지 업로드 중 문제가 발생했습니다.'),
  KAKAO_API_FAILED: error(502, 'KAKAO_API_FAILED', 'Kakao 사용자 정보 조회에 실패했습니다.'),
}

/** 경매 시각 규칙(종료 ≥ 시작 + 1시간)은 refine이라 code가 custom입니다. 그 외 검증 실패는 40001 */
export function invalidAuctionTime(error: z.ZodError) {
  return error.issues.some((issue) => issue.code === 'custom')
    ? mockErrors.AUCTION_TIME_INVALID
    : mockErrors.INVALID_REQUEST
}
