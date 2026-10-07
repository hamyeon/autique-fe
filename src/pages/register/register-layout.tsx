import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useBlocker, useLocation, useNavigate } from 'react-router'
import { BottomButtonBar, BottomSheet } from '@/components/ds'
import type { RegisterStep } from '@/features/register/schemas'
import {
  REGISTER_STEPS,
  canEnterStep,
  firstIncompleteStep,
  registerPath,
} from '@/features/register/schemas'
import {
  currentHistoryIdx,
  registerEntryIdx,
  rememberRegisterEntry,
} from '@/pages/register/register-history'
import type { RegisterNavState } from '@/pages/register/use-register-nav'
import { selectIsDirty, useRegisterStore } from '@/stores/register-store'

/**
 * /register/* 공통: 단계 순서 지키기 + 나가기 확인 + 완료 화면 이동.
 * - 앞 단계를 끝내지 않고 주소로 뒤 단계에 들어오면 첫 미완료 단계로 보냅니다.
 * - 작성 중에 2/6 이후에서 등록 흐름 밖으로 나가려 하면(브라우저 뒤로 가기, 다른 탭 · 링크) 확인 시트를 띄웁니다.
 * - 1/6에서 나가면(헤더 · 브라우저 뒤로 가기) 시트 없이 작성 내용을 비우고 나갑니다(사용자 결정).
 * - AI 분석 중에 다른 화면으로 가려 하면 '분석이 진행 중이에요' 시트. 분석은 서버 작업이라 나가도 취소되지 않고,
 *   작성 내용 · 작업 ID를 남겨 두어 다시 들어오면 이어서 기다립니다(명세: 비동기 Worker, 취소 API 없음).
 * - 등록에 성공하면 등록을 시작한 기록 위치로 되돌아간 뒤 완료 화면으로 바꿔 넣습니다(use-register-nav goComplete).
 */
export function RegisterLayout() {
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const draft = useRegisterStore((s) => s.draft)
  const completed = useRegisterStore((s) => s.completed)
  const isDirty = useRegisterStore(selectIsDirty)
  const analysisRunning = useRegisterStore((s) => s.analysisTask !== null)
  const completing = useRegisterStore((s) => s.completing)
  const reset = useRegisterStore((s) => s.reset)

  /* 등록 흐름에 들어온 기록 위치 */
  useEffect(() => rememberRegisterEntry(), [])

  const onAnalysis = pathname === registerPath('analyzing')
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if ((nextLocation.state as RegisterNavState | null)?.skipBlock) return false
    if (useRegisterStore.getState().completing) return false
    const leavingAnalysis =
      currentLocation.pathname === registerPath('analyzing') &&
      useRegisterStore.getState().analysisTask !== null &&
      nextLocation.pathname !== currentLocation.pathname
    return leavingAnalysis || (isDirty && !nextLocation.pathname.startsWith('/register'))
  })
  const blocked = blocker.state === 'blocked'
  /* AI 분석 중에 나가려는 경우 */
  const blockedOnAnalysis = blocked && onAnalysis && analysisRunning
  /* 1/6에서 나가는 경우: 묻지 않고 비운 뒤 그대로 이동 */
  const leavingFromFirst = blocked && pathname === registerPath('1')
  const leaving = useRef(false)
  useEffect(() => {
    if (!leavingFromFirst || leaving.current) return
    leaving.current = true
    void reset().then(() => {
      leaving.current = false
      blocker.proceed?.()
    })
  }, [leavingFromFirst, reset, blocker])

  /* 등록 성공: 시작 위치까지 기록을 되돌렸으면 그 자리를 완료 화면으로 바꿉니다. */
  useEffect(() => {
    if (!completing || currentHistoryIdx() !== registerEntryIdx()) return
    useRegisterStore.getState().setCompleting(false)
    void navigate(registerPath('complete'), {
      replace: true,
      state: { registered: true, skipBlock: true } satisfies RegisterNavState,
    })
  }, [completing, pathname, navigate])

  // 기록을 되돌리는 동안 거쳐 가는 화면은 그리지 않습니다(완료 직전 1/6 등이 깜빡이지 않게).
  if (completing) return null

  const segment = pathname.split('/')[2] ?? ''
  const step = REGISTER_STEPS.find((s) => s === segment) as RegisterStep | undefined
  const firstIncomplete = registerPath(firstIncompleteStep(draft, completed))

  // /register, 없는 단계 → 첫 미완료 단계
  if (segment !== 'complete' && !step) return <Navigate to={firstIncomplete} replace />
  // 등록 완료 화면은 6/6에서 등록하고 넘어온 경우에만
  if (segment === 'complete' && !(state as RegisterNavState | null)?.registered) {
    return <Navigate to={firstIncomplete} replace />
  }
  if (step && !canEnterStep(step, draft, completed))
    return <Navigate to={firstIncomplete} replace />

  return (
    <>
      <Outlet />
      <BottomSheet
        open={blockedOnAnalysis}
        onClose={() => blocker.reset?.()}
        title="분석이 진행 중이에요"
        footer={
          <BottomButtonBar
            layout="double"
            primaryLabel="계속 기다리기"
            secondaryLabel="나가기"
            onPrimary={() => blocker.reset?.()}
            onSecondary={() => blocker.proceed?.()}
          />
        }
      >
        <p className="text-body05 text-gray6">
          지금 나가도 분석은 서버에서 계속돼요. 사진을 바꾸지 않고 다시 경매 등록을 이어가면 분석
          결과를 이어서 확인할 수 있어요.
        </p>
      </BottomSheet>
      <BottomSheet
        open={blocked && !leavingFromFirst && !blockedOnAnalysis}
        onClose={() => blocker.reset?.()}
        title="작성 중인 내용이 사라져요"
        footer={
          <BottomButtonBar
            layout="primaryDanger"
            primaryLabel="계속 작성하기"
            dangerLabel="나가기"
            onPrimary={() => blocker.reset?.()}
            onDanger={async () => {
              await reset()
              blocker.proceed?.()
            }}
          />
        }
      >
        <p className="text-body05 text-gray6">
          지금 나가면 입력한 정보와 사진이 모두 지워져요. 경매 등록을 그만둘까요?
        </p>
      </BottomSheet>
    </>
  )
}
