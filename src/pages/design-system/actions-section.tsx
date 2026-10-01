import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { ButtonProps } from '@/components/ds'
import {
  BottomButtonBar,
  Button,
  Divider,
  FloatingActionButton,
  ImagePlaceholder,
  LoadMoreButton,
  LoadMoreDownButton,
} from '@/components/ds'
import type { BarLayout } from './bar-demo-data'
import { BAR_LABELS, BAR_LAYOUTS } from './bar-demo-data'
import { Caption, Demo, OptionGroup, Section } from './showcase'

const VARIANTS = ['primary', 'outline', 'danger'] as const
const VARIANT_LABEL: Record<(typeof VARIANTS)[number], string> = {
  primary: '입찰하기',
  outline: '상한가 수정',
  danger: '자동 입찰 취소',
}

const LAYOUT_DESC: Record<BarLayout, string> = {
  single: 'primary 1개 (78px)',
  double: 'primary + secondary 가로',
  triple: 'primary / secondary + danger (144px)',
  secondary: 'outline 1개 (예전 layout4)',
  primaryDanger: 'primary / danger 세로 (144px, 예전 layout5)',
}

export function ActionsSection() {
  return (
    <Section id="actions" title="Actions">
      <ButtonMatrixDemo />
      <ButtonCounterDemo />
      <BottomButtonBarDemo />
      <FloatingActionButtonDemo />
      <LoadMoreButtonDemo />
      <LoadMoreDownButtonDemo />
    </Section>
  )
}

function ButtonMatrixDemo() {
  return (
    <Demo
      title="Button · variant × 상태"
      description="54px, radius-md, head03. 눌림(primary)은 누르는 동안 + 최소 150ms, 비활성은 disabled. outline·danger의 눌림/비활성 모양은 Figma에 없습니다. DS 원본의 neutral은 쓰는 화면이 없어 뺐습니다."
    >
      <div className="gap-space-12 grid grid-cols-2">
        <Caption>기본</Caption>
        <Caption>disabled</Caption>
        {VARIANTS.flatMap((variant) =>
          [false, true].map((disabled) => (
            <div key={`${variant}-${disabled}`} className="gap-stack-tight flex flex-col">
              <Button variant={variant} disabled={disabled}>
                {VARIANT_LABEL[variant]}
              </Button>
              <Caption>{variant}</Caption>
            </div>
          )),
        )}
      </div>
      <div className="gap-space-8 flex flex-col">
        <Caption>block={'{false}'} · 인라인 폭</Caption>
        <div className="gap-space-8 flex">
          <Button variant="outline" block={false}>
            수정
          </Button>
          <Button variant="primary" block={false}>
            저장하기
          </Button>
        </div>
        <Caption>variant="secondary"는 outline의 예전 이름</Caption>
        <Button variant="secondary">문의하기</Button>
      </div>
    </Demo>
  )
}

function ButtonCounterDemo() {
  const [variant, setVariant] = useState<NonNullable<ButtonProps['variant']>>('primary')
  const [disabled, setDisabled] = useState<'false' | 'true'>('false')
  const [count, setCount] = useState(0)

  return (
    <Demo title="Button · 눌러보기" description="누를 때마다 횟수가 올라갑니다. disabled면 올라가지 않아야 합니다.">
      <Button
        variant={variant}
        disabled={disabled === 'true'}
        onClick={() => setCount((c) => c + 1)}
      >
        {count}번 눌렀어요
      </Button>
      <div className="gap-space-8 flex items-center justify-between">
        <Caption>onClick 호출 {count}회</Caption>
        <Button variant="outline" block={false} onClick={() => setCount(0)}>
          초기화
        </Button>
      </div>
      <div className="gap-form-field flex flex-col">
        <OptionGroup label="variant" options={VARIANTS} value={variant} onChange={setVariant} />
        <OptionGroup
          label="disabled"
          options={['false', 'true'] as const}
          value={disabled}
          onChange={setDisabled}
        />
      </div>
    </Demo>
  )
}

