import { Fragment, useState } from 'react'
import shoeDefect from '@/assets/illustrations/img_shoe_defect.svg'
import shoeFront from '@/assets/illustrations/img_shoe_front.svg'
import shoeSide from '@/assets/illustrations/img_shoe_side.svg'
import type { BiddingListItemProps, Emphasis, ProductCardProps } from '@/components/ds'
import {
  AuctionStatusCard,
  BiddingListItem,
  Button,
  Divider,
  InfoRow,
  PriceCard,
  ProductCard,
  ProductSummary,
  SellerProfile,
  SortTabs,
  SummaryCard,
} from '@/components/ds'
import { useNow } from '@/hooks/use-now'
import { formatClock, formatNumber, formatPrice } from '@/lib/format'
import { formatRemaining, getRemainingMs } from '@/lib/remaining-time'
import { Caption, Demo, Section } from './showcase'

const LONG_NAME =
  '나이키 에어 조던 1 레트로 하이 OG 시카고 로스트 앤 파운드 2022 한정판 미착용 새상품 박스 포함'

export function AuctionSection() {
  return (
    <Section id="auction" title="Auction">
      <ProductCardDemo />
      <ProductSummaryDemo />
      <SellerProfileDemo />
      <InfoRowDemo />
      <SummaryCardDemo />
      <PriceCardDemo />
      <BiddingListItemDemo />
      <AuctionStatusCardDemo />
      <RemainingTimeDemo />
    </Section>
  )
}

const PRODUCTS: (Omit<ProductCardProps, 'favorited' | 'onFavorite'> & { id: string; note: string })[] = [
  {
    id: 'a',
    note: 'planned · 이미지 있음',
    image: shoeSide,
    grade: 'A등급',
    brand: 'BAPE',
    name: '베이프 슬라이드 #1 블랙',
    price: formatPrice(234000),
    meta: '관심 556',
  },
  {
    id: 'b',
    note: 'live',
    status: 'live',
    image: shoeFront,
    grade: 'B등급',
    brand: 'NIKE',
    name: '덩크 로우 판다',
    price: formatPrice(98000),
    meta: '관심 128',
  },
  {
    id: 'c',
    note: '아주 긴 상품명(두 줄 말줄임)',
    status: 'live',
    image: shoeDefect,
    grade: 'S등급',
    brand: 'NIKE JORDAN BRAND COLLABORATION',
    name: LONG_NAME,
    price: formatPrice(1250000),
    meta: '관심 12,304',
  },
  {
    id: 'd',
    note: '이미지 없음 · 등급·관심 수 없음',
    brand: 'ASICS',
    name: '노바블라스트 6',
    price: formatPrice(50000),
  },
  {
    id: 'e',
    note: 'statusLabel·priceLabel 변경',
    statusLabel: '낙찰',
    priceLabel: '낙찰가',
    grade: 'A등급',
    brand: 'NEW BALANCE',
    name: '993 그레이',
    price: formatPrice(189000),
    meta: '관심 42',
  },
]

function ProductCardDemo() {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({ b: true })
  const [sort, setSort] = useState('인기순')

  return (
    <Demo
      title="ProductCard"
      description="화면 골격대로 2열 그리드(열 12 · 행 20). 이미지는 정사각, 하트는 error1(line ↔ fill). 이미지가 없으면 gray1 바탕."
    >
      {/* '비슷한 상품 보기' 섹션처럼: 제목 → 16 → 그리드 */}
      <div className="gap-space-16 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-head03 text-black0">비슷한 상품 보기</h3>
          <SortTabs value={sort} onChange={setSort} />
        </div>
        <div className="gap-x-space-12 gap-y-space-20 grid grid-cols-2">
          {PRODUCTS.map(({ id, note, ...product }) => (
            <div key={id} className="gap-space-8 flex min-w-0 flex-col">
              <ProductCard
                {...product}
                favorited={!!favorites[id]}
                onFavorite={() => setFavorites((f) => ({ ...f, [id]: !f[id] }))}
              />
              <Caption>{note}</Caption>
            </div>
          ))}
        </div>
      </div>
    </Demo>
  )
}

function ProductSummaryDemo() {
  return (
    <Demo
      title="ProductSummary"
      description="48px 썸네일 + 상품명(head02) · 영문명(body05 gray5), 사이 8. 한 줄 말줄임, 썸네일 없으면 gray1."
    >
      <ProductSummary
        name="아식스 노바블라스트 6 블랙 - 2E 와이드"
        subName="Asics Novablast 6 Black - 2E Wide"
        image={shoeSide}
      />
      <ProductSummary
        name={LONG_NAME}
        subName="Nike Air Jordan 1 Retro High OG Chicago Lost and Found 2022"
      />
      <ProductSummary name="영문명 없음" />
    </Demo>
  )
}

function SellerProfileDemo() {
  return (
    <Demo
      title="SellerProfile"
      description="48px 원형 사진 + 닉네임(body04 gray7) · 보조 정보(label01 gray4), 사이 12. 사진 없으면 gray1 원."
    >
      <SellerProfile name="mmaybei" meta="누적 판매 건수 4회" />
      <SellerProfile name="sneaker_collector_seoul_2026_official" meta="누적 판매 건수 128회" avatar={shoeFront} />
      <SellerProfile name="보조 정보 없음" />
    </Demo>
  )
}

