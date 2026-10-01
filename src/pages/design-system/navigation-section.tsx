import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import type { TabKey } from '@/components/ds'
import { Header, HomeHeader, SearchHeader, SortTabs, TabBar } from '@/components/ds'
import { Caption, Demo, Section } from './showcase'

export function NavigationSection() {
  return (
    <Section id="navigation" title="Navigation">
      <HeaderDemo />
      <HomeHeaderDemo />
      <SearchHeaderDemo />
      <TabBarDemo />
      <SortTabsDemo />
    </Section>
  )
}

/** 헤더·탭바는 화면 폭 기준이라 페이지 gutter만큼 밖으로 꺼내 그립니다. */
function FullBleed({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="gap-space-8 flex flex-col">
      <Caption>{label}</Caption>
      <div className="-mx-layout-gutter border-gray1 border-t">{children}</div>
    </div>
  )
}

function HeaderDemo() {
  const [favorited, setFavorited] = useState(false)
  const [backCount, setBackCount] = useState(0)

  return (
    <Demo
      title="Header"
      description="60px, 뒤로 가기(36) + 제목 head02, 하단 gray2 선. 기본 뒤로 가기는 navigate(-1)이고, 주소로 바로 들어와 돌아갈 기록이 없으면 홈으로 갑니다."
    >
      <FullBleed label="기본 · 뒤로 가기 = navigate(-1) (누르면 이전 화면으로 이동해요)">
        <Header title="결제" />
      </FullBleed>
      <FullBleed label={`trailing="favorite" · favorited=${favorited} (하트를 눌러 보세요)`}>
        <Header
          title="경매 상품 상세"
          trailing="favorite"
          favorited={favorited}
          onFavorite={() => setFavorited((f) => !f)}
          onBack={() => setBackCount((c) => c + 1)}
        />
      </FullBleed>
      <FullBleed label='trailing="live"'>
        <Header title="실시간 경매" trailing="live" onBack={() => setBackCount((c) => c + 1)} />
      </FullBleed>
      <FullBleed label="trailing = 직접 넣는 요소">
        <Header
          title="내 경매"
          onBack={() => setBackCount((c) => c + 1)}
          trailing={
            <button type="button" className="text-body03 text-gray6 -my-2.5 h-11">
              편집
            </button>
          }
        />
      </FullBleed>
      <FullBleed label="긴 제목 · 뒤로 가기와 하트는 그대로, 제목만 말줄임">
        <Header
          title="아주 긴 제목이 들어가면 한 줄에서 말줄임표로 잘려야 해요 정말로요"
          trailing="favorite"
          favorited={favorited}
          onFavorite={() => setFavorited((f) => !f)}
          onBack={() => setBackCount((c) => c + 1)}
        />
      </FullBleed>
      <FullBleed label="showBack={false}">
        <Header title="뒤로 가기 없는 화면" showBack={false} />
      </FullBleed>
      <Caption>위 예시(첫 번째 제외)는 onBack을 넘겨 이동 대신 횟수만 셉니다: {backCount}회</Caption>
    </Demo>
  )
}

function HomeHeaderDemo() {
  const [last, setLast] = useState<string | null>(null)

  return (
    <Demo
      title="HomeHeader"
      description="로고 108×28 + 검색 · 알림 · 장바구니(16 간격), 좌우 20."
    >
      <FullBleed label="홈 탭 헤더">
        <HomeHeader
          onSearch={() => setLast('검색')}
          onNotifications={() => setLast('알림')}
          onBag={() => setLast('장바구니')}
        />
      </FullBleed>
      <Caption>마지막으로 누른 아이콘: {last ?? '없음'}</Caption>
    </Demo>
  )
}

function SearchHeaderDemo() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(query)
  }

  return (
    <Demo
      title="SearchHeader"
      description="화면 폭 검색창(gray2 테두리, body02, 회색 돋보기). 포커스 시 테두리 primary1(TextField와 맞춤). 휴대폰 키보드에 '검색' 키가 떠요."
    >
      <form onSubmit={onSubmit}>
        <FullBleed label="value + onChange, Enter로 제출">
          <SearchHeader
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="상품 검색"
          />
        </FullBleed>
      </form>
      <Caption>
        입력 중: "{query}" · 제출한 검색어: {submitted === null ? '없음' : `"${submitted}"`}
      </Caption>
    </Demo>
  )
}

function TabBarDemo() {
  const [last, setLast] = useState<TabKey | null>(null)

  return (
    <Demo
      title="TabBar"
      description="홈 · 상품 찾기 · 마이페이지 링크. 현재 경로로 active가 정해지고, 하단 safe-area는 Screen의 bottom 슬롯이 더합니다(Screen 데모에서 확인)."
    >
      <FullBleed label="경로 기준 (이 페이지는 /design-system이라 모두 비활성)">
        <TabBar onChange={setLast} />
      </FullBleed>
      {(['home', 'product', 'mypage'] as const).map((tab) => (
        <FullBleed key={tab} label={`active="${tab}" (강제)`}>
          <TabBar active={tab} onChange={setLast} />
        </FullBleed>
      ))}
      <Caption>
        탭은 실제 링크라 누르면 이동해요. 홈(/)만 있고 상품 찾기(/products)·마이페이지(/mypage)
        화면은 아직 없어 404로 가요. 마지막 onChange: {last ?? '없음'}
      </Caption>
    </Demo>
  )
}

function SortTabsDemo() {
  const [value, setValue] = useState('인기순')

  return (
    <Demo
      title="SortTabs"
      description="선택 body03 black0, 나머지 body05 gray4, 사이 8. 탭으로 들어와 ←→로 이동, Space·Enter로 선택."
    >
      <div className="gap-space-8 flex flex-col">
        <SortTabs value={value} onChange={setValue} />
        <Caption>제어형 · value = "{value}"</Caption>
      </div>
      <div className="gap-space-8 flex flex-col">
        <SortTabs options={['인기순', '최신순', '마감 임박순', '낮은 가격순']} defaultValue="최신순" />
        <Caption>비제어형 · 항목 4개, defaultValue="최신순"</Caption>
      </div>
    </Demo>
  )
}