function BottomButtonBarDemo() {
  const navigate = useNavigate()
  const [primaryDisabled, setPrimaryDisabled] = useState<'false' | 'true'>('false')

  return (
    <Demo
      title="BottomButtonBar"
      description="좌우 20 · 상하 12 패딩. 확인 페이지 안에서는 고정 대신 박스 안에 그립니다. 한 바에 primary는 최대 1개."
    >
      <OptionGroup
        label="primaryDisabled (박스 예시 전체)"
        options={['false', 'true'] as const}
        value={primaryDisabled}
        onChange={setPrimaryDisabled}
      />
      <div className="gap-space-16 flex flex-col">
        {BAR_LAYOUTS.map((layout) => (
          <div key={layout} className="gap-space-8 flex flex-col">
            <Caption>
              layout="{layout}" · {LAYOUT_DESC[layout]}
            </Caption>
            {/* 화면 하단을 흉내 낸 박스. 바의 좌우 패딩이 화면 폭 기준이므로 gutter만큼 밖으로 꺼냅니다. */}
            <div className="border-gray2 bg-gray1 -mx-layout-gutter flex flex-col border-y">
              <div className="h-space-24" />
              <BottomButtonBar
                layout={layout}
                {...BAR_LABELS}
                primaryDisabled={primaryDisabled === 'true'}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="gap-space-8 flex flex-col">
        <Caption>예전 이름: layout="layout4"(= secondary) · layout="layout5"(= primaryDanger)</Caption>
        {(['layout4', 'layout5'] as const).map((layout) => (
          <div key={layout} className="border-gray2 bg-gray1 -mx-layout-gutter border-y">
            <BottomButtonBar layout={layout} {...BAR_LABELS} />
          </div>
        ))}
      </div>

      <div className="gap-space-8 flex flex-col">
        <LoadMoreButton onClick={() => navigate('/design-system/screen-demo')}>
          실제 화면처럼 하단 고정 보기 (Screen 데모)
        </LoadMoreButton>
        <Caption>Screen의 bottom 슬롯에 sticky로 붙고 pb-safe가 적용된 모습을 확인합니다.</Caption>
      </div>
    </Demo>
  )
}

function FloatingActionButtonDemo() {
  const [count, setCount] = useState(0)

  return (
    <Demo
      title="FloatingActionButton"
      description="48px 알약, black0 + 흰 Add 20 + body03. 실제로는 TabBar 위 오른쪽, 가장자리에서 20px."
    >
      <div className="border-gray2 relative overflow-hidden rounded-sm border">
        <ul className="gap-space-12 p-space-12 flex flex-col">
          {[0, 1, 2].map((i) => (
            <li key={i} className="gap-space-12 flex items-center">
              <ImagePlaceholder width={64} ratio={1} />
              <div className="gap-space-8 flex flex-1 flex-col">
                <div className="bg-gray1 h-space-12 w-3/4 rounded-sm" />
                <div className="bg-gray1 h-space-12 w-1/2 rounded-sm" />
              </div>
            </li>
          ))}
        </ul>
        <div className="h-space-32" />
        <FloatingActionButton
          onClick={() => setCount((c) => c + 1)}
          className="right-space-20 bottom-space-20 absolute"
        />
      </div>
      <Caption>onClick 호출 {count}회</Caption>
      <div className="flex">
        <FloatingActionButton onClick={() => setCount((c) => c + 1)}>경매 열기</FloatingActionButton>
      </div>
      <Caption>children으로 라벨 변경</Caption>
    </Demo>
  )
}

function LoadMoreButtonDemo() {
  const [count, setCount] = useState(0)

  return (
    <Demo
      title="LoadMoreButton"
      description="다른 화면으로 넘어가 자세히 보는 행 버튼. 오른쪽 16px 화살표."
    >
      <LoadMoreButton onClick={() => setCount((c) => c + 1)}>
        실시간 경매 상황 자세히 보기
      </LoadMoreButton>
      <Caption>onClick 호출 {count}회</Caption>
    </Demo>
  )
}

const WHY =
  '당근마켓과 후르츠패밀리의 Dunk Low 중고 매물 116건을 분석했어요. 상품 상태가 A급인 점을 반영해 시세의 95% 수준으로 조정했어요.'

function LoadMoreDownButtonDemo() {
  const [open, setOpen] = useState(false)

  return (
    <Demo
      title="LoadMoreDownButton"
      description="같은 자리에서 펼쳐지는 박스. 열리면 12px 아래 caption02 gray5 본문, 화살표가 위로 뒤집힙니다."
    >
      <div className="gap-space-8 flex flex-col">
        <Caption>비제어형 · 닫힘으로 시작</Caption>
        <LoadMoreDownButton title="가격 산정 근거 자세히 보기">{WHY}</LoadMoreDownButton>
      </div>
      <div className="gap-space-8 flex flex-col">
        <Caption>비제어형 · defaultOpen</Caption>
        <LoadMoreDownButton title="가격 산정 근거 자세히 보기" defaultOpen>
          {WHY}
        </LoadMoreDownButton>
      </div>
      <Divider />
      <div className="gap-space-8 flex flex-col">
        <Caption>제어형 · open={String(open)} (바깥 버튼으로도 열고 닫기)</Caption>
        <LoadMoreDownButton title="가격 산정 근거 자세히 보기" open={open} onToggle={setOpen}>
          {WHY}
        </LoadMoreDownButton>
        <Button
          variant="outline"
          block={false}
          onClick={() => setOpen((o) => !o)}
          className="self-start"
        >
          {open ? '닫기' : '열기'}
        </Button>
      </div>
    </Demo>
  )
}
