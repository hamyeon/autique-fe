import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Bid } from '@/api/schemas/auctions'
import { BiddingListItem, Divider } from '@/components/ds'
import { formatClock, formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface BidHistoryProps {
  bids: Bid[]
  /** 내가 밀렸을 때(exceeded) 최고가 행을 빨간 worst로 */
  outbid: boolean
}

/*
 * 입찰 금액은 경매 안에서 계속 올라가 겹치지 않으므로 행의 key로 씁니다.
 * 낙관적으로 넣은 내 입찰(임시 id)이 서버 입찰로 바뀌어도 같은 행으로 남아 다시 나타나는 애니메이션이 없습니다.
 */
const rowKey = (bid: Bid) => bid.amount

/**
 * 입찰 내역(BiddingListItem + 구분선). 최신이 위.
 * - 새 입찰은 위에 살짝 내려오며 나타납니다(처음 그릴 때는 애니메이션 없음).
 * - 사용자가 목록 아래를 보고 있으면 위에 줄이 늘어난 만큼 스크롤을 내려 보던 줄이 튀지 않게 합니다.
 */
export function BidHistory({ bids, outbid }: BidHistoryProps) {
  const keys = bids.map(rowKey)
  const signature = keys.join(',')

  /* 이전 렌더의 행을 기억해 새로 들어온 행만 고릅니다(렌더 중 상태 갱신 패턴). */
  const [seen, setSeen] = useState(() => ({
    signature,
    keys: new Set(keys),
    fresh: new Set<number>(),
  }))
  if (seen.signature !== signature) {
    setSeen({
      signature,
      keys: new Set(keys),
      fresh: new Set(keys.filter((key) => !seen.keys.has(key))),
    })
  }

  const listRef = useScrollAnchor(signature)

  return (
    <div ref={listRef} className="flex flex-col">
      {bids.map((bid, index) => {
        const key = rowKey(bid)
        return (
          <div
            key={key}
            data-row-key={key}
            className={cn(seen.fresh.has(key) && 'motion-safe:animate-bid-row-in')}
          >
            {index > 0 && <Divider />}
            <BiddingListItem
              price={bid.isHighest ? (outbid ? 'worst' : 'best') : 'default'}
              time={formatClock(new Date(bid.bidAt))}
              bidder={bid.isMine ? '나' : bid.bidderMasked}
              method={bid.bidType === 'AUTO' ? '자동 입찰' : '직접 입찰'}
              amount={formatPrice(bid.amount)}
            />
          </div>
        )
      })}
    </div>
  )
}

/** 위에 붙은 헤더 높이(60). 이 아래에 보이는 첫 줄을 기준으로 삼습니다. */
const STICKY_HEADER_PX = 60

/**
 * 사용자가 목록 아래를 보고 있을 때(목록 윗부분이 헤더 뒤로 지나감), 보고 있던 첫 줄이 새 입찰 때문에 밀려나면
 * 밀린 만큼 스크롤해 그 줄을 제자리에 둡니다. 한 페이지(20줄)라 높이가 그대로여도 줄은 밀리므로 높이가 아니라 줄 위치로 맞춥니다.
 * 브라우저의 스크롤 앵커링(Safari 일부 미지원)과 겹치지 않게 이 화면에서는 앵커링을 끕니다.
 */
function useScrollAnchor(signature: string) {
  const listRef = useRef<HTMLDivElement>(null)
  const anchor = useRef<{ key: string; top: number } | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const before = root.style.overflowAnchor
    root.style.overflowAnchor = 'none'
    const onScroll = () => (anchor.current = findAnchor(listRef.current))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      root.style.overflowAnchor = before
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useLayoutEffect(() => {
    const list = listRef.current
    const prev = anchor.current
    if (list && prev) {
      const row = list.querySelector(`[data-row-key="${prev.key}"]`)
      const delta = row ? row.getBoundingClientRect().top - prev.top : 0
      if (delta !== 0) window.scrollBy(0, delta)
    }
    anchor.current = findAnchor(list)
  }, [signature])

  return listRef
}

/** 목록이 헤더 뒤로 지나가 있으면 헤더 아래 첫 줄과 그 위치. 위를 보고 있으면 null(새 줄이 그대로 보이게) */
function findAnchor(list: HTMLElement | null) {
  if (!list || list.getBoundingClientRect().top >= STICKY_HEADER_PX) return null
  for (const row of list.querySelectorAll<HTMLElement>('[data-row-key]')) {
    const top = row.getBoundingClientRect().top
    if (top >= STICKY_HEADER_PX) return { key: row.dataset.rowKey ?? '', top }
  }
  return null
}
