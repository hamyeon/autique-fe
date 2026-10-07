import { delay, http, HttpResponse, passthrough as sendToNetwork } from 'msw'
import type { z } from 'zod'
import { describeIssues } from '@/api/client'
import type { EndpointDef } from '@/api/endpoints'
import { endpointKey } from '@/api/endpoints'
import { sessionAppStorage } from '@/lib/storage'
import { passthrough } from '@/mocks/config'
import type { MockError } from '@/mocks/errors'
import { mockErrors } from '@/mocks/errors'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

/*
 * 화면 주소의 ?mock= 시나리오.
 * - empty / error: 그 페이지에서만. 목으로 처리하는 엔드포인트가 빈 응답 / 명세 오류를 돌려줍니다.
 * - slow / analysis-fail / submit-fail: 경매 등록 흐름 확인용. 여러 화면을 거쳐야 해서 탭을 닫거나
 *   ?mock=off 를 붙일 때까지 유지됩니다. 이 시나리오일 때만 해당 요청을 목으로 처리하고(passthrough여도),
 *   평소에는 실제 서버로 보냅니다(각 핸들러의 mockIn).
 *   slow: AI 분석 30초 · analysis-fail: AI 분석 실패(VISION_FAILED) · submit-fail: 등록 제출 500
 * - autobid-outbid / autobid-ended / autobid-error: 자동 입찰 시트 확인용. 그 페이지에서만, 자동입찰 등록 · 수정 · 취소에만 적용됩니다.
 *   autobid-outbid: 제출하는 순간 현재가가 상한가 위로 올라감(CAP_TOO_LOW, 경매마다 한 번)
 *   autobid-ended: 제출하는 순간 경매가 끝남(AUCTION_CLOSED)
 *   autobid-error: 첫 제출이 서버 오류(500), 다시 시도하면 성공. ?mock=error는 상세 조회부터 실패해 시트를 열 수 없어 따로 둡니다.
 * - ending / busy / quiet / bid-outbid: 실시간 경매 확인용. 그 페이지에서만 적용됩니다.
 *   ending: 페이지를 연 뒤 30초 후 종료 · busy: 다른 입찰이 1초마다 · quiet: 다른 입찰 없음
 *   bid-outbid: 직접 입찰을 제출하는 순간 이미 더 높은 입찰이 있음(BID_AMOUNT_TOO_LOW, 경매마다 한 번)
 * - reset: 시나리오가 아니라 세션에 저장한 목 상태를 지우는 표시입니다(src/mocks/data/common.ts mockResetRequested).
 */
export type MockScenario =
  | 'empty'
  | 'error'
  | 'slow'
  | 'analysis-fail'
  | 'submit-fail'
  | 'autobid-outbid'
  | 'autobid-ended'
  | 'autobid-error'
  | 'ending'
  | 'busy'
  | 'quiet'
  | 'bid-outbid'

const PAGE_SCENARIOS = [
  'empty',
  'error',
  'autobid-outbid',
  'autobid-ended',
  'autobid-error',
  'ending',
  'busy',
  'quiet',
  'bid-outbid',
] as const

const STICKY_SCENARIOS = ['slow', 'analysis-fail', 'submit-fail'] as const
const SCENARIO_KEY = 'autique-mock-scenario'

const isSticky = (value: string | null): value is (typeof STICKY_SCENARIOS)[number] =>
  (STICKY_SCENARIOS as readonly (string | null)[]).includes(value)

export function currentScenario(): MockScenario | null {
  const value = new URLSearchParams(window.location.search).get('mock')
  if (value === 'off') {
    sessionAppStorage.removeItem(SCENARIO_KEY)
    return null
  }
  if (isSticky(value)) {
    sessionAppStorage.setItem(SCENARIO_KEY, value)
    return value
  }
  if ((PAGE_SCENARIOS as readonly (string | null)[]).includes(value)) {
    return value as (typeof PAGE_SCENARIOS)[number]
  }
  const saved = sessionAppStorage.getItem(SCENARIO_KEY)
  return isSticky(saved) ? saved : null
}

type MockReply<E extends EndpointDef> =
  { kind: 'ok'; status: number; data: z.input<E['response']> } | { kind: 'error'; error: MockError }

type MockBody<E extends EndpointDef> = E extends { request: infer S extends z.ZodType }
  ? z.output<S>
  : E extends { multipart: true }
    ? FormData
    : undefined

export interface MockContext<E extends EndpointDef> {
  params: Record<string, string>
  query: URLSearchParams
  /** request 스키마를 통과한 body (multipart면 FormData) */
  body: MockBody<E>
  request: Request
  scenario: MockScenario | null
  ok: (data: z.input<E['response']>, status?: number) => MockReply<E>
  fail: (error: MockError) => MockReply<E>
}

