import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* /design-system 페이지 전용 보조 컴포넌트. 앱 화면에서는 쓰지 않습니다. */

export function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children?: ReactNode
}) {
  return (
    <section id={id} className="gap-layout-section py-layout-section flex scroll-mt-16 flex-col">
      <h2 className="text-title02 text-black0">{title}</h2>
      {children ?? <p className="text-body05 text-gray4">아직 구현된 컴포넌트가 없습니다.</p>}
    </section>
  )
}

export function Demo({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="gap-stack-related flex flex-col">
      <div className="gap-stack-tight flex flex-col">
        <h3 className="text-head02 text-black0">{title}</h3>
        {description && <p className="text-body05 text-gray5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

/** 라벨 + 작은 캡션 */
export function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-caption02 text-gray5', className)}>{children}</p>
}

/** 인터랙티브 데모용 선택 버튼 묶음 */
export function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="gap-form-label flex flex-col">
      <span className="text-body03 text-black0">{label}</span>
      <div role="radiogroup" aria-label={label} className="gap-space-8 flex flex-wrap">
        {options.map((option) => {
          const selected = option === value
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={cn(
                'px-space-12 text-body04 h-11 rounded-sm border',
                selected ? 'border-black0 bg-black0 text-white0' : 'border-gray2 text-black0',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
