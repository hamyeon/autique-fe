import { Outlet, ScrollRestoration } from 'react-router'

/**
 * 모든 페이지를 감싸는 모바일 레이아웃.
 * - 데스크톱에서 열어도 휴대폰 폭(max-w-md)으로 가운데 정렬
 * - 100vh 대신 100dvh(min-h-dvh)로 iOS 주소창 높이 문제 회피
 * - safe-area와 화면 여백은 각 페이지의 Screen이 맡습니다.
 * - Screen의 sticky 헤더·하단 바가 동작하도록 overflow-hidden/auto를 두지 않습니다.
 * - ScrollRestoration: 뒤로 가기로 돌아오면 이전 스크롤 위치를, 새로 이동하면 맨 위를 보여줍니다.
 */
export function MobileLayout() {
  return (
    <div className="bg-gray1 min-h-dvh">
      <div className="bg-white0 relative mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  )
}
