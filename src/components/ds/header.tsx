import type { InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { Chip } from './chip'
import { Icon } from './icon'

const BAR = 'bg-white0 border-gray2 flex h-15 w-full items-center border-b'
const FOCUS =
  'focus-visible:outline-primary1 focus-visible:outline-2 focus-visible:outline-offset-2'
/* 24px 아이콘 버튼. 겉 배치는 아이콘 크기 그대로 두고 음수 여백으로 터치 영역(40×44)만 넓힙니다. */
const ICON_BUTTON = cn(FOCUS, '-mx-2 -my-2.5 flex h-11 w-10 shrink-0 items-center justify-center')

export interface HeaderProps {
  title: ReactNode
  /** 기본 true */
  showBack?: boolean
  /** 없으면 React Router로 이전 화면(navigate(-1)). 돌아갈 기록이 없으면 홈으로 갑니다. */
  onBack?: () => void
  /** 'favorite' 검은 선 하트(상품 상세), 'live' LIVE 칩(실시간 경매), 또는 직접 넣는 요소 */
  trailing?: 'favorite' | 'live' | ReactNode
  favorited?: boolean
  onFavorite?: () => void
  className?: string
}

/** 60px 화면 헤더: 뒤로 가기(36) + 제목(head02), 오른쪽에 액션 하나 */
export function Header({
  title,
  showBack = true,
  onBack,
  trailing,
  favorited = false,
  onFavorite,
  className,
}: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = () => {
    if (onBack) return onBack()
    /* 주소를 직접 열고 들어온 첫 화면(key 'default')이면 돌아갈 곳이 없으므로 홈으로 */
    if (location.key === 'default') navigate('/', { replace: true })
    else navigate(-1)
  }

  let right: ReactNode = trailing
  if (trailing === 'favorite') {
    right = (
      <button
        type="button"
        aria-label="관심 상품"
        aria-pressed={favorited}
        onClick={onFavorite}
        className={ICON_BUTTON}
      >
        <Icon
          name="Favorite"
          style={favorited ? 'fill' : 'line'}
          /* 눌린 하트도 검정(DS 원본은 error1 채움) */
          color="black0"
        />
      </button>
    )
  } else if (trailing === 'live') {
    right = <Chip kind="live">LIVE</Chip>
  }

  return (
    <header
      className={cn(
        BAR,
        'py-space-12 gap-space-8 justify-between',
        /* 뒤로 가기 버튼은 자체 여백이 있어 왼쪽 8, 없으면 제목이 화면 좌우 여백(20)에 맞춥니다. */
        showBack ? 'pl-space-8' : 'pl-layout-gutter',
        /* 오른쪽은 Figma 그대로: LIVE 칩만 20, 하트·없음·직접 넣는 요소는 18(4의 배수 밖 값이라 숫자 간격) */
        trailing === 'live' ? 'pr-layout-gutter' : 'pr-4.5',
        className,
      )}
    >
      <div className="gap-space-4 flex min-w-0 items-center">
        {showBack && (
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={goBack}
            /* 36px 아이콘 + 터치 영역 44px */
            className={cn(FOCUS, '-m-1 flex size-11 shrink-0 items-center justify-center')}
          >
            <Icon name="ArrowLeft" size={36} />
          </button>
        )}
        <h1 className="text-head02 text-black0 truncate">{title}</h1>
      </div>
      {right}
    </header>
  )
}

export interface HomeHeaderProps {
  onSearch?: () => void
  onNotifications?: () => void
  onBag?: () => void
  className?: string
}

/** 홈 탭 헤더: 로고(108×28) + 검색 · 알림 · 장바구니(16 간격) */
export function HomeHeader({ onSearch, onNotifications, onBag, className }: HomeHeaderProps) {
  return (
    <header className={cn(BAR, 'px-layout-gutter py-space-12 justify-between', className)}>
      <Icon name="autique-logo" label="Autique" className="*:h-7 *:w-27" />
      <div className="gap-space-16 flex items-center">
        <button type="button" aria-label="검색" onClick={onSearch} className={ICON_BUTTON}>
          <Icon name="Search" />
        </button>
        <button type="button" aria-label="알림" onClick={onNotifications} className={ICON_BUTTON}>
          <Icon name="Bell" />
        </button>
        <button type="button" aria-label="장바구니" onClick={onBag} className={ICON_BUTTON}>
          <Icon name="Bag" />
        </button>
      </div>
    </header>
  )
}

export type SearchHeaderProps = InputHTMLAttributes<HTMLInputElement>

/**
 * 상품 찾기 탭 헤더: 화면 폭을 채우는 검색창. 네이티브 input 속성을 그대로 넘기고 ref는 input으로 갑니다.
 * 포커스 시 테두리 primary1은 TextField와 맞춘 값입니다(DS 원본에는 없음).
 */
export const SearchHeader = forwardRef<HTMLInputElement, SearchHeaderProps>(function SearchHeader(
  { className, placeholder = '찾으시는 상품을 입력해주세요', ...props },
  ref,
) {
  return (
    <div className={cn('bg-white0 px-layout-gutter flex h-15 w-full items-center', className)}>
      <label className="border-gray2 gap-space-8 px-space-12 focus-within:border-primary1 flex h-12.5 w-full items-center rounded-sm border">
        <input
          ref={ref}
          /* type="search"는 브라우저 기본 지우기(×) 버튼이 생겨 text + 검색 키보드로 둡니다. */
          type="text"
          role="searchbox"
          inputMode="search"
          enterKeyHint="search"
          placeholder={placeholder}
          className="text-body02 text-black0 placeholder:text-gray5 min-w-0 flex-1 bg-transparent focus:outline-none"
          {...props}
        />
        <Icon name="Search" color="gray5" />
      </label>
    </div>
  )
})
