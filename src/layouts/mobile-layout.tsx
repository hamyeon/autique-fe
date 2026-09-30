import { Outlet } from 'react-router'

/**
 * 모든 페이지를 감싸는 모바일 레이아웃.
 * - 데스크톱에서 열어도 휴대폰 폭(max-w-md)으로 가운데 정렬
 * - 100vh 대신 100dvh(min-h-dvh)로 iOS 주소창 높이 문제 회피
 * - 노치/홈 인디케이터 영역은 safe-area 여백으로 처리
 */
export function MobileLayout() {
  return (
    <div className="bg-muted min-h-dvh">
      <div className="bg-background pt-safe pb-safe relative mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
