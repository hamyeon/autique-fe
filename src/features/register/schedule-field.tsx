import type { Ref } from 'react'
import { useRef, useState } from 'react'
import { TimeInput } from '@/components/ds'
import {
  toDateInputValue,
  toTimeInputValue,
  withDate,
  withTime,
} from '@/features/register/schedule'
import { formatDotDate, formatMeridiemClock } from '@/lib/format'
import { DatePopover, TimePopover } from '@/features/register/schedule-popovers'
import { openNativePicker, prefersNativePicker } from '@/lib/picker'

export interface ScheduleFieldProps {
  label: string
  /** 오프셋 포함 ISO-8601 */
  value: string
  onChange: (iso: string) => void
  error?: string
  ref?: Ref<HTMLButtonElement>
}

/**
 * 손가락으로 쓰는 기기(휴대폰)에서는 투명한 기기 입력이 칸을 덮어 직접 눌립니다. iOS Safari는 숨긴 입력을
 * 코드(showPicker · focus)로 열어 주지 않아서, 사용자가 입력 자체를 눌러야 휠 선택 창이 열립니다(안드로이드는 기본 달력 · 시계).
 * 마우스로 쓰는 기기(PC 웹)에서는 입력이 눌리지 않고(pointer-events-none) 아래 칸 버튼이 받아
 * 칸 아래에 날짜(shadcn Calendar) · 시간 팝오버(schedule-popovers.tsx)를 엽니다. 팝오버는 칸을 덮은 입력에 붙습니다.
 * 글자 크기는 전역 규칙(입력 ≥16px)이라 iOS가 확대하지 않습니다. 완전 투명(0)이나 appearance: none이면 iOS가
 * 누름을 무시하는 경우가 있어, 기본 모양 그대로 1% 불투명도로 둡니다(눈에는 보이지 않음).
 */
const NATIVE_INPUT =
  'pointer-coarse:pointer-events-auto pointer-events-none absolute inset-0 size-full cursor-pointer opacity-1'

/**
 * 경매 일정 한 칸(등록 5/6 · 재경매). TimeInput + 기기 날짜 · 시간 입력.
 * 휴대폰은 기기 기본 선택 창, PC 웹은 팝오버를 열고, 고른 값으로 ISO를 바꿉니다.
 */
export function ScheduleField({ label, value, onChange, error, ref }: ScheduleFieldProps) {
  const dateRef = useRef<HTMLInputElement>(null)
  const timeRef = useRef<HTMLInputElement>(null)
  const [sheet, setSheet] = useState<'date' | 'time' | null>(null)
  const date = new Date(value)
  /** '시작 시간' → '시작'. 선택 창 제목 · 입력 이름에 '시작 날짜' · '시작 시간'으로 씁니다. */
  const name = label.replace(/ 시간$/, '')
  const open = (kind: 'date' | 'time') => {
    // 손가락 기기인데 투명 입력이 아니라 버튼이 눌린 경우(키보드 등)에도 기기 선택 창을 시도합니다.
    if (prefersNativePicker()) openNativePicker(kind === 'date' ? dateRef.current : timeRef.current)
    else setSheet(kind)
  }

  return (
    <TimeInput
      ref={ref}
      label={label}
      date={formatDotDate(date)}
      time={formatMeridiemClock(date)}
      onDateClick={() => open('date')}
      onTimeClick={() => open('time')}
      error={error}
      dateOverlay={
        <DatePopover
          open={sheet === 'date'}
          onOpenChange={(o) => setSheet(o ? 'date' : null)}
          value={toDateInputValue(date)}
          onSelect={(v) => onChange(withDate(value, v))}
        >
          <input
            ref={dateRef}
            type="date"
            aria-label={`${name} 날짜`}
            className={NATIVE_INPUT}
            min={toDateInputValue(new Date())}
            value={toDateInputValue(date)}
            onChange={(e) => e.target.value && onChange(withDate(value, e.target.value))}
          />
        </DatePopover>
      }
      timeOverlay={
        <TimePopover
          open={sheet === 'time'}
          onOpenChange={(o) => setSheet(o ? 'time' : null)}
          value={toTimeInputValue(date)}
          onSelect={(v) => onChange(withTime(value, v))}
        >
          <input
            ref={timeRef}
            type="time"
            aria-label={`${name} 시간`}
            className={NATIVE_INPUT}
            value={toTimeInputValue(date)}
            onChange={(e) => e.target.value && onChange(withTime(value, e.target.value))}
          />
        </TimePopover>
      }
    />
  )
}
