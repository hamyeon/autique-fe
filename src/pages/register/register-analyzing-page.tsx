import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { isApiError } from '@/api/client'
import { getProductAnalysis, productKeys } from '@/api/products'
import { API_ERROR_CODE } from '@/api/schemas/common'
import { BottomButtonBar } from '@/components/ds'
import { ErrorState, LoadingIllustration } from '@/components/feedback'
import type { AnalysisStage } from '@/features/register/analysis'
import {
  ANALYSIS_MAX_WAIT_MS,
  ANALYSIS_MIN_STAGE_MS,
  ANALYSIS_POLL_INTERVAL_MS,
  ANALYSIS_POLL_MAX_FAILURES,
  ANALYSIS_STAGE_COPY,
  isAnalysisDone,
  isAnalysisFailed,
  targetStage,
} from '@/features/register/analysis'
import type { RegisterFailure } from '@/features/register/errors'
import { ANALYSIS_FAILED, toRegisterFailure } from '@/features/register/errors'
import { uploadPhotos } from '@/features/register/analysis-session'
import { analysisToDraft, isStepDone, registerPath } from '@/features/register/schemas'
import { onAppForeground } from '@/lib/app-visibility'
import { Screen } from '@/layouts/screen'
import type { RegisterNavState } from '@/pages/register/use-register-nav'
import { nextStepAfter } from '@/pages/register/use-register-nav'
import { useRegisterStore } from '@/stores/register-store'

/* ───────── 화면 ───────── */

type Failed = {
  failure: RegisterFailure
  /** 다시 시도할 때: upload = 새로 분석 요청, poll = 같은 작업을 다시 조회 */
  retry: 'upload' | 'poll'
}

/**
 * AI 상품 분석 로딩(Figma AI 상품 분석 로딩 (1) 693:2699 · (2) 551:2310 · (3) 693:2648 · (4) 693:2679).
 * 1/6 '다음' → 사진 업로드 + 분석 접수 → 폴링 → 결과를 2/6 기본값으로 채우고 2/6으로.
 * - 단계: 서버가 visionProgress를 주면 그 값, 없으면 시간 기준. (4)는 결과가 올 때까지 머묾. 단계마다 최소 표시 시간
 * - 작업 ID는 스토어(sessionStorage)에 있어 새로고침 · 나갔다 와도 이어서 기다림. 앱이 다시 보이면 바로 한 번 조회
 * - 최대 대기 시간을 넘기면 '분석이 오래 걸리고 있어요'(다시 확인 / 나중에 확인하기)
 * - 뒤로 가기 확인 시트는 RegisterLayout이 띄웁니다(분석은 서버에서 계속되므로 나가도 취소되지 않음).
 */
