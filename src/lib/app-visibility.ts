/*
 * 앱이 다시 화면에 보일 때(백그라운드 → 포그라운드) 알림받기.
 * 웹은 visibilitychange, 앱으로 감쌀 때는 Capacitor App 플러그인의 resume 이벤트로 바꿀 수 있도록 이 파일 안에서만 다룹니다.
 */

/** 다시 보이게 될 때마다 callback을 부릅니다. 해제 함수를 돌려줍니다. */
export function onAppForeground(callback: () => void) {
  const handle = () => {
    if (document.visibilityState === 'visible') callback()
  }
  document.addEventListener('visibilitychange', handle)
  return () => document.removeEventListener('visibilitychange', handle)
}
