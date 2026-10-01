import { cn } from '@/lib/utils'

export interface PageIndicatorProps {
  count?: number
  /** 0부터 */
  current?: number
  className?: string
}

/** 이미지 캐러셀 위치 표시. 8px 점, 현재 위치는 32×8 알약(색은 모두 gray3). */
export function PageIndicator({ count = 4, current = 0, className }: PageIndicatorProps) {
  return (
    <div
      role="img"
      aria-label={`${current + 1} / ${count}`}
      className={cn('gap-space-8 inline-flex items-center', className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn('bg-gray3 h-2 rounded-full transition-all', i === current ? 'w-8' : 'w-2')}
        />
      ))}
    </div>
  )
}
