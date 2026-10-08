import type { z } from 'zod'
import type { EndpointDef } from '@/api/endpoints'
import { endpointKey, endpoints } from '@/api/endpoints'
import { apiEnvelopeSchema } from '@/api/schemas/common'
import { createUuid } from '@/lib/uuid'
import { useAuthStore } from '@/stores/auth-store'

/*
 * fetch 래퍼. 공통 응답 { success, data, error }를 풀어 data만 돌려주고,
 * 실패는 모두 ApiError로 throw 합니다. data는 엔드포인트의 Zod 스키마로 parse 합니다.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const DEFAULT_TIMEOUT_MS = 10_000

/* ───────── 에러 ───────── */

/**
 * - server: 서버가 공통 응답으로 실패를 돌려줌 (code = 명세 오류 코드)
 * - network: 서버에 닿지 못함
 * - timeout: 제한 시간 초과
 * - invalid-response: 응답이 JSON이 아니거나 스키마와 다름
 */
export type ApiErrorKind = 'server' | 'network' | 'timeout' | 'invalid-response'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  /** HTTP 상태. 응답을 받지 못했으면 null */
  readonly status: number | null
  /** 명세 오류 코드(API_ERROR_CODE). server가 아니면 null */
  readonly code: number | null
  /** 'POST /api/auctions/{auctionId}/bids' */
  readonly endpoint: string

  constructor(init: {
    kind: ApiErrorKind
    status: number | null
    code?: number | null
    message: string
    endpoint: string
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.code = init.code ?? null
    this.endpoint = init.endpoint
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** Zod 오류를 '필드 경로: 메시지' 목록으로. 콘솔 로그용 */
export function describeIssues(error: z.ZodError, root = 'data') {
  return error.issues.map((issue) => {
    const path = [root, ...issue.path.map(String)].join('.')
    return `${path}: ${issue.message}`
  })
}

/* ───────── 요청 옵션 타입 ───────── */

type PathParamNames<P extends string> = P extends `${string}{${infer Name}}${infer Rest}`
  ? Name | PathParamNames<Rest>
  : never

type ParamsOption<E extends EndpointDef> = [PathParamNames<E['path']>] extends [never]
  ? { params?: undefined }
  : { params: Record<PathParamNames<E['path']>, string | number> }

type BodyOption<E extends EndpointDef> = E extends { request: infer S extends z.ZodType }
  ? { body: z.input<S> }
  : E extends { multipart: true }
    ? { body: FormData }
    : { body?: undefined }

type QueryOption<E extends EndpointDef> = E extends { query: infer Q extends z.ZodType }
  ? { query?: z.input<Q> }
  : { query?: undefined }

export type RequestOptions<E extends EndpointDef> = ParamsOption<E> &
  BodyOption<E> &
  QueryOption<E> & {
    /** TanStack Query가 넘기는 취소 신호 */
    signal?: AbortSignal
    /** 같은 논리 요청을 다시 보낼 때 재사용할 키. 없으면 새로 만듭니다. */
    idempotencyKey?: string
  }

type RequestArgs<E extends EndpointDef> =
  object extends RequestOptions<E> ? [options?: RequestOptions<E>] : [options: RequestOptions<E>]

export type EndpointResponse<E extends EndpointDef> = z.output<E['response']>

/* ───────── URL ───────── */

export function buildPath(path: string, params: Record<string, string | number> = {}) {
  return path.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name]
    if (value === undefined) throw new Error(`경로 변수 ${name}이(가) 없습니다: ${path}`)
    return encodeURIComponent(String(value))
  })
}

function buildUrl(path: string, query?: Record<string, unknown>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) search.set(key, String(value))
  }
  const qs = search.toString()
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

/* ───────── 전송 ───────── */

interface SendInput {
  label: string
  url: string
  def: EndpointDef
  body: unknown
  signal?: AbortSignal
  idempotencyKey?: string
}

