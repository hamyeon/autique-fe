import { cn } from '@/lib/utils'
import { Chip } from './chip'

const PRICE_CLASS = {
  best: 'text-head03 text-primary1',
  worst: 'text-head03 text-error1',
  default: 'text-body01 text-black0',
} as const

export interface BiddingListItemProps {
  /** best 최고가·내가 유리, worst 최고가·내가 밀림, default 지난 입찰 */
  price?: keyof typeof PRICE_CLASS
  /** 'HH:MM' (formatClock) */
  time: string
  bidder: string
  /** 자동 입찰 / 직접 입찰 */
  method?: string
  /** formatPrice로 만든 문자열 */
  amount: string
  /** 최고가 칩 문구. 기본 '최고가' */
  badge?: string
  className?: string
}

/** 입찰 내역 한 줄: 시간 · 입찰자·방식 · (최고가 칩) 금액. 줄 사이 구분선은 소비 측이 넣습니다. */
export function BiddingListItem({
  price = 'default',
  time,
  bidder,
  method,
  amount,
  badge = '최고가',
  className,
}: BiddingListItemProps) {
  return (
    <div className={cn('py-space-8 flex w-full items-center justify-between', className)}>
      <div className="gap-space-12 flex min-w-0 items-center">
        <p className="text-body05 text-black0 w-11 shrink-0">{time}</p>
        <div className="flex min-w-0 flex-col">
          <p className="text-label01 text-gray5 truncate">{bidder}</p>
          {method && <p className="text-label02 text-gray4">{method}</p>}
        </div>
      </div>
      <div className="gap-space-8 flex shrink-0 items-center">
        {price !== 'default' && <Chip kind={price}>{badge}</Chip>}
        <p className={PRICE_CLASS[price]}>{amount}</p>
      </div>
    </div>
  )
}
