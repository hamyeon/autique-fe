import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { Chip } from './chip'
import { Icon } from './icon'

const STATUS = {
  planned: { chip: 'plan', priceLabel: '시작가' },
  live: { chip: 'live', priceLabel: '최고가' },
  ended: { chip: 'finish', priceLabel: '최종가' },
} as const

export interface ProductCardProps {
  /** planned 경매 예정 + '시작가'(기본), live LIVE + '최고가', ended 경매 종료 + '최종가'(DS 원본에 없음) */
  status?: keyof typeof STATUS
  /** 칩 문구. 기본 planned '경매 예정', live 'LIVE', ended '경매 종료' */
  statusLabel?: string
  /** 없으면 gray1 바탕 */
  image?: string
  /** 등급 칩(예: 'A등급') */
  grade?: string
  brand: string
  name: string
  /** 기본: planned '시작가', live '최고가', ended '최종가' */
  priceLabel?: string
  /** formatPrice로 만든 문자열 */
  price: string
  /** 예: '관심 556' */
  meta?: string
  favorited?: boolean
  onFavorite?: () => void
  /** 카드를 누르면 이동할 경로. 하트는 따로 눌립니다(DS 원본에 없음). */
  href?: string
  className?: string
}

/** 2열 그리드용 경매 상품 카드: 정사각 이미지 + 칩·하트, 아래 브랜드·상품명·가격·관심 수 */
export function ProductCard({
  status = 'planned',
  statusLabel,
  image,
  grade,
  brand,
  name,
  priceLabel,
  price,
  meta,
  favorited = false,
  onFavorite,
  href,
  className,
}: ProductCardProps) {
  const { chip, priceLabel: defaultPriceLabel } = STATUS[status]
  const label = statusLabel ?? { planned: '경매 예정', live: 'LIVE', ended: '경매 종료' }[status]

  return (
    <article className={cn('gap-space-12 relative isolate flex min-w-0 flex-col', className)}>
      <div className="bg-gray1 relative aspect-square w-full overflow-hidden">
        {image && <img src={image} alt={name} className="block size-full object-cover" />}
        <div className="gap-space-4 top-space-8 left-space-8 absolute flex">
          <Chip kind={chip}>{label}</Chip>
          {grade && <Chip kind="level">{grade}</Chip>}
        </div>
        <button
          type="button"
          aria-label={`${name} 관심 상품`}
          aria-pressed={favorited}
          onClick={onFavorite}
          /* 아이콘은 오른쪽·위 8px에, 터치 영역은 40px. 카드 링크(z-0)보다 위에 둡니다. */
          className="focus-visible:outline-primary1 absolute top-0 right-0 z-10 flex size-10 items-center justify-center focus-visible:outline-2 focus-visible:-outline-offset-2"
        >
          <Icon name="Favorite" style={favorited ? 'fill' : 'line'} color="error1" />
        </button>
      </div>
      <div className="flex flex-col">
        <p className="text-body03 text-black0 truncate">{brand}</p>
        {/* 긴 상품명은 두 줄까지. href가 있으면 상품명 링크의 ::after가 카드 전체를 덮어 카드 어디를 눌러도 이동합니다. */}
        <p className="text-body04 text-black0 line-clamp-2 break-all">
          {href ? (
            <Link
              to={href}
              className="focus-visible:after:outline-primary1 after:absolute after:inset-0 after:z-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2"
            >
              {name}
            </Link>
          ) : (
            name
          )}
        </p>
        <p className="gap-space-4 flex">
          <span className="text-body04 text-gray5 shrink-0">{priceLabel ?? defaultPriceLabel}</span>
          {/* Figma 그대로: 숫자는 body03, 끝의 '원'만 body04 */}
          <span className="text-body03 text-black0">
            {price.endsWith('원') ? (
              <>
                {price.slice(0, -1)}
                <span className="text-body04">원</span>
              </>
            ) : (
              price
            )}
          </span>
        </p>
        {meta && <p className="text-caption02 text-gray4">{meta}</p>}
      </div>
    </article>
  )
}

export interface ProductSummaryProps {
  name: ReactNode
  /** 영문명 */
  subName?: ReactNode
  image?: string
  className?: string
}

/** 결과·결제 화면 맨 위 상품 요약: 48px 썸네일 + 상품명(head02)·영문명(body05 gray5), 한 줄 말줄임 */
export function ProductSummary({ name, subName, image, className }: ProductSummaryProps) {
  return (
    <div className={cn('gap-space-8 flex w-full items-center', className)}>
      {image ? (
        <img src={image} alt="" className="size-12 shrink-0 rounded-sm object-cover" />
      ) : (
        <div aria-hidden className="bg-gray1 size-12 shrink-0 rounded-sm" />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-head02 text-black0 truncate">{name}</p>
        {subName && <p className="text-body05 text-gray5 truncate">{subName}</p>}
      </div>
    </div>
  )
}
