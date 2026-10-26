import type { ReactNode } from 'react'
import { useId } from 'react'
import { Link } from 'react-router'
import { usePressed } from '@/hooks/use-pressed'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

export interface MyPageListButtonProps {
  children: ReactNode
  /** 누르면 이동할 경로. 없으면 버튼으로 그려 onClick만 부릅니다. */
  href?: string
  onClick?: () => void
  className?: string
}

/**
 * 마이페이지 메뉴 행(Figma MyPageListButton 207:749): 높이 52, 왼쪽 20 · 오른쪽 8 · 위아래 8,
 * 문구 head03 black0(한 줄 말줄임), 오른쪽 ArrowRight 36. 눌림 gray1 바탕은 Figma에 없어 정했습니다.
 */
export function MyPageListButton({ children, href, onClick, className }: MyPageListButtonProps) {
  const { pressed, handlers } = usePressed()
  const classes = cn(
    'bg-white0 text-head03 text-black0 pl-layout-gutter pr-space-8 py-space-8 data-pressed:bg-gray1 focus-visible:outline-primary1 flex w-full items-center justify-between text-left focus-visible:outline-2 focus-visible:-outline-offset-2',
    className,
  )
  const content = (
    <>
      <span className="min-w-0 truncate">{children}</span>
      <Icon name="ArrowRight" size={36} />
    </>
  )
  const pressedAttr = pressed ? '' : undefined

  return href ? (
    <Link to={href} onClick={onClick} data-pressed={pressedAttr} {...handlers} className={classes}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      data-pressed={pressedAttr}
      {...handlers}
      className={classes}
    >
      {content}
    </button>
  )
}

export interface MyPageMenuSectionProps {
  /** 그룹 제목(body03 gray4). 예: '나의 경매' */
  title: ReactNode
  /** MyPageListButton들 */
  children: ReactNode
  className?: string
}

/**
 * 마이페이지 메뉴 그룹(Figma MyPageMenuSection 977:2446): 제목(좌우 20 · 위아래 8, 높이 38) 아래에
 * 메뉴 행을 간격 없이 쌓습니다. 그룹 사이 12는 화면이 맡고, 화면 폭을 채우므로 -mx-layout-gutter로 꺼냅니다.
 */
export function MyPageMenuSection({ title, children, className }: MyPageMenuSectionProps) {
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className={cn('flex w-full flex-col', className)}>
      <h2 id={titleId} className="text-body03 text-gray4 px-layout-gutter py-space-8">
        {title}
      </h2>
      {children}
    </section>
  )
}
