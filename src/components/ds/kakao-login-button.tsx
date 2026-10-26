import type { ButtonHTMLAttributes } from 'react'
import { usePressed } from '@/hooks/use-pressed'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

export interface KakaoLoginButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** 기본 '카카오로 계속하기' */
  label?: string
}

/**
 * 카카오 로그인 버튼(Figma KakaoLogin 948:6233). 카카오 브랜드 가이드 값을 DS 예외로 그대로 씁니다:
 * 높이 45, 반경 6, 배경 #FEE500, 문구 15px SemiBold 85% 검정(index.css의 kakao 토큰).
 * 로고 18은 왼쪽 14에 고정, 문구는 버튼 가운데. 폭은 부모를 채웁니다.
 * 눌림(조금 어둡게) · 비활성 모양은 Figma에 없어 정했습니다.
 */
export function KakaoLoginButton({
  label = '카카오로 계속하기',
  type = 'button',
  disabled,
  className,
  ...props
}: KakaoLoginButtonProps) {
  const { pressed, handlers } = usePressed()

  return (
    <button
      type={type}
      disabled={disabled}
      data-pressed={pressed && !disabled ? '' : undefined}
      {...(disabled ? {} : handlers)}
      className={cn(
        'bg-kakao-bg text-kakao text-kakao-label rounded-kakao focus-visible:outline-primary1 relative flex h-11.25 w-full items-center justify-center px-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 data-pressed:brightness-95',
        className,
      )}
      {...props}
    >
      <Icon name="kakao-symbol" className="absolute top-1/2 left-3.5 -translate-y-1/2" />
      {label}
    </button>
  )
}
