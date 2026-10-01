import type { ReactNode } from 'react'
import { forwardRef, useId } from 'react'
import { useControllableState } from '@/hooks/use-controllable-state'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

export interface AmountStepperProps {
  label?: string
  /** 제어형 값(원) */
  value?: number
  /** 비제어형 초기값. 없으면 min */
  defaultValue?: number
  onChange?: (value: number) => void
  /** 기본 0 */
  min?: number
  /** 없으면 상한 없음 */
  max?: number
  /** 한 번에 오르내리는 단위. 기본 5,000(최소 입찰 단위) */
  step?: number
  /** 표시 형식. 기본 '120,000원' */
  format?: (value: number) => ReactNode
  /** 규칙 캡션 */
  hint?: ReactNode
  /** 에러 메시지 (DS 확장) */
  error?: ReactNode
  className?: string
}

/**
 * − 금액 + 스테퍼. min·max·step을 받아 스스로 계산하고, 한계에 닿으면 해당 버튼을 막습니다.
 * DS 원본은 표시값 + onDecrease/onIncrease + minDisabled/maxDisabled를 소비 측이 계산했는데,
 * 요청에 따라 숫자 값을 받는 형태로 바꿨습니다.
 * ref는 묶음 루트(tabIndex -1)로 전달되어 RHF setFocus·에러 포커스가 동작합니다.
 */
export const AmountStepper = forwardRef<HTMLDivElement, AmountStepperProps>(function AmountStepper(
  {
    label,
    value,
    defaultValue,
    onChange,
    min = 0,
    max = Infinity,
    step = 5000,
    format = formatPrice,
    hint,
    error,
    className,
  },
  ref,
) {
  const [current, setCurrent] = useControllableState(value, defaultValue ?? min, onChange)
  const id = useId()
  const labelId = `${id}-label`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const atMin = current <= min
  const atMax = current >= max
  const clamp = (v: number) => Math.min(max, Math.max(min, v))

  return (
    <div className={cn('gap-form-label flex w-full flex-col', className)}>
      {label && (
        <span id={labelId} className="text-body04 text-gray7">
          {label}
        </span>
      )}
      <div
        ref={ref}
        role="group"
        tabIndex={-1}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'py-space-8 px-space-12 flex items-center justify-between rounded-sm border focus:outline-none',
          error ? 'border-error1' : 'border-gray2',
        )}
      >
        <StepButton
          label="금액 내리기"
          icon="Minus"
          disabled={atMin}
          onClick={() => setCurrent(clamp(current - step))}
        />
        <output aria-live="polite" className="text-title02 text-black0">
          {format(current)}
        </output>
        <StepButton
          label="금액 올리기"
          icon="Add"
          disabled={atMax}
          onClick={() => setCurrent(clamp(current + step))}
        />
      </div>
      {(hint || error) && (
        <div className="gap-stack-tight flex flex-col">
          {error && (
            <p id={errorId} role="alert" className="text-caption01 text-error1">
              {error}
            </p>
          )}
          {hint && (
            <p id={hintId} className="text-caption02 text-gray5">
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  )
})

function StepButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string
  icon: 'Minus' | 'Add'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      /* 아이콘 24px, 터치 영역 44px. 음수 여백으로 박스 크기는 원본과 같게 둡니다. */
      className="focus-visible:outline-primary1 -m-2.5 flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 disabled:opacity-30"
    >
      <Icon name={icon} />
    </button>
  )
}
