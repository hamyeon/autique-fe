import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { useAuctionsInfiniteQuery, usePopularAuctionsInfiniteQuery } from '@/api/auctions'
import { Header, SortTabs, TabBar } from '@/components/ds'
import type { AuctionListScreenProps } from '@/pages/auction-list/auction-list-screen'
import { AuctionListScreen } from '@/pages/auction-list/auction-list-screen'

/** 최신순 한 번에 불러올 개수(2열 × 5줄) */
const PAGE_SIZE = 10

/** 인기순 개수. 인기 API는 페이지가 없고 최대 20개 */
const POPULAR_LIMIT = 20

/** 정렬 탭. 서버에 정렬 파라미터가 없어 인기순은 인기 API, 최신순은 기본 목록 API(최신순 고정)를 씁니다. */
type ListSort = 'popular' | 'latest'

const SORTS: { label: string; value: ListSort }[] = [
  { label: '인기순', value: 'popular' },
  { label: '최신순', value: 'latest' },
]

/** 상품 찾기 탭: 정렬 탭 헤더 + 경매 목록(Figma 경매 리스트 551:3556). 정렬은 주소(?sort=latest)에 남겨 뒤로 와도 유지합니다. */
export function AuctionListPage() {
  const [params, setParams] = useSearchParams()
  const sort = SORTS.find((s) => s.value === params.get('sort'))?.value ?? 'popular'

  const onSortChange = (label: string) => {
    const next = SORTS.find((s) => s.label === label)?.value ?? 'popular'
    setParams(next === 'popular' ? {} : { sort: next }, { replace: true })
    window.scrollTo({ top: 0 })
  }

  const header = (
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
  )

  return sort === 'popular' ? <PopularList header={header} /> : <LatestList header={header} />
}

function PopularList({ header }: { header: ReactNode }) {
  const query = usePopularAuctionsInfiniteQuery(POPULAR_LIMIT)
  return <ListBody header={header} query={query} />
}

function LatestList({ header }: { header: ReactNode }) {
  const query = useAuctionsInfiniteQuery({ size: PAGE_SIZE })
  return <ListBody header={header} query={query} />
}

function ListBody(props: Pick<AuctionListScreenProps, 'header' | 'query'>) {
  return (
    <AuctionListScreen
      {...props}
      bottom={<TabBar active="product" />}
      emptyTitle="아직 열린 경매가 없어요"
      emptyDescription="새 경매가 등록되면 여기에서 보여드릴게요"
      errorTitle="경매 목록을 불러오지 못했어요"
    />
  )
}
