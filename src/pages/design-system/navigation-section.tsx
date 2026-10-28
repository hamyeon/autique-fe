import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import type { TabKey } from '@/components/ds'
import {
  Header,
  HeaderActions,
  HeaderInput,
  HomeHeader,
  MyPageListButton,
  MyPageMenuSection,
  SortTabs,
  TabBar,
} from '@/components/ds'
import { Caption, Demo, Section } from './showcase'

export function NavigationSection() {
  return (
    <Section id="navigation" title="Navigation">
      <HeaderDemo />
      <HeaderActionsDemo />
      <HomeHeaderDemo />
      <HeaderInputDemo />
      <SearchHeaderDemo />
      <TabBarDemo />
      <SortTabsDemo />
      <MyPageListButtonDemo />
      <MyPageMenuSectionDemo />
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
  const [sort, setSort] = useState('인기순')
  const [lastAction, setLastAction] = useState<string | null>(null)
  const actions = {
    onSearch: () => setLastAction('검색'),
    onNotifications: () => setLastAction('알림'),
    onBag: () => setLastAction('장바구니'),
  }

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
      <FullBleed label='trailing="actions" · showBack={false} (마이페이지 · 하위 목록, Figma 957:1930)'>
        <Header title="마이페이지" showBack={false} trailing="actions" actions={actions} />
      </FullBleed>
      <FullBleed label='trailing="actions" · 긴 제목은 말줄임, 아이콘은 그대로'>
        <Header
          title="과거 경매했던 상품이 아주 많아서 제목이 길어요"
          showBack={false}
          trailing="actions"
          actions={actions}
        />
      </FullBleed>
      <FullBleed label={`trailing=sort · title에 SortTabs (경매 리스트, Figma 957:2827) · 선택 "${sort}"`}>
        <Header
          title={<SortTabs value={sort} onChange={setSort} />}
          showBack={false}
          trailing="actions"
          actions={actions}
        />
      </FullBleed>
      <Caption>위 예시(첫 번째 제외)는 onBack을 넘겨 이동 대신 횟수만 셉니다: {backCount}회</Caption>
      <Caption>마지막으로 누른 아이콘(actions): {lastAction ?? '없음'}</Caption>
    </Demo>
  )
}

