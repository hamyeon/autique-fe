import { ToggleGroup } from 'radix-ui'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cn } from '@/lib/utils'

export interface SortTabsProps {
  /** 기본 ['인기순', '최신순'] */
  options?: string[]
  value?: string
  /** 기본 첫 항목 */
  defaultValue?: string
  onChange?: (value: string) => void
  /** 스크린리더용 이름. 기본 '정렬' */
  label?: string
  className?: string
}

/**
 * 목록 정렬 선택. 선택 body03 black0, 나머지 body05 gray4, 사이 8(DS 원본은 4).
 * Radix ToggleGroup(single)이 radio 역할·←→ 키 이동을 맡습니다.
 */
export function SortTabs({
  options = ['인기순', '최신순'],
  value,
  defaultValue,
  onChange,
  label = '정렬',
  className,
}: SortTabsProps) {
  const [current, setCurrent] = useControllableState(value, defaultValue ?? options[0], onChange)

  return (
    <ToggleGroup.Root
      type="single"
      value={current}
      /* 같은 항목을 다시 눌러도 선택이 풀리지 않게 합니다. */
      onValueChange={(next) => next && setCurrent(next)}
      aria-label={label}
      className={cn('gap-space-8 inline-flex', className)}
    >
      {options.map((option) => {
        const on = option === current
        return (
          <ToggleGroup.Item
            key={option}
            value={option}
            className={cn(
              /* 글자 크기만 한 항목 + 보이지 않는 터치 영역(위아래 11px, 좌우 4px) */
              'focus-visible:outline-primary1 relative rounded-sm before:absolute before:-inset-x-1 before:-inset-y-2.75 focus-visible:outline-2 focus-visible:outline-offset-2',
              on ? 'text-body03 text-black0' : 'text-body05 text-gray4',
            )}
          >
            {option}
          </ToggleGroup.Item>
        )
      })}
    </ToggleGroup.Root>
  )
}
