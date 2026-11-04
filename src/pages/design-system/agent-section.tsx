import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  AgentBubble,
  AgentInput,
  AgentMessageGroup,
  AgentThread,
  AgentTyping,
  SendButton,
} from '@/components/ds'
import { Caption, Demo, Section } from './showcase'

export function AgentSection() {
  return (
    <Section id="agent" title="Agent">
      <SendButtonDemo />
      <AgentInputDemo />
      <AgentBubbleDemo />
      <AgentThreadDemo />
    </Section>
  )
}

/** 화면 바탕 grad/background(bg-grad-background)를 깔아 실제 화면처럼 봅니다. 실제 화면은 Screen background="grad". */
function AgentBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="bg-grad-background p-space-20 border-gray2 -mx-layout-gutter border-y">
      {children}
    </div>
  )
}

function SendButtonDemo() {
  const [count, setCount] = useState(0)
  return (
    <Demo
      title="SendButton"
      description="32 원 · 바탕 grad/primary(bg-grad-primary) · 화살표 Icon Send 20 primary4. 터치 영역은 44."
    >
      <div className="gap-space-12 flex items-center">
        <SendButton type="button" onClick={() => setCount((n) => n + 1)} />
        <Caption>누른 횟수: {count}</Caption>
      </div>
    </Demo>
  )
}

function AgentInputDemo() {
  const [value, setValue] = useState('')
  const [sent, setSent] = useState<string[]>([])

  return (
    <Demo
      title="AgentInput"
      description="높이 50 · radius-full · primary4 바탕 · 테두리 primary1. 빈 입력에서는 보내기를 눌러도 보내지 않아요."
    >
      <AgentBackdrop>
        <div className="gap-space-12 flex flex-col">
          <Caption>입력해 보기 (키보드 보내기 · 버튼 둘 다)</Caption>
          <AgentInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onSend={(text) => {
              setSent((prev) => [...prev, text])
              setValue('')
            }}
          />
          <Caption>입력값이 있는 상태</Caption>
          <AgentInput value="어쩌구저쩌구 적는 중" onChange={() => {}} onSend={() => {}} />
          <Caption>disabled (AI 처리 중 등)</Caption>
          <AgentInput value="" disabled onSend={() => {}} />
        </div>
      </AgentBackdrop>
      <Caption>
        보낸 문장: {sent.length > 0 ? sent.map((s) => `“${s}”`).join(', ') : '아직 없음'}
      </Caption>
    </Demo>
  )
}

function AgentBubbleDemo() {
  return (
    <Demo
      title="AgentBubble · AgentTyping"
      description="패딩 12/8 · radius-lg · body04. agent는 그라데이션(grad/primary, 승인된 예외), user는 primary3."
    >
      <AgentBackdrop>
        <div className="gap-space-12 flex flex-col">
          <Caption>agent</Caption>
          <AgentMessageGroup from="agent">
            <AgentBubble from="agent">AI가 경매를 검색하고 있습니다</AgentBubble>
          </AgentMessageGroup>
          <Caption>agent · 여러 줄 (\n으로 줄 나눔)</Caption>
          <AgentMessageGroup from="agent">
            <AgentBubble from="agent">
              {
                '조건에 맞는 “아식스 노바블라스트 6 블랙 - 2E 와이드” 경매를 찾았어요!\n오늘 오후 8시에 경매가 시작되고, 시작가는 50,000원이에요.'
              }
            </AgentBubble>
          </AgentMessageGroup>
          <Caption>agent · 링크 (누르면 /design-system으로 이동)</Caption>
          <AgentMessageGroup from="agent">
            <AgentBubble from="agent" href="/design-system">
              상품 상세 화면 바로 보러가기
            </AgentBubble>
          </AgentMessageGroup>
          <Caption>agent · 버튼 (누르면 동작, 링크와 같은 모양)</Caption>
          <BubbleButtonDemo />
          <Caption>user</Caption>
          <AgentMessageGroup from="user">
            <AgentBubble from="user">30만원 이하 뉴발란스 530 찾아줘</AgentBubble>
          </AgentMessageGroup>
          <Caption>typing (점이 차례로 떠오름 · 모션 줄이기 설정이면 멈춤)</Caption>
          <AgentMessageGroup from="agent">
            <AgentTyping />
          </AgentMessageGroup>
        </div>
      </AgentBackdrop>
    </Demo>
  )
}

const ONBOARDING = [
  'AI가 원하는 조건에 딱 맞는 상품을 찾고\n자동으로 입찰해요!',
  '예를 들어',
  '뉴발란스 530, A급 이상, 30만원 이하의 신발. 이번 달 내에 구매하고 싶어.',
  '와 같이 원하는 조건을 자유롭게 입력할 수 있어요.',
]

/** 대화 흐름 데모: 보내면 사용자 말풍선 → 입력 중 → (1.5초 뒤) AI 답장. API는 연결하지 않은 가짜 응답입니다. */
function AgentThreadDemo() {
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState<string[]>([])
  const [thinking, setThinking] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const send = (text: string) => {
    setMessages((prev) => [...prev, text])
    setValue('')
    setThinking(true)
    timer.current = setTimeout(() => setThinking(false), 1500)
  }

  return (
    <Demo
      title="AgentThread · AgentMessageGroup"
      description="묶음 사이 20, 묶음 안 말풍선 사이 12. agent 묶음은 오른쪽 20, user 묶음은 왼쪽 20을 비워요."
    >
      <AgentBackdrop>
        <div className="gap-space-20 flex flex-col">
          <AgentThread>
            <AgentMessageGroup from="agent">
              {ONBOARDING.map((text) => (
                <AgentBubble key={text} from="agent">
                  {text}
                </AgentBubble>
              ))}
            </AgentMessageGroup>
            {messages.map((text, i) => (
              <div key={i} className="gap-space-20 flex flex-col">
                <AgentMessageGroup from="user">
                  <AgentBubble from="user">{text}</AgentBubble>
                </AgentMessageGroup>
                <AgentMessageGroup from="agent">
                  <AgentBubble from="agent">AI가 경매를 검색하고 있습니다</AgentBubble>
                  {thinking && i === messages.length - 1 ? (
                    <AgentTyping />
                  ) : (
                    <AgentBubble from="agent">알맞은 상품을 찾으면 알림을 보내 드릴게요</AgentBubble>
                  )}
                </AgentMessageGroup>
              </div>
            ))}
          </AgentThread>
          <AgentInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onSend={send}
            disabled={thinking}
          />
        </div>
      </AgentBackdrop>
      <Caption>가짜 응답이에요. 실제 문장은 구매 목표 상태 · 참여 이력 · 알림으로 만들어요(명세).</Caption>
    </Demo>
  )
}

function BubbleButtonDemo() {
  const [count, setCount] = useState(0)
  return (
    <AgentMessageGroup from="agent">
      <AgentBubble from="agent" onClick={() => setCount((n) => n + 1)}>
        조건 확인하고 찾기 시작하기
      </AgentBubble>
      <Caption>누른 횟수: {count}</Caption>
    </AgentMessageGroup>
  )
}
