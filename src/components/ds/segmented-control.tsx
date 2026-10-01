import type { ReactNode } from 'react'
import { forwardRef, useId } from 'react'
import { ToggleGroup } from 'radix-ui'
import { useControllableState } from '@/hooks/use-controllable-state'
import { usePressed } from '@/hooks/use-pressed'
import { cn } from '@/lib/utils'
import { FieldShell } from './field'

export interface SegmentedControlProps {
  label?: string
  /** 2~4개 */
  options: string[]
  /** 제어형 */
  value?: string
  /** 비제어형 초기값 */
  defaultValue?: string
  disabledOptions?: string[]
  onChange?: (value: string) => void
  /** 에러 메시지 (DS 확장) */
  error?: ReactNode
  /** RHF Controller의 field.onBlur 등 (DS 확장) */
  onBlur?: () => void
  className?: string
}

/**
 * 2~4개 중 하나를 고르는 가로 버튼 묶음. Radix ToggleGroup(single)이 radio 역할·화살표 키 이동을 맡습니다.
 * ref는 묶음 루트로 전달되며, focus()하면 Radix가 선택된 칸(없으면 첫 칸)으로 포커스를 옮깁니다.
 */
export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(
  function SegmentedControl(
    { label, options, value, defaultValue, disabledOptions, onChange, error, onBlur, className },
    ref,
  ) {
    const [current, setCurrent] = useControllableState(value, defaultValue ?? '', onChange)
    const id = useId()
    const labelId = `${id}-label`
    const errorId = `${id}-error`

    return (
      <FieldShell
        labelId={labelId}
        label={label}
        error={error}
        errorId={errorId}
        className={className}
      >
        <ToggleGroup.Root
          ref={ref}
          type="single"
          value={current}
          /* 같은 칸을 다시 누르면 Radix는 ''(선택 해제)를 보냅니다. 세그먼트는 해제가 없으므로 무시합니다. */
          onValueChange={(next) => next && setCurrent(next)}
          onBlur={onBlur}
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className="gap-space-8 flex w-full"
        >
          {options.map((option) => (
            <SegmentItem
              key={option}
              value={option}
              selected={option === current}
              disabled={disabledOptions?.includes(option)}
              invalid={!!error}
            />
          ))}
        </ToggleGroup.Root>
      </FieldShell>
    )
  },
)

function SegmentItem({
  value,
  selected,
  disabled,
  invalid,
}: {
  value: string
  selected: boolean
  disabled?: boolean
  invalid: boolean
}) {
  const { pressed, handlers } = usePressed()

  return (
    <ToggleGroup.Item
      value={value}
      disabled={disabled}
      data-pressed={pressed && !disabled && !selected ? '' : undefined}
      {...handlers}
      className={cn(
        /* 40px 칸(Figma) + 위아래 2px 보이지 않는 터치 영역으로 44px */
        'text-body05 border-gray2 bg-white0 text-black0 focus-visible:outline-primary1 data-pressed:bg-gray2 relative h-10 min-w-0 flex-1 truncate rounded-sm border p-2.5 before:absolute before:inset-x-0 before:-inset-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2',
        invalid && !selected && 'border-error1',
        /* 선택 색은 Figma(gray6)와 달리 black0으로 정했습니다. */
        selected && 'border-black0 bg-black0 text-white0',
        disabled && 'bg-gray2 text-gray5',
      )}
    >
      {value}
    </ToggleGroup.Item>
  )
}
