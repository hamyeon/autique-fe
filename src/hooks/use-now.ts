import { useEffect, useState } from 'react'

/** intervalMs마다 갱신되는 현재 시각(ms). 남은 시간 카운트다운에 씁니다. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
