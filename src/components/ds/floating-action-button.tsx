import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

export interface FloatingActionButtonProps {
  /** 기본 '상품 등록하기' */
  children?: ReactNode
  onClick?: () => void
  className?: string
}

/** 리스트 위에 떠 있는 48px 알약 버튼. 위치(TabBar 위 오른쪽 20px)는 소비 측이 잡습니다. */
export function FloatingActionButton({
  children = '상품 등록하기',
  onClick,
  className,
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'bg-black0 text-white0 text-body03 gap-space-4 py-space-12 pr-space-16 pl-space-12 active:bg-gray7 focus-visible:outline-primary1 inline-flex h-12 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2',
        className,
      )}
    >
      <Icon name="Add" size={20} color="white0" />
      {children}
    </button>
  )
}
