import { useLocation, useNavigate } from 'react-router'
import type { RegisterStep } from '@/features/register/schemas'
import { REGISTER_STEPS, isStepDone, registerPath } from '@/features/register/schemas'
import type { NumberedStep } from '@/pages/register/step-meta'
import { currentHistoryIdx, registerEntryIdx } from '@/pages/register/register-history'
import { useRegisterStore } from '@/stores/register-store'

/** 단계 이동 때 넘기는 기록. 뒤로 가기에서 바로 앞 기록이 이전 단계인지 판단합니다. */
export interface RegisterNavState {
  from?: NumberedStep
  registered?: boolean
  /** 나가기 확인 시트 없이 이동(분석 완료 · 나중에 확인하기 등 화면이 직접 정한 이동) */
  skipBlock?: boolean
}

/** 이전 단계. 2/6의 이전은 분석 화면이 아니라 1/6 */
const PREV: Partial<Record<NumberedStep, NumberedStep>> = {
  '2': '1',
  '3': '2',
  '4': '3',
  '5': '4',
  '6': '5',
}

/** 처음 작성할 때의 다음 단계 */
const NEXT: Partial<Record<RegisterStep, RegisterStep>> = {
  '1': 'analyzing',
  analyzing: '2',
  '2': '3',
  '3': '4',
  '4': '5',
  '5': '6',
}

/**
 * '다음'으로 갈 단계.
 * 6/6에 한 번 들어온 뒤(고치러 돌아온 경우)에는 뒤 단계 중 아직 안 끝난 첫 단계, 모두 끝났으면 6/6.
 * 예: 6/6 → 2/6에서 브랜드를 고치면 가격을 다시 계산해야 하므로 3/6 → 4/6 → 6/6(5/6은 그대로라 건너뜀)
 */
export function nextStepAfter(step: RegisterStep): RegisterStep {
  const { draft, completed, reviewed } = useRegisterStore.getState()
  if (!reviewed) return NEXT[step] ?? '6'
  const later = REGISTER_STEPS.slice(REGISTER_STEPS.indexOf(step) + 1)
  return later.find((s) => !isStepDone(s, draft, completed)) ?? '6'
}

/** 경매 등록 단계 이동 */
export function useRegisterNav(step: NumberedStep) {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as RegisterNavState | null)?.from
  const prev = PREV[step]

  /** 다음 화면으로(기록을 쌓아 브라우저 뒤로 가기로 돌아올 수 있게) */
  const goTo = (next: RegisterStep, options: { replace?: boolean; from?: NumberedStep } = {}) => {
    // 6/6에서 바로 고치러 온 단계 → 6/6 기록으로 되돌아가 기록이 쌓이지 않게
    if (next === '6' && from === '6') return void navigate(-1)
    void navigate(registerPath(next), {
      replace: options.replace,
      state: { from: options.from ?? step } satisfies RegisterNavState,
    })
  }

  /** 이 단계를 끝내고 다음 단계로(6/6에서 고치러 온 경우 6/6으로) */
  const goNext = () => goTo(nextStepAfter(step))

  /*
   * 6/6에서 고치러 온 단계: 6/6으로 되돌아감.
   * 2/6~6/6: 이전 단계로(바로 앞 기록이 이전 단계면 기록을 되돌리고, 아니면 이전 단계로 바꿔 넣음).
   * 1/6: 등록 흐름 밖(진입점인 홈)으로. 기록을 되돌리면 주소로 오간 다른 단계로 갈 수 있어 홈으로 바꿔 넣습니다.
   * 1/6에서 나가면 확인 없이 작성 내용을 비웁니다(RegisterLayout).
   */
  const goBack = () => {
    if (from === '6' && step !== '6') return void navigate(-1)
    if (!prev) return void navigate('/', { replace: true })
    if (from === prev) void navigate(-1)
    else void navigate(registerPath(prev), { replace: true })
  }

  /**
   * 등록 완료 화면으로. 등록을 시작한 기록 위치까지 되돌린 뒤 완료 화면으로 바꿔 넣어(RegisterLayout),
   * 완료 화면에서 뒤로 가기를 누르면 등록 단계가 아니라 등록 전 화면으로 갑니다.
   */
  const goComplete = () => {
    const idx = currentHistoryIdx()
    const entry = registerEntryIdx()
    if (idx !== null && entry !== null && idx > entry) {
      useRegisterStore.getState().setCompleting(true)
      void navigate(entry - idx)
      return
    }
    void navigate(registerPath('complete'), {
      replace: true,
      state: { registered: true, skipBlock: true } satisfies RegisterNavState,
    })
  }

  return { goTo, goNext, goBack, goComplete }
}
