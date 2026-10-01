import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

const TABS = [
  { key: 'home', label: '홈', icon: 'Home', to: '/' },
  { key: 'product', label: '상품 찾기', icon: 'Product', to: '/products' },
  { key: 'mypage', label: '마이페이지', icon: 'User', to: '/mypage' },
] as const

export type TabKey = (typeof TABS)[number]['key']

export interface TabBarProps {
  /** 없으면 현재 경로로 정합니다(/ · /products · /mypage, 하위 경로 포함). */
  active?: TabKey
  /** 탭을 누를 때 (이동은 링크가 합니다) */
  onChange?: (tab: TabKey) => void
  className?: string
}

/**
 * 하단 3탭 내비게이션. 각 탭은 React Router 링크(활성 탭에 aria-current="page")입니다.
 * 위 12 · 아래 8 패딩이고, 그 아래 홈 인디케이터(safe-area)는 Screen의 bottom 슬롯이 pb-safe로 더합니다.
 * Screen 밖에서 쓰면 className="pb-safe"를 넘겨 직접 더해 주세요.
 */
export function TabBar({ active, onChange, className }: TabBarProps) {
  return (
    <nav
      aria-label="하단 메뉴"
      className={cn('bg-white0 border-gray2 flex w-full border-t', className)}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.to}
          end={tab.to === '/'}
          onClick={() => onChange?.(tab.key)}
          /* 패딩을 링크에 둬 탭 칸 전체(약 62px)가 터치 영역이 됩니다. */
          className="focus-visible:outline-primary1 gap-space-4 pt-space-12 pb-space-8 flex min-w-0 flex-1 flex-col items-center focus-visible:outline-2 focus-visible:-outline-offset-2"
        >
          {({ isActive }) => {
            const on = active ? active === tab.key : isActive
            return (
              <>
                <Icon name={tab.icon} state={on ? 'active' : 'default'} />
                <span className={cn('text-label01', on ? 'text-black0' : 'text-gray5')}>
                  {tab.label}
                </span>
              </>
            )
          }}
        </NavLink>
      ))}
    </nav>
  )
}
