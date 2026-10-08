import { onAppForeground } from '@/lib/app-visibility'

/*
 * MSW 서비스 워커가 이 화면을 '목 처리할 화면'으로 계속 기억하게 합니다.
 *
 * 워커는 목을 적용할 화면 목록(activeClientIds)을 메모리에만 두고, 화면은 앱 시작 때 한 번만 등록합니다(MOCK_ACTIVATE).
 * 휴대폰에서 카메라 · 사진 선택 앱으로 가거나 앱을 오래 백그라운드에 두면 브라우저가 쉬는 워커를 종료하는데,
 * 다시 깨어난 워커는 목록이 비어 있어 모든 요청을 실제 서버로 그냥 보냅니다.
 * → 실서버에 없는 목 전용 API(홈 목록 GET /api/auctions 등)가 404로 실패해 '불러오지 못했어요'가 뜹니다.
 *
 * 그래서 요청 직전(최근에 확인했으면 건너뜀)과 앱이 다시 보일 때 등록을 다시 보내고 응답을 기다립니다. 같은 화면을 여러 번 등록해도 괜찮습니다.
 */

/** 이 시간 안에 확인했으면 다시 묻지 않습니다(요청마다 왕복하지 않게). 워커는 보통 30초 넘게 쉬어야 종료됩니다. */
const CONFIRM_TTL_MS = 3000
/** 워커가 응답하지 않아도 요청을 막지 않도록 */
const CONFIRM_TIMEOUT_MS = 1000

let confirmedAt = 0
let pending: Promise<void> | null = null

export function ensureMockingActive(): Promise<void> {
  const controller = navigator.serviceWorker?.controller
  if (!controller || Date.now() - confirmedAt < CONFIRM_TTL_MS) return Promise.resolve()

  pending ??= new Promise<void>((resolve) => {
    const finish = () => {
      navigator.serviceWorker.removeEventListener('message', onMessage)
      clearTimeout(timer)
      pending = null
      resolve()
    }
    const onMessage = (event: MessageEvent) => {
      if ((event.data as { type?: string } | null)?.type !== 'MOCKING_ENABLED') return
      confirmedAt = Date.now()
      finish()
    }
    const timer = setTimeout(finish, CONFIRM_TIMEOUT_MS)
    navigator.serviceWorker.addEventListener('message', onMessage)
    controller.postMessage('MOCK_ACTIVATE')
  })
  return pending
}

/** 앱이 다시 보이면 워커가 종료됐을 수 있으니 바로 다시 등록합니다. */
export function keepMockingActive() {
  confirmedAt = Date.now() // worker.start()가 막 등록함
  onAppForeground(() => {
    confirmedAt = 0
    void ensureMockingActive()
  })
}
