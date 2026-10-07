import { Icon } from '@/components/ds'
import { cn } from '@/lib/utils'

export interface CompleteIllustrationProps {
  className?: string
}

/**
 * 등록 완료 일러스트(Figma CompleteImg 901:6097). 120×120 흰 상자(밖으로 나간 부분은 잘림)에서
 * 보내기 아이콘(80×80)이 왼쪽 아래 → 오른쪽 위로 날아갑니다
 * (animate-complete-send: 0.2초 대기 · 0.8초 ease-out · 0.2초 대기 · 즉시 복귀, 1.2초 반복).
 * '동작 줄이기'를 켠 사용자에게는 왼쪽 아래(Figma 화면에 놓인 상태)에 멈춰 있습니다.
 */
export function CompleteIllustration({ className }: CompleteIllustrationProps) {
  return (
    <div
      aria-hidden
      className={cn('bg-white0 relative size-30 shrink-0 overflow-hidden', className)}
    >
      <Icon
        name="img_complete_send"
        className="animate-complete-send absolute top-10 left-0 motion-reduce:animate-none"
      />
    </div>
  )
}
