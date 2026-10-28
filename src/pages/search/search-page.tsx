import type { FormEvent, ReactNode } from 'react'
import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAuctionsInfiniteQuery } from '@/api/auctions'
import { Header } from '@/components/ds'
import { Screen } from '@/layouts/screen'
import { AuctionListScreen } from '@/pages/auction-list/auction-list-screen'

/** 한 번에 불러올 개수(2열 × 5줄) */
const PAGE_SIZE = 10

/**
 * 검색(Figma 검색 1044:2708 · 검색 결과 1044:3235). 헤더의 검색 아이콘으로 들어옵니다.
 * 검색어는 주소(?q=)에 남겨 결과에서 상세로 갔다 돌아와도 그대로이고, 뒤로 가기로 이전 검색어로 돌아갑니다.
 */
export function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() ?? ''
  /* 검색어가 바뀌면(뒤로 가기 포함) 입력값을 주소 값으로 새로 시작합니다. */
  return <SearchScreen key={q} q={q} />
}

function SearchScreen({ q }: { q: string }) {
  const [, setParams] = useSearchParams()
  const [text, setText] = useState(q)
  const inputRef = useRef<HTMLInputElement>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next = text.trim()
    if (!next) return
    inputRef.current?.blur() // 휴대폰 키보드를 내립니다.
    setParams({ q: next })
  }

  const header = (
    <form role="search" onSubmit={onSubmit}>
      <Header
        searchRef={inputRef}
        search={{
          value: text,
          onChange: (e) => setText(e.target.value),
          onClear: () => setText(''),
          // 처음 들어오면 바로 입력할 수 있게(Figma 검색: 키보드가 올라온 상태)
          autoFocus: !q,
          'aria-label': '상품 검색',
        }}
      />
    </form>
  )

  if (!q) {
    // 검색 전: 헤더(입력)만. Figma에도 본문이 없습니다.
    return <Screen header={header}>{null}</Screen>
  }
  return <SearchResults q={q} header={header} />
}

function SearchResults({ q, header }: { q: string; header: ReactNode }) {
  // [ASSUMED] 명세에 검색 API가 없어 경매 목록 API에 keyword를 붙입니다.
  const query = useAuctionsInfiniteQuery({ keyword: q, size: PAGE_SIZE })

  return (
    <AuctionListScreen
      header={header}
      query={query}
      emptyTitle={`'${q}' 검색 결과가 없어요`}
      emptyDescription="찾는 상품이 있다면 AI 에이전트 기능을 활용해보세요"
      errorTitle="검색 결과를 불러오지 못했어요"
    />
  )
}