const EMPHASIS_ROWS: { label: string; value: string; emphasis: Emphasis }[] = [
  { label: 'default', value: formatPrice(50000), emphasis: 'default' },
  { label: 'regular', value: '오늘 오후 8시', emphasis: 'regular' },
  { label: 'primary', value: formatPrice(50000), emphasis: 'primary' },
  { label: 'danger', value: '42:18', emphasis: 'danger' },
  { label: 'total', value: formatPrice(108000), emphasis: 'total' },
  { label: 'totalDanger', value: `${formatPrice(120000)} 도달`, emphasis: 'totalDanger' },
  { label: 'hero', value: formatPrice(120000), emphasis: 'hero' },
]

function InfoRowDemo() {
  return (
    <Demo
      title="InfoRow"
      description="라벨(body05 gray5) – 값 양 끝 정렬, 사이 최소 8. emphasis 7가지."
    >
      <div className="gap-card-row flex flex-col">
        {EMPHASIS_ROWS.map((row) => (
          <InfoRow key={row.label} {...row} />
        ))}
      </div>
      <Divider />
      <div className="gap-card-row flex flex-col">
        <InfoRow label="tone (예전 이름)" value="참여 제한" tone="danger" />
        <InfoRow
          label="긴 값"
          value="서울특별시 강남구 테헤란로 123 오토빌딩 4층 직거래 가능"
          emphasis="regular"
        />
      </div>
    </Demo>
  )
}

function SummaryCardDemo() {
  return (
    <Demo
      title="SummaryCard"
      description="InfoRow 최대 4행 + 선택적 구분선(dividerAfter). 패딩 16, 행 간격 8."
    >
      <SummaryCard
        dividerAfter={2}
        rows={[
          { label: '최종 낙찰가', value: formatPrice(105000) },
          { label: '배송비', value: formatPrice(3000) },
          { label: '결제할 금액', value: formatPrice(108000), emphasis: 'total' },
        ]}
      />
      <SummaryCard
        tone="primary"
        dividerAfter={2}
        rows={[
          { label: '상태', value: '자동 입찰 예약 전', emphasis: 'regular' },
          { label: 'AI 적정 시세', value: formatPrice(120000), emphasis: 'hero' },
          { label: '경매 시작까지', value: '3시간' },
        ]}
      />
      <SummaryCard
        rows={[
          { label: '경매 시작', value: '9월 21일 오후 4:00', emphasis: 'regular' },
          { label: '경매 종료', value: '9월 21일 오후 5:00', emphasis: 'regular' },
          { label: '시작가', value: formatPrice(50000), emphasis: 'primary' },
          { label: '참여', value: '참여 제한', emphasis: 'danger' },
        ]}
      />
      <Caption>위에서부터: 기본 + 구분선 · primary + 구분선 · 4행 구분선 없음</Caption>
    </Demo>
  )
}

function PriceCardDemo() {
  return (
    <Demo
      title="PriceCard"
      description="AI가 낸 가격에만: 블루 태그 + title02 primary1 금액, 구분선 아래 행."
    >
      <PriceCard
        price={formatPrice(120000)}
        rows={[
          { label: '최근 거래 평균', value: formatPrice(118000) },
          { label: '분석 매물', value: '116건', emphasis: 'regular' },
        ]}
      />
      <PriceCard
        tag="AI 적정 기준가"
        price={formatPrice(220000)}
        rows={[
          { label: '최소 추천가', value: formatPrice(180000) },
          { label: '최대 추천가', value: formatPrice(240000) },
        ]}
      />
      <PriceCard price={formatPrice(98000)} />
      <Caption>위에서부터: 기본 태그 · AI 적정 기준가 · 행 없음</Caption>
    </Demo>
  )
}

const at = (h: number, m: number) => formatClock(new Date(2026, 8, 21, h, m))

const BIDS: BiddingListItemProps[] = [
  { price: 'best', time: at(20, 32), bidder: '나', method: '자동 입찰', amount: formatPrice(105000) },
  {
    price: 'worst',
    time: at(20, 35),
    bidder: 'mmaybei',
    method: '직접 입찰',
    amount: formatPrice(125000),
  },
  { time: at(20, 12), bidder: '나', method: '자동 입찰', amount: formatPrice(100000) },
  {
    time: at(9, 5),
    bidder: 'very_long_bidder_nickname_2026',
    method: '직접 입찰',
    amount: formatPrice(1250000),
  },
]

function BiddingListItemDemo() {
  return (
    <Demo
      title="BiddingListItem"
      description="시간 · 입찰자·방식 · 금액. best(primary1 + 최고가 칩) / worst(error1 + 빨간 칩) / default(body01 black0). 구분선은 소비 측."
    >
      <div className="flex flex-col">
        {BIDS.map((bid, i) => (
          <Fragment key={i}>
            {i > 0 && <Divider />}
            <BiddingListItem {...bid} />
          </Fragment>
        ))}
      </div>
      <Caption>위에서부터: best · worst · default · 긴 닉네임 + 큰 금액(default)</Caption>
    </Demo>
  )
}

