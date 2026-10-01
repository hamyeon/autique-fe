import { cn } from '@/lib/utils'
import { Button } from './button'

/* 예전 Figma 이름 */
const LEGACY_LAYOUT = { layout4: 'secondary', layout5: 'primaryDanger' } as const

export type BottomButtonBarLayout =
  'single' | 'double' | 'triple' | 'secondary' | 'primaryDanger' | keyof typeof LEGACY_LAYOUT

export interface BottomButtonBarProps {
  /** single primary 1개, double primary + outline 가로, triple primary / outline + danger,
   *  secondary outline 1개, primaryDanger primary / danger 세로 */
  layout?: BottomButtonBarLayout
  primaryLabel?: string
  secondaryLabel?: string
  dangerLabel?: string
  primaryDisabled?: boolean
  onPrimary?: () => void
  onSecondary?: () => void
  onDanger?: () => void
  className?: string
}

/**
 * 화면 하단 버튼 영역. 위치는 잡지 않으므로, 화면에 고정할 때는 소비 측에서
 * fixed 래퍼 + pb-safe로 감쌉니다.
 */
export function BottomButtonBar({
  layout = 'single',
  primaryLabel = '확인',
  secondaryLabel = '취소',
  dangerLabel = '삭제',
  primaryDisabled = false,
  onPrimary,
  onSecondary,
  onDanger,
  className,
}: BottomButtonBarProps) {
  const l = layout in LEGACY_LAYOUT ? LEGACY_LAYOUT[layout as keyof typeof LEGACY_LAYOUT] : layout

  /* 가로 행 안의 버튼은 같은 폭으로 나눕니다. */
  const inRow = 'min-w-0 flex-1'
  const primary = (className?: string) => (
    <Button variant="primary" disabled={primaryDisabled} onClick={onPrimary} className={className}>
      {primaryLabel}
    </Button>
  )
  const secondary = (className?: string) => (
    <Button variant="outline" onClick={onSecondary} className={className}>
      {secondaryLabel}
    </Button>
  )
  const danger = (className?: string) => (
    <Button variant="danger" onClick={onDanger} className={className}>
      {dangerLabel}
    </Button>
  )
  const row = 'gap-space-12 flex w-full'

  return (
    <div
      className={cn(
        'bg-white0 gap-space-12 px-layout-gutter py-space-12 flex w-full flex-col',
        className,
      )}
    >
      {l === 'single' && primary()}
      {l === 'double' && (
        <div className={row}>
          {primary(inRow)}
          {secondary(inRow)}
        </div>
      )}
      {l === 'triple' && (
        <>
          {primary()}
          <div className={row}>
            {secondary(inRow)}
            {danger(inRow)}
          </div>
        </>
      )}
      {l === 'secondary' && secondary()}
      {l === 'primaryDanger' && (
        <>
          {primary()}
          {danger()}
        </>
      )}
    </div>
  )
}
