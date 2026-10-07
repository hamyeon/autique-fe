import { Icon } from '@/components/ds'
import { cn } from '@/lib/utils'

export interface LoadingIllustrationProps {
  className?: string
}

/**
 * AI 분석 · 가격 로딩 일러스트(Figma LoadingImg 693:2727). 120×120 흰 상자에
 * 측면 신발(100×48, 가운데) + 돋보기(46×46, 왼쪽 60 · 위 55)는 그대로 두고, 위쪽 primary1 막대(120×4)만
 * 위 → 아래로 훑습니다(animate-loading-scan: 0.2초 대기 · 1.2초 ease-out · 0.2초 대기 · 즉시 복귀, 1.6초 반복).
 * '동작 줄이기'를 켠 사용자에게는 막대가 위에 멈춰 있습니다.
 */
export function LoadingIllustration({ className }: LoadingIllustrationProps) {
  return (
    <div
      aria-hidden
      className={cn('bg-white0 relative size-30 shrink-0 overflow-hidden', className)}
    >
      <Icon name="img_shoe_side" className="absolute top-9 left-2.5" />
      {/* 막대가 움직이는 칸: 상자 높이 - 막대 높이(4) */}
      <span className="animate-loading-scan absolute inset-x-0 top-0 bottom-1 motion-reduce:animate-none">
        <span className="bg-primary1 block h-1 w-full rounded-sm" />
      </span>
      {/* Figma 레이어 순서: 신발 → 막대 → 돋보기(맨 위) */}
      <Icon name="img_loading_magnifier" className="absolute top-13.75 left-15" />
    </div>
  )
}
