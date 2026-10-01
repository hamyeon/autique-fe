import { cn } from '@/lib/utils'

export interface ProgressBarProps {
  /** 0~1 (현재가 ÷ 상한가 등). 범위를 벗어나면 잘라냅니다. */
  value: number
  /** 스크린리더용 이름 */
  label?: string
  className?: string
}

/** 6px 진행 막대. gray1 트랙 위 primary1 채움, 폭은 부모를 채웁니다. */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const v = Math.max(0, Math.min(1, Number(value) || 0))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(v * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('bg-gray1 h-1.5 w-full overflow-hidden rounded-full', className)}
    >
      {/* 채움 폭은 값에 따라 달라 인라인 스타일로 넘깁니다. */}
      <div className="bg-primary1 h-full" style={{ width: `${v * 100}%` }} />
    </div>
  )
}
