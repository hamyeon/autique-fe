import type { ComponentProps } from 'react'
import { DayPicker } from 'react-day-picker'
import { ko } from 'react-day-picker/locale'
import { Icon } from '@/components/ds'
import { cn } from '@/lib/utils'

/**
 * shadcn/ui Calendar 구조(react-day-picker)를 DS 토큰으로 입힌 달력. 한국어(ko) · 일요일 시작.
 * 동작(키보드 이동 · 접근성 · 날짜 계산)은 react-day-picker가 맡고, 모양만 여기서 정합니다.
 * 캡션 '2026년 11월'(head03) 양옆에 이전 · 다음 달 버튼, 요일 caption02 gray5, 날짜 40px 원(body04).
 * 선택 black0 채움(글자 white0, 오늘이어도), 오늘 primary1 글자, 고를 수 없는 날 gray3.
 */
export function Calendar({ className, classNames, ...props }: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={ko}
      showOutsideDays={false}
      className={cn('text-black0', className)}
      classNames={{
        months: 'relative flex flex-col',
        month: 'gap-space-8 flex flex-col',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous:
          'focus-visible:outline-primary1 hover:bg-gray0 flex size-9 items-center justify-center rounded-full focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-30',
        button_next:
          'focus-visible:outline-primary1 hover:bg-gray0 flex size-9 items-center justify-center rounded-full focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-30',
        month_caption: 'flex h-9 items-center justify-center',
        caption_label: 'text-head03 text-black0',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-caption02 text-gray5 w-10 font-normal',
        week: 'mt-space-4 flex',
        day: 'group size-10 p-0 text-center',
        day_button:
          'text-body04 text-black0 focus-visible:outline-primary1 hover:bg-gray0 group-data-[today=true]:text-primary1 group-data-[selected=true]:bg-black0 group-data-[selected=true]:text-white0! size-10 rounded-full focus-visible:outline-2 disabled:pointer-events-none disabled:text-gray3',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => (
          <Icon
            name="ArrowRight"
            size={16}
            className={cn(
              orientation === 'left' && 'rotate-180',
              orientation === 'up' && '-rotate-90',
              orientation === 'down' && 'rotate-90',
            )}
          />
        ),
      }}
      {...props}
    />
  )
}
