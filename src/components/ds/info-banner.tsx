import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

export interface InfoBannerProps {
  /** default = 규칙·안내(회색), error = 경고·결과 통보(빨강) */
  tone?: 'default' | 'error'
  /** 해요체 한두 문장 */
  children: ReactNode
  className?: string
}

/** 놓치면 안 되는 조건·결과를 알려주는 박스. 한 화면에 하나만 둡니다. */
export function InfoBanner({ tone = 'default', children, className }: InfoBannerProps) {
  return (
    <div
      role="note"
      className={cn(
        'gap-space-8 p-space-12 text-gray6 flex w-full items-start rounded-sm',
        tone === 'error' ? 'border-error2 bg-error4 border' : 'bg-gray1',
        className,
      )}
    >
      <Icon
        name="Info"
        size={18}
        color={tone === 'error' ? 'error1' : 'primary1'}
        className="mt-px"
      />
      <p className="text-caption02 min-w-0 flex-1 break-keep">{children}</p>
    </div>
  )
}
