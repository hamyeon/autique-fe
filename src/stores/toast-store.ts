import { create } from 'zustand'

interface ToastState {
  message: string | null
  /** 같은 문구를 다시 띄울 때도 표시 시간을 새로 시작하려고 매번 올립니다. */
  key: number
  show: (message: string) => void
  hide: () => void
}

/** 화면 아래 짧은 안내(Toaster) 상태. UI 상태라 Zustand에 둡니다. */
export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  key: 0,
  show: (message) => set((s) => ({ message, key: s.key + 1 })),
  hide: () => set({ message: null }),
}))

/** 짧은 안내를 잠깐 띄웁니다. 예: showToast('아직 준비 중이에요') */
export function showToast(message: string) {
  useToastStore.getState().show(message)
}

/** 아직 연결하지 않은 기능을 눌렀을 때 안내(DESIGN-CHANGES 기록 문구) */
export const PREPARING_MESSAGE = '아직 준비 중인 기능이에요'

export function showPreparingToast() {
  showToast(PREPARING_MESSAGE)
}
