import type { ReactNode } from 'react'
import { Popover } from 'radix-ui'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

/*
 * PC(마우스) 웹의 경매 일정 선택 팝오버. 휴대폰은 기기 기본 선택 창을 씁니다(schedule-field.tsx).
 * 날짜는 shadcn/ui Calendar(react-day-picker), 시간은 오전/오후 · 시 · 분(10분 단위) 목록(사용자 결정, 2026-11-05).
 * 값은 <input type="date|time">과 같은 'YYYY-MM-DD' · 'HH:mm' 문자열로 주고받습니다.
 */

const pad2 = (n: number) => String(n).padStart(2, '0')

/** 흰 바탕 · gray2 테두리 · radius-md 상자(평면, 그림자 없음). 칸 아래 8에 붙습니다. */
const PANEL =
  'bg-white0 border-gray2 p-space-12 z-30 rounded-md border focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out motion-reduce:animate-none'

export interface SchedulePopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 'YYYY-MM-DD' 또는 'HH:mm' */
  value: string
  onSelect: (value: string) => void
  /** 팝오버를 붙일 자리(날짜 · 시간 칸) */
  children: ReactNode
}

const toDate = (v: string) => {
  const [y, m, d] = v.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const toValue = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

/** 날짜: 고르면 바로 반영하고 닫습니다. 오늘 이전은 고를 수 없습니다. */
export function DatePopover({
  open,
  onOpenChange,
  value,
  onSelect,
  children,
}: SchedulePopoverProps) {
  const selected = toDate(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor asChild>{children}</Popover.Anchor>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className={PANEL}>
          <Calendar
            mode="single"
            required
            selected={selected}
            defaultMonth={selected}
            disabled={{ before: today }}
            startMonth={today}
            onSelect={(d) => {
              if (!d) return
              onSelect(toValue(d))
              onOpenChange(false)
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = [0, 10, 20, 30, 40, 50]

/** 시간: 오전/오후 · 시 · 분 세 열. 누를 때마다 바로 반영하고, 바깥을 누르거나 Esc로 닫습니다. */
export function TimePopover({
  open,
  onOpenChange,
  value,
  onSelect,
  children,
}: SchedulePopoverProps) {
  const [h, min] = value.split(':').map(Number)
  const pm = h >= 12
  const hour12 = h % 12 || 12
  /* 10분 단위가 아닌 값(휴대폰에서 고른 값 등)은 아래 10분 칸에 표시합니다. */
  const minute = Math.floor(min / 10) * 10
  const set = (next: { pm?: boolean; hour12?: number; minute?: number }) => {
    const p = next.pm ?? pm
    const hh = ((next.hour12 ?? hour12) % 12) + (p ? 12 : 0)
    onSelect(`${pad2(hh)}:${pad2(next.minute ?? minute)}`)
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor asChild>{children}</Popover.Anchor>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className={cn(PANEL, 'gap-space-4 flex')}>
          <Column label="오전 · 오후">
            {[false, true].map((p) => (
              <Option key={String(p)} selected={p === pm} onClick={() => set({ pm: p })}>
                {p ? '오후' : '오전'}
              </Option>
            ))}
          </Column>
          <Column label="시">
            {HOURS.map((v) => (
              <Option key={v} selected={v === hour12} onClick={() => set({ hour12: v })}>
                {v}
              </Option>
            ))}
          </Column>
          <Column label="분">
            {MINUTES.map((v) => (
              <Option key={v} selected={v === minute} onClick={() => set({ minute: v })}>
                {pad2(v)}
              </Option>
            ))}
          </Column>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** 세로로 스크롤되는 한 열(최대 6칸 높이) */
function Column({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex max-h-60 w-16 flex-col overflow-y-auto">
      {children}
    </div>
  )
}

function Option({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      /* 열 때 고른 칸이 보이도록 */
      ref={selected ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined}
      className={cn(
        'text-body04 focus-visible:outline-primary1 flex h-10 shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:-outline-offset-2',
        selected ? 'bg-black0 text-white0' : 'text-black0 hover:bg-gray0',
      )}
    >
      {children}
    </button>
  )
}
