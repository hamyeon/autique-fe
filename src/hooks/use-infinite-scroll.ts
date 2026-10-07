import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  /** false면 관찰하지 않습니다(다음 페이지 없음 · 불러오는 중 · 실패). */
  enabled: boolean
  onLoadMore: () => void
  /** 바닥에 닿기 얼마 전부터 미리 불러올지. 기본 카드 한 줄 정도 */
  rootMargin?: string
}

/** 목록 끝에 둔 요소(ref)가 화면에 들어오면 onLoadMore를 부릅니다. */
export function useInfiniteScroll<T extends Element>({
  enabled,
  onLoadMore,
  rootMargin = '300px',
}: UseInfiniteScrollOptions) {
  const ref = useRef<T>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  })

  useEffect(() => {
    const target = ref.current
    if (!enabled || !target) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMoreRef.current()
      },
      { rootMargin },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return ref
}
