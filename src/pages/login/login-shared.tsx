import type { ReactNode } from 'react'
import confetti from '@/assets/illustrations/img_login_confetti.svg'
import sneaker from '@/assets/illustrations/img_shoe_side_3d.png'
import { Icon } from '@/components/ds'
import { Screen } from '@/layouts/screen'

/**
 * 로그인 화면 배치(Figma 로그인 1198:7021): 헤더 없이 grad/primary 바탕 위에 흰 로고(231×60) → 운동화 일러스트 → 아래 요소.
 * 고정 간격 대신 화면 높이 비율로 배치합니다(사용자 결정). Figma 여백 142 · 47 · 48 · 190을 3 : 1 : 1 : 4로 나눕니다.
 * plain은 흰 바탕 + 검정 로고만(일러스트 없음). 그라데이션 위에서 읽기 어려운 에러 화면(카카오 콜백)에 씁니다.
 */
export function LoginLayout({
  children,
  tone = 'brand',
}: {
  children: ReactNode
  tone?: 'brand' | 'plain'
}) {
  if (tone === 'plain') {
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
  return (
    <Screen top="none" background="primary" className="items-center">
      <div className="flex-3" />
      <Icon name="autique-logo-white" label="Autique" className="*:h-15 *:w-57.75" />
      <div className="flex-1" />
      <LoginArtwork />
      <div className="flex-1" />
      {children}
      <div className="flex-4" />
    </Screen>
  )
}

/**
 * 운동화 + 흩날리는 조각(Figma 1198:7046 · 1198:7047). 215 정사각 안에 운동화(191)를 8° 기울여 가운데 두고,
 * 조각 그룹(256×134)을 왼쪽 19 · 위 36에 겹칩니다. 장식이라 읽지 않습니다.
 */
function LoginArtwork() {
  return (
    <div aria-hidden className="relative size-54 shrink-0">
      <img
        src={sneaker}
        alt=""
        draggable={false}
        className="absolute inset-0 m-auto size-47.75 rotate-8 object-cover"
      />
      <img
        src={confetti}
        alt=""
        draggable={false}
        className="absolute top-9 -left-4.75 h-33.5 w-64"
      />
    </div>
  )
}