const CAP = 120000
const START = 105000
/** 남은 시간 데모: 페이지를 연 시점부터 42분 18초 */
const DURATION = (42 * 60 + 18) * 1000

function AuctionStatusCardDemo() {
  const [price, setPrice] = useState(START)
  const [endAt] = useState(() => Date.now() + DURATION)
  const now = useNow()
  const remaining = formatRemaining(getRemainingMs(endAt, now))
  const exceeded = price > CAP

  const timeRow = { label: '남은 시간', value: remaining, emphasis: 'danger' as const }

  return (
    <Demo
      title="AuctionStatusCard"
      description="leading(블루 + 진행 바) · exceeded(레드, 진행 바 없음) · watching(흰 카드, 현재가 total). 남은 시간은 실제로 줄어들어요."
    >
      <div className="gap-space-8 flex flex-col">
        <AuctionStatusCard
          status={exceeded ? 'exceeded' : 'leading'}
          price={formatPrice(price)}
          badge={exceeded ? '상한가 초과' : '최고 입찰자 · 나'}
          rows={[timeRow]}
          extraRows={[
            exceeded
              ? {
                  label: '내 자동 입찰 상한가',
                  value: `${formatPrice(CAP)} 도달`,
                  emphasis: 'totalDanger',
                }
              : { label: '내 자동 입찰 상한가', value: formatPrice(CAP) },
          ]}
          progress={price / CAP}
          caption={
            exceeded
              ? undefined
              : `현재가 ${formatNumber(price)} / 상한가 ${formatNumber(CAP)}`
          }
        />
        <div className="gap-space-8 flex">
          <Button
            variant="outline"
            className="min-w-0 flex-1"
            onClick={() => setPrice((p) => p + 5000)}
          >
            다른 입찰 +5,000
          </Button>
          <Button variant="outline" className="min-w-0 flex-1" onClick={() => setPrice(START)}>
            처음으로
          </Button>
        </div>
        <Caption>
          눌러서 현재가를 올리면 상한가({formatNumber(CAP)})를 넘는 순간 leading → exceeded로 바뀌어요.
        </Caption>
      </div>

      <div className="gap-space-8 flex flex-col">
        <Caption>status="leading" · 상한가에 딱 닿음(progress 1)</Caption>
        <AuctionStatusCard
          price={formatPrice(CAP)}
          badge="최고 입찰자 · 나"
          rows={[timeRow]}
          extraRows={[{ label: '내 자동 입찰 상한가', value: formatPrice(CAP) }]}
          progress={1}
          caption={`현재가 ${formatNumber(CAP)} / 상한가 ${formatNumber(CAP)}`}
        />
      </div>
      <div className="gap-space-8 flex flex-col">
        <Caption>status="exceeded"</Caption>
        <AuctionStatusCard
          status="exceeded"
          price={formatPrice(125000)}
          badge="상한가 초과"
          rows={[timeRow]}
          extraRows={[
            {
              label: '내 자동 입찰 상한가',
              value: `${formatPrice(CAP)} 도달`,
              emphasis: 'totalDanger',
            },
          ]}
        />
      </div>
      <div className="gap-space-8 flex flex-col">
        <Caption>status="watching" · 참여 전</Caption>
        <AuctionStatusCard
          status="watching"
          price={formatPrice(START)}
          rows={[
            { label: '남은 시간', value: remaining },
            { label: '최소 다음 입찰가', value: formatPrice(110000) },
          ]}
        />
      </div>
    </Demo>
  )
}

const REMAINING_SAMPLES = [
  { label: '3일 2시간', ms: (3 * 24 + 2) * 3600_000 },
  { label: '3시간 5분', ms: (3 * 60 + 5) * 60_000 },
  { label: '42분 18초', ms: (42 * 60 + 18) * 1000 },
  { label: '45초', ms: 45_000 },
  { label: '0.4초', ms: 400 },
  { label: '0', ms: 0 },
]

function RemainingTimeDemo() {
  return (
    <Demo
      title="남은 시간 표기 (src/lib/remaining-time.ts)"
      description="getRemainingMs(endAt, now) → formatRemaining(ms, style). clock은 카운트다운, short는 '경매 시작까지 3시간' 같은 대략 표기."
    >
      <div className="border-gray2 p-card-padding gap-card-row flex flex-col rounded-sm border">
        <div className="text-body03 text-black0 grid grid-cols-3">
          <span>남은 시간</span>
          <span>clock</span>
          <span>short</span>
        </div>
        <Divider />
        {REMAINING_SAMPLES.map(({ label, ms }) => (
          <div key={label} className="text-body05 text-black0 grid grid-cols-3">
            <span className="text-gray5">{label}</span>
            <span>{formatRemaining(ms, 'clock')}</span>
            <span>{formatRemaining(ms, 'short')}</span>
          </div>
        ))}
      </div>
    </Demo>
  )
}
