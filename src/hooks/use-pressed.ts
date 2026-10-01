import { useEffect, useRef, useState } from 'react'

/**
 * 눌림 상태를 pointer 이벤트로 직접 관리합니다.
 * CSS :active는 짧은 클릭에선 거의 안 보이고, iOS Safari에선 탭에 잘 걸리지 않아서
 * 누르는 동안 + 최소 minMs 동안 pressed를 true로 둡니다.
 */
export function usePressed(minMs = 150) {
  const [pressed, setPressed] = useState(false)
  const down = useRef(false)
  const startedAt = useRef(0)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const press = () => {
    window.clearTimeout(timer.current)
    down.current = true
    startedAt.current = performance.now()
    setPressed(true)
  }

  const release = () => {
    if (!down.current) return
    down.current = false
    const left = minMs - (performance.now() - startedAt.current)
    if (left <= 0) setPressed(false)
    else timer.current = window.setTimeout(() => setPressed(false), left)
  }

  return {
    pressed,
    handlers: {
      onPointerDown: press,
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
    },
  }
}
