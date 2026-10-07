import { passthrough } from '@/mocks/config'

/** 개발 모드에서 목이 켜져 있음을 알리는 표시. 터치는 아래로 통과합니다. */
export function MockBadge() {
  return (
    <div
      aria-hidden
      className="bg-black0 text-label01 text-white0 px-space-4 right-space-4 bottom-space-4 pointer-events-none fixed z-50 rounded-sm opacity-70"
    >
      MOCK · 실서버 {passthrough.length}
    </div>
  )
}
