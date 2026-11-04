import type { UIEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ImagePlaceholder, PageIndicator } from '@/components/ds'

export interface ImageCarouselProps {
  images: string[]
  /** 이미지 대체 텍스트 앞부분(상품명, 배너 등) */
  alt: string
  /**
   * 넘기면 이 간격(ms)마다 다음 장으로 넘어가고, 마지막 다음은 첫 장입니다. 누르고 있는 동안 · 손으로 넘긴 직후 ·
   * 화면이 숨겨진 동안 · '동작 줄이기' 설정에서는 넘기지 않습니다. 손으로 넘기면 그때부터 다시 셉니다.
   */
  autoPlayMs?: number
}

/**
 * 화면 폭 정사각 이미지: 좌우 스와이프(scroll-snap) + 아래 PageIndicator(2장 이상일 때). 자동 넘김은 autoPlayMs로 켭니다.
 * 상품 상세 이미지 · 홈 상단 배너가 씁니다. 화면 좌우 여백을 무시하고 폭을 채우도록 -mx-layout-gutter로 꺼냅니다.
 */
export function ImageCarousel({ images, alt, autoPlayMs }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [holding, setHolding] = useState(false)
  /** 화면이 숨겨져 넘기지 못했을 때 타이머를 다시 걸기 위한 값 */
  const [tick, setTick] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const slides = images.length > 0 ? images : [undefined]
  const count = slides.length

  /* 장이 바뀔 때마다(자동이든 손이든) 타이머를 새로 걸어, 손으로 넘긴 뒤에도 바로 넘어가지 않게 합니다. */
  useEffect(() => {
    if (!autoPlayMs || count < 2 || holding) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setTimeout(() => {
      const el = scrollerRef.current
      // 앱 전환 등으로 숨겨진 동안은 넘기지 않고 다음 간격에 다시 봅니다.
      if (!el || document.visibilityState === 'hidden') return setTick((t) => t + 1)
      el.scrollTo({ left: ((current + 1) % count) * el.clientWidth, behavior: 'smooth' })
    }, autoPlayMs)
    return () => window.clearTimeout(id)
  }, [autoPlayMs, count, current, holding, tick])

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = e.currentTarget
    if (clientWidth > 0) setCurrent(Math.round(scrollLeft / clientWidth))
  }

  return (
    <div className="-mx-layout-gutter relative">
      <div
        aria-roledescription="carousel"
        aria-label={`${alt} 이미지`}
        ref={scrollerRef}
        onScroll={onScroll}
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {slides.map((src, i) => (
          <ImagePlaceholder
            key={i}
            src={src}
            ratio={1}
            alt={`${alt} ${i + 1}/${slides.length}`}
            className="snap-center"
          />
        ))}
      </div>
      {slides.length > 1 && (
        <PageIndicator
          count={slides.length}
          current={current}
          className="bottom-space-20 absolute left-1/2 -translate-x-1/2"
        />
      )}
    </div>
  )
}