async function send({ label, url, def, body, signal, idempotencyKey }: SendInput) {
  const headers = new Headers({ Accept: 'application/json' })
  const accessToken = def.auth === 'none' ? null : useAuthStore.getState().accessToken
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey)

  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body // Content-Type(boundary 포함)은 브라우저가 붙입니다.
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    payload = JSON.stringify(body)
  }

  /* 호출 측 취소와 타임아웃을 하나의 신호로 묶습니다. */
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, def.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const forwardAbort = () => controller.abort(signal?.reason)
  if (signal?.aborted) forwardAbort()
  else signal?.addEventListener('abort', forwardAbort, { once: true })

  try {
    const response = await fetch(url, {
      method: def.method,
      headers,
      body: payload,
      signal: controller.signal,
    })
    return { response }
  } catch (error) {
    // 화면 이탈 등으로 호출 측이 취소한 경우는 그대로 넘겨 TanStack Query가 처리하게 합니다.
    if (signal?.aborted) throw error
    throw new ApiError({
      kind: timedOut ? 'timeout' : 'network',
      status: null,
      message: timedOut ? '요청 시간이 초과되었습니다.' : '서버에 연결할 수 없습니다.',
      endpoint: label,
    })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
  }
}

async function unwrap<E extends EndpointDef>(def: E, label: string, response: Response) {
  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new ApiError({
      kind: 'invalid-response',
      status: response.status,
      message: `JSON이 아닌 응답입니다. (HTTP ${response.status})`,
      endpoint: label,
    })
  }

  const envelope = apiEnvelopeSchema.safeParse(json)
  if (!envelope.success) {
    console.error(
      `[API] ${label} 공통 응답 형태가 아닙니다.`,
      describeIssues(envelope.error, 'body'),
    )
    throw new ApiError({
      kind: 'invalid-response',
      status: response.status,
      message: '공통 응답 형태가 아닙니다.',
      endpoint: label,
    })
  }

  const { success, data, error } = envelope.data
  if (!response.ok || !success) {
    throw new ApiError({
      kind: 'server',
      status: response.status,
      code: error?.code ?? null,
      message: error?.message ?? `요청에 실패했습니다. (HTTP ${response.status})`,
      endpoint: label,
    })
  }

  const parsed = def.response.safeParse(data)
  if (!parsed.success) {
    console.error(`[API] ${label} 응답이 스키마와 다릅니다.`, describeIssues(parsed.error))
    throw new ApiError({
      kind: 'invalid-response',
      status: response.status,
      message: '응답이 스키마와 다릅니다.',
      endpoint: label,
    })
  }
  return parsed.data as EndpointResponse<E>
}

/* ───────── 토큰 재발급 ───────── */

let refreshing: Promise<boolean> | null = null

/** 401을 받으면 Refresh Token으로 Access Token을 한 번 재발급합니다. 동시에 여러 요청이 와도 한 번만 호출합니다. */
function refreshAccessToken() {
  refreshing ??= (async () => {
    const { refreshToken, setAccessToken, clear } = useAuthStore.getState()
    if (!refreshToken) return false
    try {
      setAccessToken(await request(endpoints.refreshToken, { body: { refreshToken } }))
      return true
    } catch {
      clear()
      return false
    }
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

/* ───────── 요청 전 준비 ───────── */

let beforeRequest: (() => Promise<void>) | null = null

/** 모든 요청 직전에 기다릴 작업을 정합니다(목이 켜진 빌드에서 MSW 워커 재등록, src/main.tsx). */
export function setBeforeRequest(hook: (() => Promise<void>) | null) {
  beforeRequest = hook
}

/* ───────── 공개 함수 ───────── */

/**
 * 엔드포인트를 호출하고 parse된 data를 돌려줍니다.
 * @example request(endpoints.getAuctionDetail, { params: { auctionId: 1 } })
 */
export async function request<E extends EndpointDef>(
  def: E,
  ...[options]: RequestArgs<E>
): Promise<EndpointResponse<E>> {
  const opts = (options ?? {}) as {
    params?: Record<string, string | number>
    query?: Record<string, unknown>
    body?: unknown
    signal?: AbortSignal
    idempotencyKey?: string
  }
  if (beforeRequest) await beforeRequest()
  const label = endpointKey(def)
  const input: SendInput = {
    label,
    url: buildUrl(buildPath(def.path, opts.params), opts.query),
    def,
    body: opts.body,
    signal: opts.signal,
    // 재발급 후 다시 보낼 때도 같은 키를 씁니다(같은 논리 요청).
    idempotencyKey: def.idempotent ? (opts.idempotencyKey ?? createUuid()) : undefined,
  }

  const first = await send(input)
  /* 토큰이 만료됐거나 refresh 토큰만 있는 경우(개발용 토큰 등) 한 번 재발급하고 다시 보냅니다. */
  if (first.response.status === 401 && def.auth !== 'none' && (await refreshAccessToken())) {
    return unwrap(def, label, (await send(input)).response)
  }
  return unwrap(def, label, first.response)
}
