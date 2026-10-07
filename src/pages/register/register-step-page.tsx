import type { ReactNode } from 'react'
import { BottomButtonBar, Header, StepHeader } from '@/components/ds'
import { Screen } from '@/layouts/screen'
import type { NumberedStep } from '@/pages/register/step-meta'
import { STEP_META } from '@/pages/register/step-meta'
import { useRegisterNav } from '@/pages/register/use-register-nav'

export interface RegisterStepScreenProps {
  step: NumberedStep
  /** 검증을 통과하기 전에는 true(다음 버튼 비활성) */
  nextDisabled?: boolean
  /** 주 버튼 문구를 잠시 바꿀 때(제출 중 등). 기본은 단계 문구 */
  nextLabel?: string
  onNext: () => void
  /** 4/6 '가격 수정하기' */
  onSecondary?: () => void
  children?: ReactNode
}

/**
 * 경매 등록 단계 화면 틀: Header(뒤로 가기) + StepHeader + 입력 + 아래 버튼.
 * 여백은 README '경매 등록 단계 화면' 규칙(헤더 아래 · StepHeader와 입력 사이 layout-step 32).
 */
export function RegisterStepScreen({
  step,
  nextDisabled,
  nextLabel,
  onNext,
  onSecondary,
  children,
}: RegisterStepScreenProps) {
  const { goBack } = useRegisterNav(step)
  const meta = STEP_META[step]

  return (
    <Screen
      top="step"
      className="gap-layout-step"
      header={<Header title="경매 등록하기" onBack={goBack} />}
      bottom={
        'secondary' in meta ? (
          <BottomButtonBar
            layout="double"
            primaryLabel={nextLabel ?? meta.next}
            secondaryLabel={meta.secondary}
            primaryDisabled={nextDisabled}
            onPrimary={onNext}
            onSecondary={onSecondary}
          />
        ) : (
          <BottomButtonBar
            layout="single"
            primaryLabel={nextLabel ?? meta.next}
            primaryDisabled={nextDisabled}
            onPrimary={onNext}
          />
        )
      }
    >
      <StepHeader
        step={`${step}/6`}
        title={meta.title}
        description={meta.description.split('\n').map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      />
      {children}
    </Screen>
  )
}
