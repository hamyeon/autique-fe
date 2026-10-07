import { useEffect, useRef } from 'react'
import type { Control, FieldPath } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { TimeInput } from '@/components/ds'
import { scheduleStepSchema } from '@/features/register/schemas'
import {
  defaultSchedule,
  toDateInputValue,
  toTimeInputValue,
  withDate,
  withTime,
} from '@/features/register/schedule'
import { formatDotDate, formatMeridiemClock } from '@/lib/format'
import { openNativePicker } from '@/lib/picker'
import { RegisterStepScreen } from '@/pages/register/register-step-page'
import { useRegisterNav } from '@/pages/register/use-register-nav'
import { useRegisterStore } from '@/stores/register-store'

type ScheduleForm = z.input<typeof scheduleStepSchema>

/**
 * 5/6 경매 일정 설정(Figma 경매 설정 569:5385). 날짜 · 시간 칸을 누르면 기기 기본 선택 창이 열립니다.
 * 과거 시작 금지 · 1시간 이상(사용자 결정)을 어기면 해당 칸 아래에 바로 알립니다.
 */
export function RegisterScheduleStep() {
  const { goNext } = useRegisterNav('5')
  const update = useRegisterStore((s) => s.update)
  const completeStep = useRegisterStore((s) => s.completeStep)

  const {
    control,
    handleSubmit,
    subscribe,
    trigger,
    formState: { isValid },
  } = useForm<ScheduleForm, unknown, z.output<typeof scheduleStepSchema>>({
    resolver: zodResolver(scheduleStepSchema),
    mode: 'onChange',
    defaultValues: (() => {
      const { draft } = useRegisterStore.getState()
      if (draft.auctionStartAt && draft.auctionEndAt) {
        return { auctionStartAt: draft.auctionStartAt, auctionEndAt: draft.auctionEndAt }
      }
      return defaultSchedule()
    })(),
  })

  useEffect(() => {
    // 저장해 둔 일정은 그새 시작 시각이 지났을 수 있어 들어오자마자 검사해 알립니다.
    const { draft } = useRegisterStore.getState()
    if (draft.auctionStartAt) void trigger()
  }, [trigger])

  /* 바꾼 일정은 바로 저장합니다(뒤로 가기 · 새로고침에도 남게). */
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values, type }) => {
          if (type !== 'change') return
          update(values)
          // 시작을 바꾸면 종료 칸의 '1시간 이상' 메시지도 함께 다시 검사합니다.
          void trigger()
        },
      }),
    [subscribe, update, trigger],
  )

  const onNext = handleSubmit((values) => {
    if (completeStep('5', values)) goNext()
  })

  return (
    <RegisterStepScreen step="5" nextDisabled={!isValid} onNext={() => void onNext()}>
      <div className="gap-form-field flex flex-col">
        <ScheduleField control={control} name="auctionStartAt" label="시작 시간" />
        <ScheduleField control={control} name="auctionEndAt" label="종료 시간" />
      </div>
    </RegisterStepScreen>
  )
}

/** TimeInput + 숨긴 기기 날짜 · 시간 입력. 칸을 누르면 선택 창을 열고, 고른 값으로 ISO를 바꿉니다. */
function ScheduleField({
  control,
  name,
  label,
}: {
  control: Control<ScheduleForm, unknown, z.output<typeof scheduleStepSchema>>
  name: FieldPath<ScheduleForm>
  label: string
}) {
  const dateRef = useRef<HTMLInputElement>(null)
  const timeRef = useRef<HTMLInputElement>(null)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const date = new Date(field.value)
        return (
          <div>
            <TimeInput
              ref={field.ref}
              label={label}
              date={formatDotDate(date)}
              time={formatMeridiemClock(date)}
              onDateClick={() => openNativePicker(dateRef.current)}
              onTimeClick={() => openNativePicker(timeRef.current)}
              error={fieldState.error?.message}
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
              onChange={(e) =>
                e.target.value && field.onChange(withDate(field.value, e.target.value))
              }
            />
            <input
              ref={timeRef}
              type="time"
              tabIndex={-1}
              aria-hidden
              className="sr-only"
              value={toTimeInputValue(date)}
              onChange={(e) =>
                e.target.value && field.onChange(withTime(field.value, e.target.value))
              }
            />
          </div>
        )
      }}
    />
  )
}
