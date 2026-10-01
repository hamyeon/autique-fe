import type { ReactNode } from 'react'
import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'
import { FieldShell, inputStateClass } from './field'

export interface TimeInputProps {
  label?: string
  /** 표기: 2026.09.21 */
  date: string
  /** 표기: 오후 4:00 */
  time: string
  /** 넘기면 날짜 칸이 버튼이 됩니다. 피커는 소비 측이 엽니다. (DS 확장) */
  onDateClick?: () => void
  /** 넘기면 시간 칸이 버튼이 됩니다. (DS 확장) */
  onTimeClick?: () => void
  /** 에러 메시지 (DS 확장) */
  error?: ReactNode
  className?: string
}

const CELL =
  'bg-white0 text-body02 text-black0 border-gray2 p-space-12 flex h-12.5 min-w-0 flex-1 items-center justify-between rounded-sm border text-left whitespace-nowrap'

/**
 * 날짜·시간 두 칸 표시. 직접 입력하는 input이 아니므로 RHF에서는 Controller로 연결합니다.
 * ref는 날짜 칸(버튼일 때)으로 전달되어 setFocus·에러 포커스가 동작합니다.
 */
export const TimeInput = forwardRef<HTMLButtonElement, TimeInputProps>(function TimeInput(
  { label, date, time, onDateClick, onTimeClick, error, className },
  ref,
) {
  const id = useId()
  const errorId = `${id}-error`
  const state = inputStateClass(!!error)
  const a11y = {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  }

  const cell = (value: string, unit: string, onClick?: () => void, cellRef?: typeof ref) => {
    const content = (
      <>
        <span className="truncate">{value}</span>
        <span className="text-body04 text-gray5">{unit}</span>
      </>
    )
    return onClick ? (
      <button
        ref={cellRef}
        id={unit === '날짜' ? id : undefined}
        type="button"
        onClick={onClick}
        aria-label={`${label ?? ''} ${unit} ${value}`.trim()}
        className={cn(CELL, state)}
        {...a11y}
      >
        {content}
      </button>
    ) : (
      <div className={cn(CELL, error && 'border-error1')}>{content}</div>
    )
  }

  return (
    <FieldShell
      id={onDateClick ? id : undefined}
      label={label}
      error={error}
      errorId={errorId}
      className={className}
    >
      <div className="gap-space-8 flex">
        {cell(date, '날짜', onDateClick, ref)}
        {cell(time, '시간', onTimeClick)}
      </div>
    </FieldShell>
  )
})
