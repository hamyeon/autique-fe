import type { ReactNode } from 'react'
import { forwardRef, Fragment, useId } from 'react'
import { RadioGroup } from 'radix-ui'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cn } from '@/lib/utils'

export interface RadioOption {
  value: string
  label: ReactNode
  /** 42×24 배지 이미지 URL(결제사 로고 등). 제3자 로고는 소비 측이 제공합니다. */
  badge?: string
}

export interface RadioListProps {
  /** 보이지 않는 이름(스크린리더). 화면 제목은 소비 측이 따로 둡니다. */
  label?: string
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** 에러 메시지 (DS 확장) */
  error?: ReactNode
  /** RHF Controller의 field.onBlur 등 (DS 확장) */
  onBlur?: () => void
  className?: string
}

/**
 * 하나를 고르는 세로 목록. Radix RadioGroup이 radio 역할·화살표 키 이동을 맡고 겉모양만 DS로 입혔습니다.
 * ref는 묶음 루트로 전달되며, focus()하면 Radix가 선택된 행(없으면 첫 행)으로 포커스를 옮깁니다.
 */
export const RadioList = forwardRef<HTMLDivElement, RadioListProps>(function RadioList(
  { label, options, value, defaultValue, onChange, error, onBlur, className },
  ref,
) {
  const [current, setCurrent] = useControllableState(value, defaultValue ?? '', onChange)
  const errorId = `${useId()}-error`

  return (
    <div className={cn('gap-stack-tight flex w-full flex-col', className)}>
      <RadioGroup.Root
        ref={ref}
        value={current}
        onValueChange={setCurrent}
        onBlur={onBlur}
        aria-label={label}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'gap-space-12 p-space-12 flex w-full flex-col rounded-sm border',
          error ? 'border-error1' : 'border-gray1',
        )}
      >
        {options.map((option, i) => (
          <Fragment key={option.value}>
            {i > 0 && <div aria-hidden className="bg-gray1 h-px" />}
            <RadioGroup.Item
              value={option.value}
              /* 행 높이는 24px(Figma)이고, 위아래 10px 보이지 않는 터치 영역으로 44px */
              className="text-body04 text-black0 gap-space-8 focus-visible:outline-primary1 relative flex w-full items-center rounded-sm text-left before:absolute before:inset-x-0 before:-inset-y-2.5 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <RadioMark checked={option.value === current} />
              {option.badge && (
                <img src={option.badge} alt="" className="h-6 w-10.5 shrink-0 object-contain" />
              )}
              <span className="min-w-0">{option.label}</span>
            </RadioGroup.Item>
          </Fragment>
        ))}
      </RadioGroup.Root>
      {error && (
        <p id={errorId} role="alert" className="text-caption01 text-error1">
          {error}
        </p>
      )}
    </div>
  )
})

/** 24px 라디오(Figma _Radio). 선택: black0 굵은 링(4), 미선택: gray5 얇은 링(1) */
function RadioMark({ checked }: { checked: boolean }) {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={cn('shrink-0', checked ? 'text-black0' : 'text-gray5')}
    >
      {checked ? (
        <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
      ) : (
        <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="1" />
      )}
    </svg>
  )
}
