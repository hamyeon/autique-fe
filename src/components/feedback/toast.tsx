import { useEffect } from 'react'
import { useToastStore } from '@/stores/toast-store'

/** 안내가 떠 있는 시간 */
export const TOAST_DURATION_MS = 2000

/**
 * 화면 아래 가운데 짧은 안내(Figma에 없음, DS 톤으로 정함): gray7 바탕 · white0 body04, 패딩 16×12, radius-md, 그림자 없음.
 * TabBar(62)를 가리지 않도록 하단 safe-area 위 96에 띄우고, 2초 뒤 사라집니다. 띄우기는 showToast()로.
 * MobileLayout이 한 번만 그립니다.
 */
export function Toaster() {
  const message = useToastStore((s) => s.message)
  const key = useToastStore((s) => s.key)
  const hide = useToastStore((s) => s.hide)

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(hide, TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [message, key, hide])

  return (
    <div
      role="status"
      aria-live="polite"
      className="px-layout-gutter pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-center"
    >
      {message && (
        <p
          key={key}
          className="bg-gray7 text-white0 text-body04 px-space-16 py-space-12 mb-24 rounded-md text-center break-keep"
        >
          {message}
        </p>
      )}
    </div>
  )
}
