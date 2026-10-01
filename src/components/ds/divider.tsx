import { cn } from '@/lib/utils'

const TONE_CLASS = {
  default: 'bg-gray1',
  primary: 'bg-primary3',
  error: 'bg-error3',
} as const

export interface DividerProps {
  /** default = 흰 카드·목록, primary = 블루 카드(primary4 바탕), error = 경고 카드(error4 바탕) */
  tone?: 'default' | 'primary' | 'error'
  className?: string
}

/** 1px 구분선. 부모 폭을 채웁니다. */
export function Divider({ tone = 'default', className }: DividerProps) {
  return (
    <div role="separator" className={cn('h-px w-full shrink-0', TONE_CLASS[tone], className)} />
  )
}
