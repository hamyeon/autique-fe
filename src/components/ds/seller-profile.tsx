import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SellerProfileProps {
  name: ReactNode
  /** 예: '누적 판매 건수 4회' */
  meta?: ReactNode
  /** 없으면 gray1 원 */
  avatar?: string
  className?: string
}

/** 판매자 한 줄: 48px 원형 사진 + 닉네임(body04 gray7)·보조 정보(label01 gray4), 사이 12 */
export function SellerProfile({ name, meta, avatar, className }: SellerProfileProps) {
  return (
    <div className={cn('gap-space-12 flex items-center', className)}>
      {avatar ? (
        <img src={avatar} alt="" className="size-12 shrink-0 rounded-full object-cover" />
      ) : (
        <div aria-hidden className="bg-gray1 size-12 shrink-0 rounded-full" />
      )}
      <div className="flex min-w-0 flex-col">
        <p className="text-body04 text-gray7 truncate">{name}</p>
        {meta && <p className="text-label01 text-gray4">{meta}</p>}
      </div>
    </div>
  )
}
