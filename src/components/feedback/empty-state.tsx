import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  /** 한 문장. 예: '아직 열린 경매가 없어요' */
  title: ReactNode
  /** 다음에 할 수 있는 일을 알려주는 보조 문구 */
  description?: ReactNode
  /** 예: 다른 화면으로 가는 버튼 */
  action?: ReactNode
  className?: string
}

/** 목록이 비었을 때: 제목(head03) → 설명(body05 gray5) → 행동, 가운데 정렬. 아이콘은 두지 않습니다. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('gap-space-8 py-layout-step flex flex-col items-center text-center', className)}
    >
      <p className="text-head03 text-black0">{title}</p>
      {description && <p className="text-body05 text-gray5">{description}</p>}
      {action && <div className="mt-space-8">{action}</div>}
    </div>
  )
}
