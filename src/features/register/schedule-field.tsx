import type { Ref } from 'react'
import { useRef } from 'react'
import { TimeInput } from '@/components/ds'
import {
  toDateInputValue,
  toTimeInputValue,
  withDate,
  withTime,
} from '@/features/register/schedule'
import { formatDotDate, formatMeridiemClock } from '@/lib/format'
import { openNativePicker } from '@/lib/picker'

export interface ScheduleFieldProps {
  label: string
  /** 오프셋 포함 ISO-8601 */
  value: string
  onChange: (iso: string) => void
  error?: string
  ref?: Ref<HTMLButtonElement>
}

/**
 * 경매 일정 한 칸(등록 5/6 · 재경매). TimeInput + 숨긴 기기 날짜 · 시간 입력.
 * 칸을 누르면 기기 기본 선택 창을 열고, 고른 값으로 ISO를 바꿉니다.
 */
export function ScheduleField({ label, value, onChange, error, ref }: ScheduleFieldProps) {
  const dateRef = useRef<HTMLInputElement>(null)
  const timeRef = useRef<HTMLInputElement>(null)
  const date = new Date(value)

  return (
    <div>
      <TimeInput
        ref={ref}
        label={label}
        date={formatDotDate(date)}
        time={formatMeridiemClock(date)}
        onDateClick={() => openNativePicker(dateRef.current)}
        onTimeClick={() => openNativePicker(timeRef.current)}
        error={error}
      />
      {/* 선택 창만 쓰는 입력이라 화면과 보조 기술에서 숨깁니다(값은 위 TimeInput이 읽어 줌). */}
      <input
        ref={dateRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        min={toDateInputValue(new Date())}
        value={toDateInputValue(date)}
        onChange={(e) => e.target.value && onChange(withDate(value, e.target.value))}
      />
      <input
        ref={timeRef}
        type="time"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        value={toTimeInputValue(date)}
        onChange={(e) => e.target.value && onChange(withTime(value, e.target.value))}
      />
    </div>
  )
}
