import type { ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

const BOX = 'bg-white0 border-gray2 text-black0 flex w-full rounded-sm border'
const FOCUS =
  'focus-visible:outline-primary1 focus-visible:outline-2 focus-visible:outline-offset-2'

export interface LoadMoreButtonProps {
  /** "~ 자세히 보기" 형태 */
  children: ReactNode
  onClick?: () => void
  className?: string
}

/** 다른 화면으로 넘어가 자세히 보는 행 버튼. 같은 자리에서 펼치려면 LoadMoreDownButton. */
export function LoadMoreButton({ children, onClick, className }: LoadMoreButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        BOX,
        FOCUS,
        'text-body03 p-space-12 items-center justify-between text-left',
        className,
      )}
    >
      <span>{children}</span>
      <Icon name="ArrowRight" size={16} />
    </button>
  )
}

export interface LoadMoreDownButtonProps {
  title: ReactNode
  children: ReactNode
  /** 제어형: open + onToggle */
  open?: boolean
  /** 비제어형 초기값 */
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void
  className?: string
}

/** 같은 자리에서 펼쳐지는 접이식 박스. 열리면 화살표가 위로 뒤집힙니다. */
export function LoadMoreDownButton({
  title,
  children,
  open: openProp,
  defaultOpen = false,
  onToggle,
  className,
}: LoadMoreDownButtonProps) {
  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? openState

  const toggle = () => {
    if (openProp === undefined) setOpenState(!open)
    onToggle?.(!open)
  }

  /* 원본은 박스에 12px 패딩이지만, 터치 영역(44px)을 위해 패딩을 머리 버튼·본문 쪽으로 옮겼습니다. 모양은 같습니다. */
  return (
    <div className={cn(BOX, 'flex-col', className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          FOCUS,
          'text-body03 text-black0 p-space-12 flex w-full items-center justify-between rounded-sm text-left',
        )}
      >
        <span>{title}</span>
        <Icon
          name="ArrowDown"
          size={16}
          className={cn('transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="text-caption02 text-gray5 px-space-12 pb-space-12">{children}</div>}
    </div>
  )
}
