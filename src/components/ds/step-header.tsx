import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

export interface StepHeaderProps {
  /** 예: '2/6' */
  step?: string
  title: ReactNode
  /** 해요체 한두 문장 */
  description?: ReactNode
  /** 넘기면 제목 옆에 정보 아이콘이 생깁니다. 용어 설명이 필요한 단계에만 */
  onInfo?: () => void
  className?: string
}

/** 단계형 플로우의 화면 머리: 단계 표시 · 제목 + 정보 아이콘 · 설명 */
export function StepHeader({ step, title, description, onInfo, className }: StepHeaderProps) {
  return (
    <div className={cn('flex w-full flex-col', className)}>
      {step && <p className="text-body06 text-gray5">{step}</p>}
      <div className="gap-stack-tight flex flex-col">
        <div className="gap-stack-tight flex items-center">
          <h2 className="text-head01 text-black0">{title}</h2>
          {onInfo && (
            /* 아이콘은 24px이지만 터치 영역은 44px. 음수 여백으로 배치는 원본과 같게 둡니다. */
            <button
              type="button"
              aria-label="도움말"
              onClick={onInfo}
              className="focus-visible:outline-primary1 -m-2.5 flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2"
            >
              <Icon name="Info" color="gray4" />
            </button>
          )}
        </div>
        {description && <p className="text-body05 text-black0">{description}</p>}
      </div>
    </div>
  )
}
