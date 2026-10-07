/*
 * 키-값 저장소. 지금은 Web Storage이고, 앱으로 감쌀 때 Capacitor Preferences로 바꿉니다.
 * 사파리 개인정보 보호 모드 등에서 접근이 막혀도 앱이 죽지 않도록 실패는 무시합니다.
 */

function createStorage(getStore: () => Storage) {
  return {
    getItem(key: string): string | null {
      try {
        return getStore().getItem(key)
      } catch {
        return null
      }
    },
    setItem(key: string, value: string) {
      try {
        getStore().setItem(key, value)
      } catch {
        /* 저장 실패는 무시 */
      }
    },
    removeItem(key: string) {
      try {
        getStore().removeItem(key)
      } catch {
        /* 삭제 실패는 무시 */
      }
    },
  }
}

/** 앱을 닫아도 남는 값(로그인 토큰 등) */
export const appStorage = createStorage(() => localStorage)

/** 탭(앱 세션)을 닫으면 사라지는 값. 새로고침에는 남습니다(작성 중인 경매 등록 등). */
export const sessionAppStorage = createStorage(() => sessionStorage)
