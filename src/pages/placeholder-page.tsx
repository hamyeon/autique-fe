import { Header } from '@/components/ds'
import { EmptyState } from '@/components/feedback'
import { Screen } from '@/layouts/screen'

export interface PlaceholderPageProps {
  /** 헤더 제목 */
  title: string
}

/** 아직 만들지 않은 화면 자리(경로만 먼저 연결). 뒤로 가기 + "준비 중" 안내 */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <Screen header={<Header title={title} />}>
      <EmptyState title="아직 준비 중인 화면이에요" description="곧 이용할 수 있어요" />
    </Screen>
  )
}
