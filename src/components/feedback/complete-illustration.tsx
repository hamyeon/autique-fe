import { LoadingIllustration } from './loading-illustration'

export interface CompleteIllustrationProps {
  className?: string
}

/**
 * 완료 일러스트(등록 완료 · 결제 완료, Figma CompleteImg 901:6097 자리 120×120).
 * 로딩 화면과 같은 3D 운동화 영상(video_shoe_loading.mp4)을 반복 재생합니다(2026-11-16, 이전 보내기 아이콘 모션 대체).
 * 재생 방식 · '동작 줄이기' 처리는 LoadingIllustration과 같습니다.
 */
export function CompleteIllustration({ className }: CompleteIllustrationProps) {
  return <LoadingIllustration className={className} />
}
