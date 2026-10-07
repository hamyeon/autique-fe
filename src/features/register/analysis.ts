import type { AnalysisStatus, ProductAnalysis } from '@/api/schemas/products'

/*
 * AI 상품 분석(업로드 → 폴링) 화면 규칙.
 * 명세: POST /api/products/analyze(202 + analysisId) → GET /api/products/analyze/{taskId}를
 * AWAITING_USER_CONFIRMATION 또는 *_FAILED가 될 때까지 폴링. 분석은 서버 백그라운드 작업이라
 * 화면을 떠나도 취소되지 않습니다(취소 API 없음).
 */

/* ───────── 조절용 상수 ───────── */

/** 폴링 간격 */
export const ANALYSIS_POLL_INTERVAL_MS = 1500
/** 이 시간이 지나도 결과가 없으면 '분석이 오래 걸리고 있어요'(사용자 결정: 60초) */
export const ANALYSIS_MAX_WAIT_MS = 60_000
/**
 * 시간 기준 진행: 서버가 진행 단계(visionProgress)를 주지 않을 때 (1)→(2)→(3)→(4)로 넘어가는 시각(접수부터 ms).
 * 실서버(2026-10-07)는 진행 중에도 visionProgress가 null이고 분석은 약 4초 걸림.
 */
export const ANALYSIS_STAGE_AT_MS = [0, 2500, 6000, 10_000] as const
/** 각 단계를 최소 이만큼 보여줍니다(응답이 빨라도 깜빡이듯 지나가지 않게). */
export const ANALYSIS_MIN_STAGE_MS = 1500
/** 폴링이 연속으로 이만큼 실패하면(네트워크) '연결이 불안정해요'를 보여줍니다. 그 전에는 조용히 다시 조회 */
export const ANALYSIS_POLL_MAX_FAILURES = 3

/* ───────── 상태 ───────── */

/** 로딩 화면 단계(Figma AI 상품 분석 로딩 (1)~(4)) */
export type AnalysisStage = 1 | 2 | 3 | 4

export const ANALYSIS_STAGE_COPY: Record<AnalysisStage, { title: string; description: string }> = {
  1: { title: 'AI가 이미지를 분석하고 있어요', description: '잠시만 기다려주세요' },
  2: { title: 'AI가 상품 정보를 확인하고 있어요', description: '브랜드와 상품 정보를 찾고 있어요' },
  3: {
    title: 'AI가 상품 상태를 확인하고 있어요',
    description: '오염, 마모 상태를 살펴보고 있어요',
  },
  4: { title: '결과를 불러오고 있어요', description: '잠시만 기다려주세요' },
}

const FAILED: ReadonlySet<AnalysisStatus> = new Set([
  'IMAGE_UPLOAD_FAILED',
  'QUEUE_FAILED',
  'VISION_FAILED',
  'PRICING_FAILED',
])

/** Vision 분석이 끝나 2/6에 쓸 값이 있는 상태(가격 계산 이후 상태 포함) */
const DONE: ReadonlySet<AnalysisStatus> = new Set([
  'AWAITING_USER_CONFIRMATION',
  'PRICING_PROCESSING',
  'COMPLETED',
])

export const isAnalysisFailed = (status: AnalysisStatus) => FAILED.has(status)
export const isAnalysisDone = (status: AnalysisStatus) => DONE.has(status)

/**
 * 지금 보여줘야 할 단계(목표).
 * - 서버가 visionProgress를 주면 그 값 기준: 접수 · 대기 (1) → Vision 시작 · 1단계 끝(브랜드 · 모델) (2) → 2단계 끝(라벨) 이후 (3)
 * - 주지 않으면 접수 후 지난 시간 기준(ANALYSIS_STAGE_AT_MS). (4)는 결과가 올 때까지 머뭅니다.
 * 결과를 받은 경우는 화면에서 바로 (4)로 넘어가므로 여기서는 다루지 않습니다.
 */
export function targetStage(
  analysis: ProductAnalysis | undefined,
  elapsedMs: number,
): AnalysisStage {
  const progress = analysis?.visionProgress
  if (progress) return progress.completedStages >= 2 ? 3 : 2
  if (analysis?.status === 'VISION_PROCESSING' && analysis.preliminary) return 2

  let stage: AnalysisStage = 1
  ANALYSIS_STAGE_AT_MS.forEach((at, i) => {
    if (elapsedMs >= at) stage = (i + 1) as AnalysisStage
  })
  return stage
}
