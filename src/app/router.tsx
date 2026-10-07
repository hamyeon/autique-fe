import type { RouteObject } from 'react-router'
import { createBrowserRouter } from 'react-router'
import { MobileLayout } from '@/layouts/mobile-layout'
import { HomePage } from '@/pages/home/home-page'
import { NotFoundPage } from '@/pages/not-found-page'

/* 개발 모드에서만 등록합니다. 빌드 시 import.meta.env.DEV가 false로 바뀌어 페이지 코드가 번들에서 빠집니다. */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/design-system',
        lazy: () =>
          import('@/pages/design-system/design-system-page').then((m) => ({
            Component: m.DesignSystemPage,
          })),
      },
      {
        path: '/design-system/screen-demo',
        lazy: () =>
          import('@/pages/design-system/screen-demo-page').then((m) => ({
            Component: m.ScreenDemoPage,
          })),
      },
    ]
  : []

export const router = createBrowserRouter([
  {
    element: <MobileLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      ...devRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
