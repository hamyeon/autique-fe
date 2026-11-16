import { useEffect, useState } from 'react'
import shoeLoading from '@/assets/illustrations/video_shoe_loading.mp4'
import { cn } from '@/lib/utils'

export interface LoadingIllustrationProps {
  className?: string
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/**
 * AI 분석 · 가격 로딩 일러스트. 120×120 자리(Figma LoadingImg 693:2727)에 3D 운동화 영상(video_shoe_loading.mp4,
 * 흰 바탕 624×624 · 5초)을 소리 없이 반복 재생합니다(2026-11-16, 이전 막대 훑기 모션 대체).
 * - iOS Safari는 muted + playsInline이어야 자동 재생하고 전체 화면으로 열지 않습니다.
 * - '동작 줄이기'를 켠 사용자에게는 재생하지 않고 첫 장면에 멈춰 둡니다(#t로 첫 장면을 그리게 함).
 * - 장식이라 읽지 않습니다. 로딩 문구는 화면이 role="status"로 알립니다.
 */
export function LoadingIllustration({ className }: LoadingIllustrationProps) {
  const reduced = useReducedMotion()
  return (
    <div aria-hidden className={cn('bg-white0 size-30 shrink-0 overflow-hidden', className)}>
      <video
        /* 동작 줄이기를 바꾸면 재생 여부가 바뀌도록 새로 그립니다. */
        key={reduced ? 'still' : 'play'}
        src={reduced ? `${shoeLoading}#t=0.001` : shoeLoading}
        autoPlay={!reduced}
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        className="pointer-events-none block size-full object-cover"
      />
    </div>
  )
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCED_MOTION).matches)
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION)
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}
