import { passthrough } from '@/mocks/config'
import { currentScenario } from '@/mocks/define'

/** 개발 모드에서 목이 켜져 있음을 알리는 표시. 유지되는 시나리오(?mock=slow 등)도 함께 보여줍니다. 터치는 아래로 통과합니다. */
export function MockBadge() {
  const scenario = currentScenario()
  return (
    <div
      aria-hidden
      className="bg-black0 text-label01 text-white0 px-space-4 right-space-4 bottom-space-4 pointer-events-none fixed z-50 rounded-sm opacity-70"
    >
      MOCK · 실서버 {passthrough.length}
      {scenario && ` · ${scenario}`}
    </div>
  )
}
