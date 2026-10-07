import type { UIEvent } from 'react'
import { useState } from 'react'
import { ImagePlaceholder, PageIndicator } from '@/components/ds'

export interface ImageCarouselProps {
  images: string[]
  /** 이미지 대체 텍스트 앞부분(상품명) */
  alt: string
}

/**
 * 상품 이미지: 화면 폭 정사각, 좌우 스와이프(scroll-snap) + 아래 PageIndicator.
 * 화면 좌우 여백을 무시하고 폭을 채우도록 -mx-layout-gutter로 꺼냅니다.
 */
export function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0)
  const slides = images.length > 0 ? images : [undefined]

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = e.currentTarget
    if (clientWidth > 0) setCurrent(Math.round(scrollLeft / clientWidth))
  }

  return (
    <div className="-mx-layout-gutter relative">
      <div
        aria-roledescription="carousel"
        aria-label={`${alt} 이미지`}
        onScroll={onScroll}
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
