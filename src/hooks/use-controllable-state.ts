import { useState } from 'react'

/**
 * 제어형(value + onChange)과 비제어형(defaultValue)을 함께 지원하는 상태.
 * value가 undefined가 아니면 제어형으로 보고 내부 상태를 쓰지 않습니다.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
) {
  const [inner, setInner] = useState(defaultValue)
  const controlled = value !== undefined
  const current = controlled ? value : inner

  const set = (next: T) => {
    if (!controlled) setInner(next)
    onChange?.(next)
  }

  return [current, set] as const
}
