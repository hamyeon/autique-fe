import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

const BOX =
  'bg-promo text-white0 p-space-20 gap-space-4 flex w-full flex-col items-start justify-center text-left break-keep'
const FOCUS =
  'focus-visible:outline-primary1 focus-visible:outline-2 focus-visible:-outline-offset-2'

export interface PromoBannerProps {
  /** 윗줄 안내(body04). 예: '꼭 실시간 경매를 보고 있지 않아도,' */
  caption?: ReactNode
  /** 본문(head02). 줄을 나누려면 <br />를 넣습니다. */
  title: ReactNode
  /** 누르면 이동할 경로. 없고 onClick도 없으면 누를 수 없는 배너입니다. */
  href?: string
  onClick?: () => void
  className?: string
}

/**
 * 홈 AI 추천 배너(Figma PromoBanner 977:2424): 패딩 20, 줄 사이 4, 글자 white0.
 * 배경 방사형 그라데이션(bg-promo)은 DS "평면" 규칙의 승인된 예외입니다.
 * 화면 폭을 채우므로 Screen 안에서는 소비 측이 -mx-layout-gutter로 꺼냅니다.
 */
export function PromoBanner({ caption, title, href, onClick, className }: PromoBannerProps) {
  const content = (
    <>
      {caption && <span className="text-body04">{caption}</span>}
      <span className="text-head02">{title}</span>
    </>
  )

  if (href) {
    return (
      <Link to={href} onClick={onClick} className={cn(BOX, FOCUS, className)}>
        {content}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(BOX, FOCUS, className)}>
        {content}
      </button>
    )
  }
  return <div className={cn(BOX, className)}>{content}</div>
}
