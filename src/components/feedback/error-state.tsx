import type { ReactNode } from 'react'
import { Button, Icon } from '@/components/ds'
import { cn } from '@/lib/utils'

export interface ErrorStateProps {
  /** 기본 '정보를 불러오지 못했어요' */
  title?: ReactNode
  /** 기본 '잠시 후 다시 시도해 주세요.' 서버 메시지는 개발자용이라 그대로 보여주지 않습니다. */
  description?: ReactNode
  /** 있으면 '다시 시도' 버튼을 보여줍니다. */
  onRetry?: () => void
  /** 다시 불러오는 중이면 버튼을 잠급니다. */
  retrying?: boolean
  className?: string
}

/** 불러오기 실패: 아이콘(error1) → 제목(head03) → 설명(body05 gray5) → 다시 시도(outline), 가운데 정렬 */
export function ErrorState({
  title = '정보를 불러오지 못했어요',
  description = '잠시 후 다시 시도해 주세요.',
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('gap-space-8 py-layout-step flex flex-col items-center text-center', className)}
    >
      <Icon name="Info" color="error1" />
      <p className="text-head03 text-black0">{title}</p>
      {description && <p className="text-body05 text-gray5">{description}</p>}
      {onRetry && (
        <Button
          variant="outline"
          block={false}
          disabled={retrying}
          onClick={onRetry}
          className="mt-space-8"
        >
          {retrying ? '다시 불러오는 중' : '다시 시도'}
        </Button>
      )}
    </div>
  )
}
