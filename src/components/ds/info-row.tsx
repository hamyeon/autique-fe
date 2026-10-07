import type { ReactNode } from 'react'
import { usePressed } from '@/hooks/use-pressed'
import { cn } from '@/lib/utils'

/* emphasis → 값 스타일 (README 표) */
const EMPHASIS_CLASS = {
  default: 'text-body03 text-black0',
  regular: 'text-body04 text-black0',
  primary: 'text-body03 text-primary1',
  danger: 'text-body03 text-error1',
  total: 'text-head02 text-primary1',
  totalDanger: 'text-head02 text-error1',
  hero: 'text-title02 text-primary1',
} as const

export type Emphasis = keyof typeof EMPHASIS_CLASS

/** 라벨–값 한 줄 데이터. 카드의 rows에 그대로 넘깁니다. */
export interface InfoRowData {
  label: ReactNode
  value: ReactNode
  emphasis?: Emphasis
  /** emphasis의 예전 이름 */
  tone?: 'danger' | 'primary'
  /** 넘기면 행 전체가 버튼이 됩니다(확인 화면에서 눌러 고치기). 터치 영역은 행 간격까지 넓힙니다. (DS 확장) */
  onClick?: () => void
}

export interface InfoRowProps extends InfoRowData {
  className?: string
}

/** 라벨(body05 gray5)–값 한 줄. 양 끝 정렬, 사이 최소 8 */
export function InfoRow({ label, value, emphasis, tone, onClick, className }: InfoRowProps) {
  const e = emphasis ?? tone ?? 'default'
  const content = (
    <>
      <span className="text-body05 text-gray5 shrink-0">{label}</span>
      <span className={cn('min-w-0 text-right break-keep', EMPHASIS_CLASS[e])}>{value}</span>
    </>
  )
  const row = 'gap-space-8 flex w-full items-center justify-between'

  if (onClick)
    return (
      <PressableRow onClick={onClick} className={cn(row, className)}>
        {content}
      </PressableRow>
    )
  return <div className={cn(row, className)}>{content}</div>
}

/** 누를 수 있는 행: 눌린 동안 흐려지고, 위아래로 행 간격의 절반(4)씩 터치 영역을 넓힙니다. */
function PressableRow({
  onClick,
  className,
  children,
}: {
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  const { pressed, handlers } = usePressed()
  return (
    <button
      type="button"
      onClick={onClick}
      data-pressed={pressed ? '' : undefined}
      {...handlers}
      className={cn(
        'focus-visible:outline-primary1 relative rounded-sm text-left before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 data-pressed:opacity-60',
        className,
      )}
    >
      {children}
    </button>
  )
}
