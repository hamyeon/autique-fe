import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* Forms 컴포넌트가 함께 쓰는 라벨 + 입력 + 에러 묶음과 입력 박스 스타일 */

export const INPUT_BOX =
  'bg-white0 text-black0 text-body02 border-gray2 p-space-12 w-full rounded-sm border focus:outline-none disabled:bg-gray1 disabled:text-gray5 placeholder:text-gray5'

/** DS 원본에는 에러 상태가 없어 정한 값: 테두리 error1(포커스 중에도 유지) */
export function inputStateClass(invalid: boolean) {
  return invalid ? 'border-error1 focus:border-error1' : 'focus:border-primary1'
}

/**
 * id가 있으면 <label htmlFor>로 입력과 묶고, 없으면(라디오·세그먼트 같은 묶음) labelId를 단 제목으로
 * 그려 묶음 쪽에서 aria-labelledby로 가리킵니다.
 */
export function FieldShell({
  id,
  labelId,
  label,
  error,
  errorId,
  className,
  children,
}: {
  id?: string
  labelId?: string
  label?: string
  error?: ReactNode
  errorId: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('gap-form-label flex w-full flex-col', className)}>
      {label &&
        (id ? (
          <label htmlFor={id} id={labelId} className="text-head03 text-black0">
            {label}
          </label>
        ) : (
          <span id={labelId} className="text-head03 text-black0">
            {label}
          </span>
        ))}
      <div className="gap-stack-tight flex flex-col">
        {children}
        {error && (
          <p id={errorId} role="alert" className="text-caption01 text-error1">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
