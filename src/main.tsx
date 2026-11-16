import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './index.css'

/**
 * MSW를 켭니다(src/mocks/config.ts의 mockEnabled와 같은 조건).
 * - 개발: VITE_MOCK=off가 아니면 켭니다.
 * - 빌드(Vercel 배포): VITE_MOCK=on일 때만 켭니다. passthrough만 실제 서버로 보내고 나머지는 목으로 처리합니다.
 * 꺼진 빌드에서 msw가 번들에서 빠지도록 import.meta.env를 여기에 직접 씁니다.
 */
async function enableMocking() {
  if (
    import.meta.env.DEV ? import.meta.env.VITE_MOCK === 'off' : import.meta.env.VITE_MOCK !== 'on'
  )
    return
  const [{ worker }, { ensureMockingActive, keepMockingActive }, { setBeforeRequest }] =
    await Promise.all([
      import('@/mocks/browser'),
      import('@/mocks/keep-active'),
      import('@/api/client'),
    ])
  // 목 핸들러가 없는 요청(이미지 · 폰트 등)은 그대로 네트워크로 보냅니다.
  await worker.start({ onUnhandledFrame: 'bypass' })
  // 브라우저가 쉬는 워커를 종료했다 다시 깨워도 이 화면에 목이 계속 적용되게(src/mocks/keep-active.ts)
  keepMockingActive()
  setBeforeRequest(ensureMockingActive)
}

/**
 * 개발 모드에서 주소에 ?dev-login 을 붙였을 때만 .env.local 의 개발용 토큰으로 로그인합니다(src/app/dev-auth.ts).
 * 처음 들어온 사람이 자동으로 로그인돼 있지 않게, 저절로 채우지 않습니다.
 * 빌드에서는 import.meta.env.DEV가 false라 이 import와 토큰이 번들에서 통째로 빠집니다.
 */
async function seedDevAuth() {
  if (!import.meta.env.DEV || !import.meta.env.VITE_DEV_REFRESH_TOKEN) return
  if (!new URLSearchParams(window.location.search).has('dev-login')) return
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