interface MockDef<E extends EndpointDef> {
  resolve: (ctx: MockContext<E>) => MockReply<E> | Promise<MockReply<E>>
  /** ?mock=empty 일 때. 없으면 resolve 결과를 그대로 씁니다(목록이 아닌 엔드포인트). */
  empty?: (ctx: MockContext<E>) => MockReply<E>
  /** ?mock=error 일 때 돌려줄 명세 오류 */
  error: MockError
  /** 요청 body가 스키마를 통과하지 못했을 때의 명세 오류. 기본 40001 */
  invalid?: (error: z.ZodError) => MockError
  /** passthrough 엔드포인트라도 이 시나리오일 때는 목으로 처리합니다. */
  mockIn?: readonly MockScenario[]
}

/** Idempotency-Key → 처음 처리한 요청과 응답. 같은 키 + 같은 요청이면 같은 응답을 다시 돌려줍니다. */
const idempotencyCache = new Map<string, { request: string; status: number; payload: unknown }>()

function errorResponse({ status, code, message }: MockError) {
  return HttpResponse.json({ success: false, data: null, error: { code, message } }, { status })
}

/**
 * 엔드포인트 하나의 MSW 핸들러를 만듭니다.
 * - passthrough에 있으면 실제 서버로 보냅니다.
 * - 요청 body는 request 스키마로, 목 응답은 response 스키마로 검사합니다(실제 API와 같은 스키마).
 */
export function mockEndpoint<E extends EndpointDef>(def: E, mock: MockDef<E>) {
  const key = endpointKey(def)
  const url = `${BASE_URL}${def.path.replace(/\{(\w+)\}/g, ':$1')}`
  const method = def.method.toLowerCase() as Lowercase<EndpointDef['method']>

  return http[method](url, async ({ request, params }) => {
    const scenario = currentScenario()
    const forced = scenario !== null && (mock.mockIn?.includes(scenario) ?? false)
    if (passthrough.includes(key) && !forced) return sendToNetwork()

    await delay()
    if (scenario === 'error') return errorResponse(mock.error)

    const idempotencyKey = def.idempotent ? request.headers.get('Idempotency-Key') : null
    if (def.idempotent && !idempotencyKey) return errorResponse(mockErrors.IDEMPOTENCY_KEY_MISSING)

    let body: unknown
    if (def.multipart) {
      body = await request.formData()
    } else if (def.request) {
      const parsed = def.request.safeParse(await request.json().catch(() => undefined))
      if (!parsed.success) {
        console.warn(
          `[MOCK] ${key} 요청 body가 스키마와 다릅니다.`,
          describeIssues(parsed.error, 'body'),
        )
        return errorResponse(mock.invalid?.(parsed.error) ?? mockErrors.INVALID_REQUEST)
      }
      body = parsed.data
    }

    const requestSignature = `${request.url} ${JSON.stringify(body ?? null)}`
    if (idempotencyKey) {
      const cached = idempotencyCache.get(idempotencyKey)
      if (cached && cached.request !== requestSignature) {
        return errorResponse(mockErrors.IDEMPOTENCY_PAYLOAD_MISMATCH)
      }
      if (cached) return HttpResponse.json(cached.payload as never, { status: cached.status })
    }

    const ctx: MockContext<E> = {
      params: params as Record<string, string>,
      query: new URL(request.url).searchParams,
      body: body as MockBody<E>,
      request,
      scenario,
      ok: (data, status = 200) => ({ kind: 'ok', status, data }),
      fail: (error) => ({ kind: 'error', error }),
    }
    const reply = scenario === 'empty' && mock.empty ? mock.empty(ctx) : await mock.resolve(ctx)

    let status: number
    let payload: unknown
    if (reply.kind === 'error') {
      status = reply.error.status
      payload = {
        success: false,
        data: null,
        error: { code: reply.error.code, message: reply.error.message },
      }
    } else {
      const parsed = def.response.safeParse(reply.data)
      if (!parsed.success) {
        const issues = describeIssues(parsed.error)
        console.error(`[MOCK] ${key} 목 응답이 스키마와 다릅니다.`, issues)
        throw new Error(`[MOCK] ${key} 목 응답이 스키마와 다릅니다: ${issues.join(', ')}`)
      }
      status = reply.status
      payload = { success: true, data: parsed.data, error: null }
    }

    if (idempotencyKey)
      idempotencyCache.set(idempotencyKey, { request: requestSignature, status, payload })
    return HttpResponse.json(payload as never, { status })
  })
}

/** 경로 변수를 숫자로. 숫자가 아니면 NaN이라 어떤 목 데이터와도 맞지 않습니다. */
export function idParam(params: Record<string, string>, name: string) {
  return Number(params[name])
}

/** 쿼리의 page/size (기본 0, 20) */
export function pageParams(query: URLSearchParams, defaultSize = 20) {
  const page = Math.max(0, Number(query.get('page') ?? 0) || 0)
  const size = Math.max(1, Number(query.get('size') ?? defaultSize) || defaultSize)
  return { page, size }
}

export function paginate<T>(items: T[], page: number, size: number) {
  const start = page * size
  return {
    items: items.slice(start, start + size),
    page,
    size,
    hasNext: start + size < items.length,
  }
}
