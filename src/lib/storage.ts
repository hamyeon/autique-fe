/*
 * 키-값 저장소. 지금은 localStorage이고, 앱으로 감쌀 때 Capacitor Preferences로 바꿉니다.
 * 사파리 개인정보 보호 모드 등에서 접근이 막혀도 앱이 죽지 않도록 실패는 무시합니다.
 */
export const appStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* 저장 실패는 무시 */
    }
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* 삭제 실패는 무시 */
    }
  },
}
