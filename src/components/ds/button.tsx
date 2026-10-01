import type { ButtonHTMLAttributes, PointerEvent } from 'react'
import { usePressed } from '@/hooks/use-pressed'
import { cn } from '@/lib/utils'

/* 눌림은 :active 대신 data-pressed로 그립니다(usePressed 참고).
   DS 원본의 neutral(gray5 채움)은 쓰는 화면이 없어 의도적으로 뺐습니다. */
const VARIANT_CLASS = {
  primary: 'bg-black0 text-white0 data-pressed:bg-gray7 disabled:bg-gray5',
  outline: 'border-gray3 bg-white0 text-black0',
  danger: 'border-error2 bg-white0 text-error1',
} as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary 핵심 행동, outline 보조, danger 되돌리기 어려운 행동.
   *  'secondary'는 'outline'의 예전 이름입니다. */
  variant?: keyof typeof VARIANT_CLASS | 'secondary'
  /** 기본 true(부모 폭을 채움). 인라인으로 쓰려면 false */
  block?: boolean
}

/** 54px 높이 버튼. 대부분 BottomButtonBar 안에서 씁니다. */
export function Button({
  variant = 'primary',
  block = true,
  type = 'button',
  disabled,
  className,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  ...props
}: ButtonProps) {
  const v = variant === 'secondary' ? 'outline' : variant
  const { pressed, handlers } = usePressed()

  /* 소비 측 pointer 핸들러도 그대로 호출합니다. 비활성이면 누르기만 막고, 떼기는 항상 처리합니다. */
  const chain =
    (own: () => void, theirs?: (e: PointerEvent<HTMLButtonElement>) => void) =>
    (e: PointerEvent<HTMLButtonElement>) => {
      own()
      theirs?.(e)
    }

  return (
    <button
      type={type}
      disabled={disabled}
      data-pressed={pressed && !disabled ? '' : undefined}
      onPointerDown={chain(() => !disabled && handlers.onPointerDown(), onPointerDown)}
      onPointerUp={chain(handlers.onPointerUp, onPointerUp)}
      onPointerLeave={chain(handlers.onPointerLeave, onPointerLeave)}
      onPointerCancel={chain(handlers.onPointerCancel, onPointerCancel)}
      className={cn(
        'text-head03 px-space-16 py-space-12 focus-visible:outline-primary1 inline-flex min-h-13.5 items-center justify-center rounded-md border border-transparent whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2',
        VARIANT_CLASS[v],
        block && 'w-full',
        className,
      )}
      {...props}
    />
  )
}
