import type { ReactNode } from 'react'
import { Icon } from '@/components/ds'
import { Screen } from '@/layouts/screen'

/**
 * 로그인 화면 배치(Figma 로그인 948:6123): 헤더 없이 로고(231×60)와 아래 요소를
 * 늘어나는 여백 세 칸 사이에 둡니다(Figma Spacer 975:2407~2409). 고정 간격이 아니라 화면 높이 비율로 배치합니다.
 */
export function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <Screen top="none" className="items-center">
      <div className="flex-1" />
      <Icon name="autique-logo" label="Autique" className="*:h-15 *:w-57.75" />
      <div className="flex-1" />
      {children}
      <div className="flex-1" />
    </Screen>
  )
}
