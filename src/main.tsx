import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './index.css'

/**
 * 개발 모드에서만 MSW를 켭니다(src/mocks/config.ts의 mockEnabled와 같은 조건).
 * 빌드에서 msw가 번들에서 빠지도록 import.meta.env를 여기에 직접 씁니다.
 */
async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_MOCK === 'off') return
  const { worker } = await import('@/mocks/browser')
  // 목 핸들러가 없는 요청(이미지 · 폰트 등)은 그대로 네트워크로 보냅니다.
  await worker.start({ onUnhandledFrame: 'bypass' })
}

/** 개발 모드에서만 .env.local 의 개발용 토큰으로 로그인 상태를 채웁니다. 빌드에서는 이 import가 통째로 빠집니다. */
async function seedDevAuth() {
  if (!import.meta.env.DEV) return
  const { seedDevTokens } = await import('@/app/dev-auth')
  seedDevTokens()
}

Promise.all([seedDevAuth(), enableMocking()]).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  )
})
