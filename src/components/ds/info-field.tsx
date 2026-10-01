import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InfoFieldProps {
  label: ReactNode
  value: ReactNode
  className?: string
}

/** 확인 화면의 세로형 항목: 라벨(body03) 아래 4 간격으로 값(body02). 긴 값은 줄바꿈됩니다. */
export function InfoField({ label, value, className }: InfoFieldProps) {
  return (
    <div className={cn('gap-stack-tight text-black0 flex w-full flex-col', className)}>
      <p className="text-body03">{label}</p>
      <p className="text-body02 break-words whitespace-pre-line">{value}</p>
    </div>
  )
}
