import { cn } from '@/lib/utils'

const TONE_CLASS = {
  default: 'bg-gray1',
  primary: 'bg-primary3',
  error: 'bg-error3',
} as const

const SIZE_CLASS = {
  line: 'h-px',
  section: 'h-2',
} as const

export interface DividerProps {
  /** default = 흰 카드·목록, primary = 블루 카드(primary4 바탕), error = 경고 카드(error4 바탕) */
  tone?: 'default' | 'primary' | 'error'
  /** line 1px 구분선(기본), section 8px 띠(마이페이지 프로필 아래처럼 큰 덩어리 사이). Figma Divider 674:6225 */
  size?: keyof typeof SIZE_CLASS
  className?: string
}

/** 구분선. 부모 폭을 채웁니다. 화면 폭을 채우는 section 띠는 소비 측이 -mx-layout-gutter로 꺼냅니다. */
export function Divider({ tone = 'default', size = 'line', className }: DividerProps) {
  return (
    <div
      role="separator"
      className={cn('w-full shrink-0', SIZE_CLASS[size], TONE_CLASS[tone], className)}
    />
  )
}
