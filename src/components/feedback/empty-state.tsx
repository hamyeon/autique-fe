import type { ReactNode } from 'react'
import shoeSide from '@/assets/illustrations/img_shoe_side_3d.png'
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

/**
 * 목록이 비었을 때: 3D 운동화(img_shoe_side_3d, 120) → (24) → 제목(head03) · 설명(body05 gray5, 사이 0) → (16) 행동, 가운데 정렬.
 * 화면 세로 가운데에 두려면 부모가 flex-col일 때 className="flex-1 justify-center"를 넘깁니다.
 * 일러스트는 장식이라 읽지 않습니다(사용자 결정 2026-11-16, 이전에는 아이콘 없음).
 */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'gap-space-16 py-layout-step flex flex-col items-center text-center',
        className,
      )}
    >
      {/* 사진 120, 사진과 제목 사이 24(묶음 간격 16 + 8, 사용자 결정 2026-11-16) */}
      <img
        src={shoeSide}
        alt=""
        aria-hidden
        draggable={false}
        className="mb-space-8 size-30 object-contain"
      />
      {/* 제목과 설명은 사이 없이 붙여 씁니다(사용자 결정 2026-11-16). */}
      <div className="flex flex-col">
        <p className="text-head03 text-black0">{title}</p>
        {description && <p className="text-body05 text-gray5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
