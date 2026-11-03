import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* Figma SellerProfile 971:3808. 두 크기 모두 사진과 글 사이 12, 이름·보조 정보 한 줄 말줄임 */
const SIZE_CLASS = {
  md: { avatar: 'size-12', name: 'text-body04 text-gray7', meta: 'text-caption01 text-gray5' },
  lg: { avatar: 'size-15', name: 'text-head03 text-black0', meta: 'text-caption01 text-gray4' },
} as const

export interface SellerProfileProps {
  name: ReactNode
  /** 예: '누적 판매 건수 4회', 마이페이지는 이메일 */
  meta?: ReactNode
  /** 없으면 gray1 원 */
  avatar?: string
  /** md 48px(상품 상세 판매자, 기본), lg 60px(마이페이지 프로필) */
  size?: keyof typeof SIZE_CLASS
  className?: string
}

/** 프로필 한 줄: 원형 사진 + 이름 · 보조 정보. 부모 폭이 좁으면 글이 말줄임됩니다. */
export function SellerProfile({ name, meta, avatar, size = 'md', className }: SellerProfileProps) {
  const s = SIZE_CLASS[size]

  return (
    <div className={cn('gap-space-12 flex min-w-0 items-center', className)}>
      {avatar ? (
        <img src={avatar} alt="" className={cn('shrink-0 rounded-full object-cover', s.avatar)} />
      ) : (
        <div aria-hidden className={cn('bg-gray1 shrink-0 rounded-full', s.avatar)} />
      )}
      <div className="flex min-w-0 flex-col">
        <p className={cn('truncate', s.name)}>{name}</p>
        {meta && <p className={cn('truncate', s.meta)}>{meta}</p>}
      </div>
    </div>
  )
}
