import type { RouteObject } from 'react-router'
import { createBrowserRouter } from 'react-router'
import { MobileLayout } from '@/layouts/mobile-layout'
import { AuctionResultPage } from '@/pages/auction-result/auction-result-page'
import { HomePage } from '@/pages/home/home-page'
import { LiveAuctionPage } from '@/pages/live-auction/live-auction-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { ProductDetailPage } from '@/pages/product-detail/product-detail-page'
import { RegisterAnalyzingPage } from '@/pages/register/register-analyzing-page'
import { RegisterCompletePage } from '@/pages/register/register-complete-page'
import { RegisterLayout } from '@/pages/register/register-layout'
import { RegisterExtraInfoStep } from '@/pages/register/register-extra-info-step'
import { RegisterPhotosStep } from '@/pages/register/register-photos-step'
import { RegisterProductInfoStep } from '@/pages/register/register-product-info-step'
import { RegisterReviewStep } from '@/pages/register/register-review-step'
import { RegisterScheduleStep } from '@/pages/register/register-schedule-step'
import { RegisterStartPriceStep } from '@/pages/register/register-start-price-step'

/* 개발 모드에서만 등록합니다. 빌드 시 import.meta.env.DEV가 false로 바뀌어 페이지 코드가 번들에서 빠집니다. */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/routes',
        lazy: () =>
          import('@/pages/dev/dev-routes-page').then((m) => ({ Component: m.DevRoutesPage })),
      },
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
      { path: '/products/:id', element: <ProductDetailPage /> },
      { path: '/auctions/:id/live', element: <LiveAuctionPage /> },
      { path: '/auctions/:id/result', element: <AuctionResultPage /> },
      {
        // 경매 등록. /register 와 없는 단계는 RegisterLayout이 첫 미완료 단계로 보냅니다.
        path: '/register',
        element: <RegisterLayout />,
        children: [
          { index: true },
          { path: '1', element: <RegisterPhotosStep /> },
          { path: 'analyzing', element: <RegisterAnalyzingPage /> },
          { path: '2', element: <RegisterProductInfoStep /> },
          { path: '3', element: <RegisterExtraInfoStep /> },
          { path: '4', element: <RegisterStartPriceStep /> },
          { path: '5', element: <RegisterScheduleStep /> },
          { path: '6', element: <RegisterReviewStep /> },
          { path: 'complete', element: <RegisterCompletePage /> },
          { path: '*' },
        ],
      },
      ...devRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