export function RegisterAnalyzingPage() {
  const navigate = useNavigate()
  const task = useRegisterStore((s) => s.analysisTask)
  const setAnalysisTask = useRegisterStore((s) => s.setAnalysisTask)

  const [failed, setFailed] = useState<Failed | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [stage, setStage] = useState<AnalysisStage>(1)
  /** 지금 단계를 보여주기 시작한 시각(0이면 첫 틱에서 채움) */
  const stageShownAt = useRef(0)
  /** 업로드 중에도 단계 시간을 재기 위한 화면 진입 시각(0이면 첫 틱에서 채움) */
  const mountedAt = useRef(0)
  /** 최대 대기 시간 기준점: 접수 시각 또는 이 화면에 다시 들어온 시각 중 늦은 쪽('다시 확인'을 누르면 지금부터 다시) */
  const waitFrom = useRef<number | null>(null)
  /** 결과를 받아 2/6으로 넘어가는 중이면 업로드를 다시 시작하지 않습니다. */
  const finishing = useRef(false)
  const pollFailures = useRef(0)
  /** 틱에서 이미 처리한 조회 결과 · 실패 시각 */
  const seen = useRef({ dataAt: 0, errorAt: 0 })

  /* 이미 분석을 끝낸 상태로 주소로 들어오면 다시 분석하지 않고 다음 단계로 */
  useEffect(() => {
    const { draft, completed } = useRegisterStore.getState()
    if (!isStepDone('analyzing', draft, completed)) return
    finishing.current = true
    void navigate(registerPath(nextStepAfter('analyzing')), {
      replace: true,
      state: { from: '1', skipBlock: true } satisfies RegisterNavState,
    })
  }, [navigate])

  /* 작업이 없으면 업로드부터. 업로드가 끝나면 화면을 떠났어도 작업 ID는 스토어에 남습니다. */
  const startUpload = () => {
    uploadPhotos()
      .then((next) => {
        pollFailures.current = 0
        waitFrom.current = next.startedAt
        setAnalysisTask(next)
      })
      .catch((error: unknown) => setFailed({ failure: toRegisterFailure(error), retry: 'upload' }))
  }

  useEffect(() => {
    if (task || failed || finishing.current) return
    startUpload()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 작업이 없어질 때(처음 · 실패 후 다시 시도)만
  }, [task, failed])

  /* ───────── 폴링 ───────── */

  const analysisQuery = useQuery({
    queryKey: productKeys.analysis(task?.id ?? -1),
    queryFn: ({ signal }) => getProductAnalysis(task!.id, signal),
    enabled: task !== null && failed === null && !timedOut,
    staleTime: 0,
    gcTime: 0,
    // 실패는 아래에서 직접 셉니다(일시적인 끊김은 다음 폴링으로 조용히 넘김).
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status && (isAnalysisDone(status) || isAnalysisFailed(status))) return false
      return ANALYSIS_POLL_INTERVAL_MS
    },
  })
  const analysis = analysisQuery.data
  const resultReady = analysis !== undefined && isAnalysisDone(analysis.status)

  /* 앱이 다시 보이면 바로 한 번 조회 */
  useEffect(
    () =>
      onAppForeground(() => {
        if (useRegisterStore.getState().analysisTask) void analysisQuery.refetch()
      }),
    [analysisQuery],
  )

  /* ───────── 단계 진행 · 최대 대기 · 완료 ───────── */

  /* 틱(타이머)에서 최신 값을 읽도록 그릴 때마다 옮겨 둡니다. */
  const snapshot = {
    analysis,
    resultReady,
    stage,
    task,
    timedOut,
    failed,
    error: analysisQuery.error,
    errorAt: analysisQuery.errorUpdatedAt,
    dataAt: analysisQuery.dataUpdatedAt,
  }
  const latest = useRef(snapshot)
  useEffect(() => {
    latest.current = snapshot
  })

  useEffect(() => {
    const finish = (result: NonNullable<typeof analysis>) => {
      finishing.current = true
      const { completeStep, uncompleteStep } = useRegisterStore.getState()
      if (!completeStep('analyzing', analysisToDraft(result))) return
      // 새 분석 값으로 2/6을 덮어썼으니 다시 확인받습니다(6/6에서 사진을 고친 경우 포함).
      uncompleteStep('2')
      setAnalysisTask(null)
      // 로딩 화면은 기록에 남기지 않아 2/6에서 뒤로 가면 1/6으로 갑니다.
      void navigate(registerPath('2'), {
        replace: true,
        state: { from: '1', skipBlock: true } satisfies RegisterNavState,
      })
    }

    /** 조회 실패: 401 · 세션 없음은 바로, 끊김 · 서버 오류는 연속 N번이면 알림. 알렸으면 true */
    const checkPollError = (): boolean => {
      const { error, errorAt, dataAt } = latest.current
      if (dataAt !== seen.current.dataAt) {
        seen.current.dataAt = dataAt
        pollFailures.current = 0
      }
      if (!error || errorAt === seen.current.errorAt) return false
      seen.current.errorAt = errorAt
      pollFailures.current += 1
      const fatal =
        isApiError(error) &&
        (error.status === 401 || error.code === API_ERROR_CODE.ANALYSIS_SESSION_NOT_FOUND)
      if (!fatal && pollFailures.current < ANALYSIS_POLL_MAX_FAILURES) return false
      const failure = toRegisterFailure(error)
      if (failure.kind === 'analysis') setAnalysisTask(null) // 세션이 없으면 새로 분석해야 함
      setFailed({ failure, retry: failure.kind === 'analysis' ? 'upload' : 'poll' })
      return true
    }

    const tick = () => {
      const { analysis, resultReady, stage, task, timedOut, failed } = latest.current
      if (finishing.current || failed) return
      const now = Date.now()
      if (!mountedAt.current) mountedAt.current = now
      if (!stageShownAt.current) stageShownAt.current = now
      const shownFor = now - stageShownAt.current

      if (checkPollError()) return

      // 분석 실패 응답(200 + *_FAILED): 작업은 끝났으므로 지우고 다시 시도 / 정보 수정하기
      if (analysis && isAnalysisFailed(analysis.status)) {
        console.warn('[분석 실패]', analysis.status, analysis.failureStage, analysis.failureMessage)
        setAnalysisTask(null)
        setFailed({ failure: ANALYSIS_FAILED, retry: 'upload' })
        return
      }

      if (resultReady && analysis) {
        if (timedOut) setTimedOut(false)
        // 결과가 오면 지금 단계를 최소 시간만큼 보여준 뒤 (4)로, (4)도 최소 시간 보여준 뒤 2/6으로
        if (stage === 4 && shownFor >= ANALYSIS_MIN_STAGE_MS) return finish(analysis)
        if (stage < 4 && shownFor >= ANALYSIS_MIN_STAGE_MS) {
          setStage(4)
          stageShownAt.current = now
        }
        return
      }

      const clockStart = task?.startedAt ?? mountedAt.current
      const target = targetStage(analysis, now - clockStart)
      if (stage < target && shownFor >= ANALYSIS_MIN_STAGE_MS) {
        setStage((stage + 1) as AnalysisStage)
        stageShownAt.current = now
      }

      if (task && !timedOut) {
        // 나갔다 돌아온 경우에는 돌아온 때부터 다시 잽니다(그새 끝났을 수 있어 먼저 조회부터).
        waitFrom.current ??= Math.max(task.startedAt, mountedAt.current)
        if (now - waitFrom.current > ANALYSIS_MAX_WAIT_MS) setTimedOut(true)
      }
    }

    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [navigate, setAnalysisTask])

  /* ───────── 행동 ───────── */

  const retry = () => {
    if (!failed) return
    pollFailures.current = 0
    if (failed.retry === 'upload') {
      setAnalysisTask(null)
      mountedAt.current = Date.now()
      setStage(1)
      stageShownAt.current = Date.now()
      setFailed(null) // 작업이 없으므로 업로드가 다시 시작됩니다.
    } else {
      waitFrom.current = Date.now()
      setFailed(null)
    }
  }

  const checkAgain = () => {
    waitFrom.current = Date.now()
    setTimedOut(false)
    void analysisQuery.refetch()
  }

  /** 1/6으로(사진 바꾸기). 진행 중인 작업이 있어도 묻지 않습니다. */
  const editPhotos = () =>
    navigate(registerPath('1'), {
      replace: true,
      state: { skipBlock: true } satisfies RegisterNavState,
    })

  /** 홈으로. 작성 내용과 작업 ID는 남겨 두어 '경매 등록'을 다시 누르면 이어서 기다립니다. */
  const checkLater = () => navigate('/', { state: { skipBlock: true } satisfies RegisterNavState })

  /* ───────── 그리기 ───────── */

  if (failed) {
    const { failure } = failed
    const canEdit = failure.step === '1' || failed.retry === 'upload'
    return (
      <Screen
        className="justify-center"
        bottom={
          failure.kind === 'invalid' ? (
            <BottomButtonBar
              layout="single"
              primaryLabel="사진 다시 고르기"
              onPrimary={editPhotos}
            />
          ) : canEdit ? (
            <BottomButtonBar
              layout="double"
              primaryLabel="다시 시도"
              secondaryLabel="정보 수정하기"
              onPrimary={retry}
              onSecondary={editPhotos}
            />
          ) : (
            <BottomButtonBar layout="single" primaryLabel="다시 시도" onPrimary={retry} />
          )
        }
      >
        <ErrorState title={failure.title} description={failure.message} />
      </Screen>
    )
  }

  const copy = timedOut
    ? {
        title: '분석이 오래 걸리고 있어요',
        description:
          '분석은 서버에서 계속되고 있어요. 지금 다시 확인하거나, 나중에 확인할 수 있어요.',
      }
    : ANALYSIS_STAGE_COPY[stage]

  return (
    <Screen
      className="items-center justify-center"
      bottom={
        timedOut ? (
          <BottomButtonBar
            layout="double"
            primaryLabel="다시 확인"
            secondaryLabel="나중에 확인하기"
            onPrimary={checkAgain}
            onSecondary={checkLater}
          />
        ) : undefined
      }
    >
      <div className="gap-space-24 flex flex-col items-center" role="status" aria-live="polite">
        <LoadingIllustration />
        {/* 단계가 바뀔 때 글자만 부드럽게 바뀝니다(일러스트 움직임은 이어짐). */}
        <div
          key={timedOut ? 'timeout' : stage}
          className="gap-stack-tight animate-in fade-in flex flex-col items-center text-center duration-300 motion-reduce:animate-none"
        >
          <p className="text-body01 text-black0">{copy.title}</p>
          <p className="text-body04 text-gray5">{copy.description}</p>
        </div>
      </div>
    </Screen>
  )
}
