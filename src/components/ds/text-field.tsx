import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'
import { FieldShell, INPUT_BOX, inputStateClass } from './field'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  /** 에러 메시지. 있으면 테두리가 error1이 되고 입력창 아래에 보입니다. (DS 확장) */
  error?: ReactNode
}

/** 라벨(head03) + 50px 한 줄 입력. ref는 input으로 전달되어 RHF register와 바로 연결됩니다. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`

  return (
    <FieldShell id={inputId} label={label} error={error} errorId={errorId} className={className}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(INPUT_BOX, 'h-12.5', inputStateClass(!!error))}
        {...props}
      />
    </FieldShell>
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  /** 에러 메시지 (DS 확장) */
  error?: ReactNode
}

/** TextField와 같은 스타일의 102px(약 3줄) 여러 줄 입력. ref는 textarea로 전달됩니다. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`

  return (
    <FieldShell id={inputId} label={label} error={error} errorId={errorId} className={className}>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(INPUT_BOX, 'h-25.5 resize-none', inputStateClass(!!error))}
        {...props}
      />
    </FieldShell>
  )
})
