import { Screen } from '@/layouts/screen'
import { ActionsSection } from './actions-section'
import { AuctionSection } from './auction-section'
import { FeedbackSection } from './feedback-section'
import { FormsSection } from './forms-section'
import { FoundationsSection } from './foundations-section'
import { NavigationSection } from './navigation-section'
import { OverlaySection } from './overlay-section'
import { StatusSection } from './status-section'

const GROUPS = [
  { id: 'foundations', title: 'Foundations' },
  { id: 'status', title: 'Status' },
  { id: 'actions', title: 'Actions' },
  { id: 'forms', title: 'Forms' },
  { id: 'navigation', title: 'Navigation' },
  { id: 'auction', title: 'Auction' },
  { id: 'overlay', title: 'Overlay' },
  { id: 'feedback', title: 'Feedback' },
] as const

/** 개발 모드 전용 DS 컴포넌트 확인 페이지 (/design-system) */
export function DesignSystemPage() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const header = (
    <nav aria-label="섹션 바로가기" className="border-gray1 border-b">
      <div className="px-layout-gutter pt-layout-top gap-stack-tight flex flex-col">
        <h1 className="text-head01 text-black0">Design System</h1>
        <p className="text-caption02 text-gray4">개발 모드 전용 · design-system/ 기준</p>
      </div>
      <ul className="gap-space-8 px-layout-gutter py-space-8 flex overflow-x-auto">
        {GROUPS.map((group) => (
          <li key={group.id} className="shrink-0">
            <button
              type="button"
              onClick={() => scrollTo(group.id)}
              className="border-gray2 text-body04 text-black0 px-space-12 h-11 rounded-full border"
            >
              {group.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )

  return (
    <Screen header={header} top="none">
      <div className="divide-gray1 flex flex-col divide-y">
        <FoundationsSection />
        <StatusSection />
        <ActionsSection />
        <FormsSection />
        <NavigationSection />
        <AuctionSection />
        <OverlaySection />
        <FeedbackSection />
      </div>
    </Screen>
  )
}
