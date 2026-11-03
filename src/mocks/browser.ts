import { setupWorker } from 'msw/browser'
import { mockAllEnabled } from '@/mocks/define'
import { handlers } from '@/mocks/handlers'

/* 처음 연 주소의 ?mock=all · ?mock=off를 앱이 뜰 때 바로 기록합니다(API를 부르지 않는 화면에서 켜도 유지되게). */
mockAllEnabled()

export const worker = setupWorker(...handlers)
