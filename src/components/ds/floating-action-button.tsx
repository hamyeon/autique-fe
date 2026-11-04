import type { ReactNode } from 'react'
import { useEffect, useId, useState } from 'react'
import { usePressed } from '@/hooks/use-pressed'
import { cn } from '@/lib/utils'
import { AIChip } from './chip'
import { Icon } from './icon'

export interface FloatingAction {
  label: ReactNode
  onClick: () => void
}

export interface FloatingActionButtonProps {
  /** 펼쳤을 때 버튼 위에 쌓이는 메뉴(위에서부터 순서대로) */
  actions: FloatingAction[]
  /** 위치 클래스. 예: 'absolute bottom-full right-layout-gutter mb-space-20' (TabBar 위 오른쪽) */
  className?: string
}

/**
 * 떠 있는 48px 원형 버튼(Figma FloatingActionButton 1112:3129). 바탕 grad/primary + 흰 Add 20.
 * 누르면 Add가 45° 돌아 ×가 되고, 위로 8 띄워 메뉴(흰 칸, 패딩 12·8, radius-md, AIChip md + 8 + body03 black0, 칸 사이 4)가 나옵니다.
 * 펼친 동안 화면 전체에 딤(overlay/dim: black0 90%)을 깔고, 딤 · × · Esc · 메뉴 선택으로 닫힙니다.
 * 딤은 position: fixed라 Screen bottom 슬롯(sticky z-10) 안에 두면 헤더 · 탭바까지 덮습니다.
 */
export function FloatingActionButton({ actions, className }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const { pressed, handlers } = usePressed()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="bg-black0/90 animate-in fade-in fixed inset-0 z-20 duration-200 motion-reduce:animate-none"
        />
      )}
      <div className={cn('gap-space-8 z-30 flex flex-col items-end', className)}>
        {open && (
          <ul
            id={menuId}
            className="gap-space-4 animate-in fade-in slide-in-from-bottom-2 flex flex-col duration-200 motion-reduce:animate-none"
          >
            {actions.map((action, i) => (
              <li key={i} className="flex">
                <MenuItem
                  onClick={() => {
                    setOpen(false)
                    action.onClick()
                  }}
                >
                  {action.label}
                </MenuItem>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((o) => !o)}
          data-pressed={pressed ? '' : undefined}
          {...handlers}
          className="bg-grad-primary focus-visible:outline-primary1 flex size-12 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 data-pressed:opacity-80"
        >
          <Icon
            name="Add"
            size={20}
            color="white0"
            className={cn(
              'transition-transform duration-200 motion-reduce:transition-none',
              open && 'rotate-45',
            )}
          />
        </button>
      </div>
    </>
  )
}

/** 메뉴 한 칸: AIChip md → 8 → body03. 눈에 보이는 높이는 38이라 위아래 2씩(칸 사이 4의 절반) 터치 영역을 넓힙니다. */
function MenuItem({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const { pressed, handlers } = usePressed()
  return (
    <button
      type="button"
      onClick={onClick}
      data-pressed={pressed ? '' : undefined}
      {...handlers}
      className="bg-white0 text-body03 text-black0 px-space-12 py-space-8 gap-space-8 focus-visible:outline-primary1 data-pressed:bg-gray0 relative flex w-full items-center rounded-md text-left whitespace-nowrap before:absolute before:inset-x-0 before:-inset-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <AIChip />
      {children}
    </button>
  )
}
