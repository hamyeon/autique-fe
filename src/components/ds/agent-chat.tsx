import type { ButtonHTMLAttributes, FormEvent, InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

const FOCUS =
  'focus-visible:outline-primary1 focus-visible:outline-2 focus-visible:outline-offset-2'

/* 말풍선 공통: 패딩 12/8, radius-lg, body04. 줄바꿈 문자(\n)는 그대로 줄을 나눕니다. */
const BUBBLE =
  'px-space-12 py-space-8 text-body04 max-w-full rounded-lg break-keep whitespace-pre-line'
const AGENT = 'bg-grad-primary text-white0'
const USER = 'bg-primary3 text-black0'

export type SendButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

/**
 * 보내기 버튼(Figma SendButton 988:4879): 32 원, 바탕 grad/primary(bg-grad-primary), 화살표 Icon Send 20 primary4.
 * 겉 배치는 32 그대로 두고 음수 여백으로 터치 영역(44)만 넓힙니다. 기본 type="submit", aria-label="보내기".
 * 누르는 순간 입력 포커스가 빠지지 않아 키보드가 내려가지 않습니다.
 */
export function SendButton({
  className,
  type = 'submit',
  'aria-label': ariaLabel = '보내기',
  onPointerDown,
  ...props
}: SendButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.preventDefault()
        onPointerDown?.(e)
      }}
      className={cn(
        FOCUS,
        '-m-1.5 flex size-11 shrink-0 items-center justify-center rounded-full',
        className,
      )}
      {...props}
    >
      <span className="bg-grad-primary flex size-8 items-center justify-center rounded-full">
        <Icon name="Send" size={20} color="primary4" />
      </span>
    </button>
  )
}

export interface AgentInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'type' | 'onSubmit'
> {
  /** 제어형 입력값 */
  value: string
  /** 보내기 버튼 · 키보드 보내기를 눌렀을 때. 앞뒤 공백을 뺀 값이 비어 있으면 부르지 않습니다. */
  onSend: (value: string) => void
}

/**
 * 경매 AI Agent 입력창(Figma AgentInput 988:4868): 높이 50, 왼쪽 20 · 오른쪽 12, primary4 바탕,
 * 테두리 primary1, radius-full, body02(placeholder gray5) + 32 보내기 버튼(SendButton 988:4879).
 * Figma default · focused 모두 테두리 primary1이라 포커스로 모양이 바뀌지 않습니다. ref는 input으로 갑니다.
 */
export const AgentInput = forwardRef<HTMLInputElement, AgentInputProps>(function AgentInput(
  {
    value,
    onSend,
    disabled,
    className,
    placeholder = '원하는 조건을 자유롭게 입력해보세요',
    'aria-label': ariaLabel = '원하는 구매 조건',
    ...props
  },
  ref,
) {
  const canSend = !disabled && value.trim().length > 0

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (canSend) onSend(value.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'bg-primary4 border-primary1 pl-space-20 pr-space-12 gap-space-8 flex h-12.5 w-full items-center rounded-full border',
        className,
      )}
    >
      <input
        ref={ref}
        type="text"
        enterKeyHint="send"
        autoComplete="off"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="text-body02 text-black0 placeholder:text-gray5 caret-black0 min-w-0 flex-1 bg-transparent focus:outline-none"
        {...props}
      />
      {/* 모양은 Figma 한 가지 그대로 두고, 빈 입력에서는 눌러도 보내지 않습니다. */}
      <SendButton aria-disabled={!canSend} />
    </form>
  )
})

export interface AgentBubbleProps {
  /** agent = AI(그라데이션 바탕 · white0 글자, 왼쪽), user = 사용자(primary3 바탕 · black0 글자, 오른쪽) */
  from: 'agent' | 'user'
  children: ReactNode
  /** 넘기면 밑줄 링크 말풍선(예: '상품 상세 화면 바로 보러가기'). agent에서만 씁니다. */
  href?: string
  /** 넘기면 밑줄 버튼 말풍선(예: '조건 확인하고 찾기 시작하기'). 링크와 모양이 같고 화면 이동 대신 동작합니다. (DS 확장) */
  onClick?: () => void
  className?: string
}

/** 경매 AI Agent 대화 말풍선(Figma 경매 AI Agent 화면 989:5268 안 말풍선). 내용 폭에 맞고 묶음 폭을 넘지 않습니다. */
export function AgentBubble({ from, children, href, onClick, className }: AgentBubbleProps) {
  const tone = from === 'agent' ? AGENT : USER
  if (href) {
    return (
      <Link to={href} className={cn(BUBBLE, tone, FOCUS, 'underline', className)}>
        {children}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(BUBBLE, tone, FOCUS, 'text-left underline', className)}
      >
        {children}
      </button>
    )
  }
  return <p className={cn(BUBBLE, tone, className)}>{children}</p>
}

/**
 * AI가 일하는 중(Figma 988:5035): 그라데이션 말풍선 안 4px 흰 점 3개(사이 4), 패딩 12/10.
 * 점이 차례로 떠오르며 진해집니다(agent-typing-dots). 모션 줄이기 설정이면 Figma처럼 멈춰 있습니다.
 */
export function AgentTyping({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="AI가 처리하는 중"
      className={cn('bg-grad-primary px-space-12 flex rounded-lg py-2.5', className)}
    >
      <span className="agent-typing-dots gap-space-4 flex h-5.5 items-center">
        <span className="bg-white0 size-1 rounded-full" />
        <span className="bg-white0 size-1 rounded-full" />
        <span className="bg-white0 size-1 rounded-full" />
      </span>
    </div>
  )
}

export interface AgentMessageGroupProps {
  /** agent = 왼쪽 정렬 · 오른쪽 20 비움, user = 오른쪽 정렬 · 왼쪽 20 비움 */
  from: 'agent' | 'user'
  children: ReactNode
  className?: string
}

/** 한 번에 이어지는 말풍선 묶음(Figma Stack): 말풍선 사이 12 */
export function AgentMessageGroup({ from, children, className }: AgentMessageGroupProps) {
  return (
    <div
      className={cn(
        'gap-stack-related flex w-full flex-col',
        from === 'agent' ? 'pr-space-20 items-start' : 'pl-space-20 items-end',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** 대화 전체(Figma Body Stack): 묶음 사이 20. 새 말풍선은 화면 낭독기가 읽어 줍니다. */
export function AgentThread({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="log" aria-live="polite" className={cn('gap-space-20 flex flex-col', className)}>
      {children}
    </div>
  )
}
