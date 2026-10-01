import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* design-system/README.md "화면 여백 규칙"의 헤더 아래 첫 콘텐츠 여백 */
const TOP_CLASS = {
  top: 'pt-layout-top', // 16: 일반 화면
  step: 'pt-layout-step', // 32: 경매 등록 단계 화면
  none: 'pt-0', // 상단 이미지가 헤더에 바로 붙는 화면 등
} as const

export interface ScreenProps {
  /** Header·HomeHeader·SearchHeader. 위에 sticky로 붙습니다. */
  header?: ReactNode
  /** BottomButtonBar 또는 TabBar. 아래에 sticky로 붙습니다. */
  bottom?: ReactNode
  children: ReactNode
  /** 헤더 아래 첫 콘텐츠 여백. 기본 top(16) */
  top?: keyof typeof TOP_CLASS
  /** 본문 영역에 더할 클래스(예: 가운데 정렬 화면의 justify-center) */
  className?: string
}

/**
 * 모든 페이지의 골격: header / 본문 / bottom 세로 배치.
 * - 본문: 좌우 layout-gutter, 위 layout-top(조절 가능), 아래 layout-section.
 *   화면 폭을 채우는 이미지는 -mx-layout-gutter로 꺼냅니다.
 * - bottom은 fixed가 아니라 sticky라 흐름 안에 자리를 차지합니다. 그래서 본문 아래 여백은
 *   layout-section(24)만으로 마지막 콘텐츠가 가려지지 않고, 짧은 화면에선 mt-auto로 맨 아래에 붙습니다.
 * - safe-area: 위는 헤더 자리(pt-safe), 아래는 bottom 자리(pb-safe)가 맡습니다.
 * - sticky가 동작하려면 조상 요소에 overflow-hidden/auto가 없어야 합니다.
 */
export function Screen({ header, bottom, children, top = 'top', className }: ScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* 헤더가 없어도 노치 영역을 덮도록 자리는 남깁니다. */}
      <div className="bg-white0 pt-safe sticky top-0 z-10">{header}</div>

      <div
        className={cn(
          'px-layout-gutter pb-layout-section flex flex-1 flex-col',
          TOP_CLASS[top],
          className,
        )}
      >
        {children}
      </div>

      {bottom ? (
        <div className="bg-white0 pb-safe sticky bottom-0 z-10 mt-auto">{bottom}</div>
      ) : (
        <div className="pb-safe" />
      )}
    </div>
  )
}
