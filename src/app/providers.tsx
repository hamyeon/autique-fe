import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router'
import { queryClient } from '@/lib/query-client'
import { router } from '@/app/router'
import { mockEnabled } from '@/mocks/config'
import { MockBadge } from '@/mocks/mock-badge'

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
      {mockEnabled && <MockBadge />}
    </QueryClientProvider>
  )
}
