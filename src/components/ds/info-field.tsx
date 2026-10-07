import type { ReactNode } from 'react'
import { usePressed } from '@/hooks/use-pressed'
import { cn } from '@/lib/utils'

export interface InfoFieldProps {
  label: ReactNode
  value: ReactNode
  /** 넘기면 항목 전체가 버튼이 됩니다(확인 화면에서 눌러 고치기). 터치 영역은 항목 간격(16)의 절반까지 넓힙니다. (DS 확장) */
  onClick?: () => void
  className?: string
}

/** 확인 화면의 세로형 항목: 라벨(body03) 아래 4 간격으로 값(body02). 긴 값은 줄바꿈됩니다. */
export function InfoField({ label, value, onClick, className }: InfoFieldProps) {
  const { pressed, handlers } = usePressed()
  const box = 'gap-stack-tight text-black0 flex w-full flex-col'
  const content = (
    <>
      <span className="text-body03">{label}</span>
      <span className="text-body02 break-words whitespace-pre-line">{value}</span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-pressed={pressed ? '' : undefined}
        {...handlers}
        className={cn(
          box,
          'focus-visible:outline-primary1 relative rounded-sm text-left before:absolute before:inset-x-0 before:-inset-y-2 focus-visible:outline-2 focus-visible:outline-offset-2 data-pressed:opacity-60',
          className,
        )}
      >
        {content}
      </button>
    )
  }
  return <div className={cn(box, className)}>{content}</div>
}
