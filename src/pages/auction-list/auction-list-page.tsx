import { useSearchParams } from 'react-router'
import { useAuctionsInfiniteQuery } from '@/api/auctions'
import type { AuctionSort } from '@/api/schemas/auctions'
import { Header, SortTabs, TabBar } from '@/components/ds'
import { AuctionListScreen } from '@/pages/auction-list/auction-list-screen'

/** 한 번에 불러올 개수(2열 × 5줄) */
const PAGE_SIZE = 10

const SORTS: { label: string; value: AuctionSort }[] = [
  { label: '인기순', value: 'popular' },
  { label: '최신순', value: 'latest' },
]

/** 상품 찾기 탭: 정렬 탭 헤더 + 경매 목록(Figma 경매 리스트 551:3556). 정렬은 주소(?sort=latest)에 남겨 뒤로 와도 유지합니다. */
export function AuctionListPage() {
  const [params, setParams] = useSearchParams()
  const sort = SORTS.find((s) => s.value === params.get('sort'))?.value ?? 'popular'
  const query = useAuctionsInfiniteQuery({ sort, size: PAGE_SIZE })

  const onSortChange = (label: string) => {
    const next = SORTS.find((s) => s.label === label)?.value ?? 'popular'
    setParams(next === 'popular' ? {} : { sort: next }, { replace: true })
    window.scrollTo({ top: 0 })
  }

  return (
    <AuctionListScreen
      header={
        <Header
          showBack={false}
          trailing="actions"
          title={
            <SortTabs
              options={SORTS.map((s) => s.label)}
              value={SORTS.find((s) => s.value === sort)?.label}
              onChange={onSortChange}
            />
          }
        />
      }
      bottom={<TabBar active="product" />}
      query={query}
      emptyTitle="아직 열린 경매가 없어요"
      emptyDescription="새 경매가 등록되면 여기에서 보여드릴게요"
      errorTitle="경매 목록을 불러오지 못했어요"
    />
  )
}
