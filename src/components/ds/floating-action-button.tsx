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
 * 떠 있는 56px 원형 버튼(Figma FloatingActionButton 1112:3129). 바탕 grad/primary + 흰 Add 32.
 * 누르면 Add가 45° 돌아 ×가 되고(사용자 결정, Figma focused는 + 그대로), 위로 24 띄워 메뉴(흰 칸, 패딩 12·8, radius-md,
 * AIChip md + 8 + head03 black0, 칸 사이 8)가 나옵니다. 버튼에는 살짝 그림자(shadow-fab, DS 예외).
 * 펼친 동안 화면 전체에 딤(black0 70%, BottomSheet의 overlay/dim 90%보다 연하게 — 사용자 결정)을 깔고, 딤 · × · Esc · 메뉴 선택으로 닫힙니다.
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
          className="bg-black0/70 animate-in fade-in fixed inset-0 z-20 duration-200 motion-reduce:animate-none"
        />
      )}
      <div className={cn('gap-space-24 z-30 flex flex-col items-end', className)}>
        {open && (
          <ul
            id={menuId}
            className="gap-space-8 animate-in fade-in slide-in-from-bottom-2 flex flex-col duration-200 motion-reduce:animate-none"
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
          className="bg-grad-primary shadow-fab focus-visible:outline-primary1 flex size-14 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 data-pressed:opacity-80"
        >
          <Icon
            name="Add"
            size={32}
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

/** 메뉴 한 칸: AIChip md → 8 → head03. 눈에 보이는 높이는 42라 위아래 2씩(칸 사이 8 안에서) 터치 영역을 넓혀 46으로. */
function MenuItem({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const { pressed, handlers } = usePressed()
  return (
    <button
      type="button"
      onClick={onClick}
      data-pressed={pressed ? '' : undefined}
      {...handlers}
      className="bg-white0 text-head03 text-black0 px-space-12 py-space-8 gap-space-8 focus-visible:outline-primary1 data-pressed:bg-gray0 relative flex w-full items-center rounded-md text-left whitespace-nowrap before:absolute before:inset-x-0 before:-inset-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <AIChip size="md" />
      {children}
    </button>
  )
}