function HomeHeaderDemo() {
  const [last, setLast] = useState<string | null>(null)

  return (
    <Demo
      title="HomeHeader"
      description="로고 108×28 + HeaderActions, 왼쪽 20 · 오른쪽 16(Figma 239:754)."
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

function HeaderInputDemo() {
  const [filled, setFilled] = useState('나이키 덩크 로우')
  const [typing, setTyping] = useState('')

  return (
    <Demo
      title="HeaderInput"
      description="헤더 안 검색 입력(Figma 1044:3397). 높이 50, gray0 바탕, radius-md, body02. 비어 있으면 돋보기(gray5), 글자가 있으면 지우기(×, 24). 포커스 중 테두리 primary1."
    >
      <div className="gap-space-8 flex flex-col">
        <Caption>state=default · 비어 있음 (눌러서 입력하면 focused)</Caption>
        <HeaderInput value={typing} onChange={(e) => setTyping(e.target.value)} onClear={() => setTyping('')} aria-label="검색어" />
      </div>
      <div className="gap-space-8 flex flex-col">
        <Caption>state=filled · 글자 있음 (×를 누르면 비워지고 포커스는 그대로)</Caption>
        <HeaderInput value={filled} onChange={(e) => setFilled(e.target.value)} onClear={() => setFilled('')} aria-label="검색어" />
      </div>
      <div className="gap-space-8 flex flex-col">
        <Caption>긴 검색어 · 가로로 넘치면 입력 안에서 스크롤</Caption>
        <HeaderInput
          value="나이키 에어 조던 1 레트로 하이 OG 시카고 로스트 앤 파운드 2022 한정판"
          readOnly
          aria-label="검색어"
        />
      </div>
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
      title="Header · search"
      description="Figma Header trailing=search(1044:2859): 뒤로 가기 + HeaderInput(폭 채움), 아래 선 없음, 왼쪽 8 · 오른쪽 20. Header에 search props를 넘깁니다. 휴대폰 키보드에 '검색' 키가 떠요."
    >
      <form role="search" onSubmit={onSubmit}>
        <FullBleed label="value + onChange, Enter로 제출 · 뒤로 가기 = navigate(-1)">
          <Header
            search={{
              value: query,
              onChange: (e) => setQuery(e.target.value),
              onClear: () => setQuery(''),
              'aria-label': '상품 검색',
            }}
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
        탭은 실제 링크라 누르면 홈(/) · 상품 찾기(/products) · 마이페이지(/my)로 이동해요. 마지막
        onChange: {last ?? '없음'}
      </Caption>
    </Demo>
  )
}

function SortTabsDemo() {
  const [value, setValue] = useState('인기순')

  return (
    <Demo
      title="SortTabs"
      description="모두 head02, 선택 black0 · 나머지 gray4, 사이 8. Header 제목 자리에 넣어 씁니다. 탭으로 들어와 ←→로 이동, Space·Enter로 선택."
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

function HeaderActionsDemo() {
  const [last, setLast] = useState<string | null>(null)

  return (
    <Demo
      title="HeaderActions"
      description="검색 · 알림 · 장바구니 24, 사이 16. 보이는 크기는 그대로 두고 터치 영역만 40×44로 넓혔습니다. HomeHeader와 Header trailing='actions'가 씁니다(Figma 973:2389)."
    >
      <div className="flex justify-end">
        <HeaderActions
          onSearch={() => setLast('검색')}
          onNotifications={() => setLast('알림')}
          onBag={() => setLast('장바구니')}
        />
      </div>
      <Caption>마지막으로 누른 아이콘: {last ?? '없음'} · 탭 키로 이동하면 primary1 포커스 링</Caption>
    </Demo>
  )
}

function MyPageListButtonDemo() {
  const [count, setCount] = useState(0)

  return (
    <Demo
      title="MyPageListButton"
      description="높이 52, 왼쪽 20 · 오른쪽 8, head03 black0 + 화살표 36(Figma 207:749). 누르는 동안 gray0 바탕(흰 바탕 요소 공통 규칙). href면 링크, 아니면 버튼."
    >
      <FullBleed label={`onClick (버튼) · 누른 횟수 ${count}회`}>
        <MyPageListButton onClick={() => setCount((c) => c + 1)}>현재 경매 중인 상품</MyPageListButton>
      </FullBleed>
      <FullBleed label="href (링크) · 누르면 /design-system/screen-demo로 이동">
        <MyPageListButton href="/design-system/screen-demo">관심 목록</MyPageListButton>
      </FullBleed>
      <FullBleed label="긴 문구 · 한 줄 말줄임, 화살표는 그대로">
        <MyPageListButton onClick={() => setCount((c) => c + 1)}>
          경매 AI Agent 설정과 자동 입찰 상한가 기본값 관리하기
        </MyPageListButton>
      </FullBleed>
    </Demo>
  )
}

function MyPageMenuSectionDemo() {
  const [last, setLast] = useState<string | null>(null)
  const item = (label: string) => (
    <MyPageListButton onClick={() => setLast(label)}>{label}</MyPageListButton>
  )

  return (
    <Demo
      title="MyPageMenuSection"
      description="제목(body03 gray4, 좌우 20 · 위아래 8) 아래 메뉴 행을 간격 없이 쌓습니다(Figma 977:2446). 그룹 사이 12는 화면이 맡습니다."
    >
      <FullBleed label="행 2개 × 2그룹 · 그룹 사이 12 (화면에서 쓰는 모양)">
        <div className="gap-space-12 flex flex-col">
          <MyPageMenuSection title="나의 경매">
            {item('현재 경매 중인 상품')}
            {item('과거 경매했던 상품')}
          </MyPageMenuSection>
          <MyPageMenuSection title="쇼핑">
            {item('관심 목록')}
            {item('경매 AI Agent 설정')}
          </MyPageMenuSection>
        </div>
      </FullBleed>
      <FullBleed label="행 3개">
        <MyPageMenuSection title="고객 센터">
          {item('공지사항')}
          {item('자주 묻는 질문')}
          {item('약관 및 정책')}
        </MyPageMenuSection>
      </FullBleed>
      <Caption>마지막으로 누른 메뉴: {last ?? '없음'}</Caption>
    </Demo>
  )
}
