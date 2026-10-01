import { useState } from 'react'
import type { ChipKind } from '@/components/ds'
import { Chip, ImagePlaceholder, InfoBanner, PageIndicator, ProgressBar, Tag } from '@/components/ds'
import { formatNumber } from '@/lib/format'
import { Caption, Demo, OptionGroup, Section } from './showcase'

/* README 표 순서 그대로: kind · 예시 문구 · 의미 */
const CHIP_KINDS: { kind: ChipKind; text: string; meaning: string }[] = [
  { kind: 'plan', text: '경매 예정', meaning: '경매 예정 · 낙찰' },
  { kind: 'finish', text: '경매 종료', meaning: '경매 종료' },
  { kind: 'live', text: 'LIVE', meaning: '진행 중인 실시간 경매' },
  { kind: 'level', text: 'A등급', meaning: '상품 등급' },
  { kind: 'best', text: '최고가', meaning: '내가 최고가' },
  { kind: 'worst', text: '최고가', meaning: '다른 사람이 최고가, 내가 밀림' },
  { kind: 'caution', text: '결제 기한 만료', meaning: '문제 상태' },
  { kind: 'recommend', text: '차순위 구매 대기', meaning: '기회' },
]

export function StatusSection() {
  return (
    <Section id="status" title="Status">
      <ChipDemo />
      <TagDemo />
      <PageIndicatorDemo />
      <ProgressBarDemo />
      <InfoBannerDemo />
    </Section>
  )
}

function ChipDemo() {
  return (
    <Demo title="Chip" description="22px 높이 상태 라벨(label01). 텍스트는 명사형 2~8자.">
      <ul className="gap-space-8 flex flex-col">
        {CHIP_KINDS.map(({ kind, text, meaning }) => (
          <li key={kind} className="gap-space-12 flex items-center">
            <div className="flex w-28 shrink-0">
              <Chip kind={kind}>{text}</Chip>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-body04 text-black0">{kind}</span>
              <Caption>{meaning}</Caption>
            </div>
          </li>
        ))}
      </ul>
      <div className="gap-space-8 flex flex-col">
        <Caption>기본 조합: 상태 칩 + 등급 칩 (stack-tight 4px)</Caption>
        <div className="gap-space-8 flex flex-col">
          {(['plan', 'live', 'finish'] as const).map((kind) => (
            <div key={kind} className="gap-stack-tight flex">
              <Chip kind={kind}>{CHIP_KINDS.find((c) => c.kind === kind)!.text}</Chip>
              <Chip kind="level">A등급</Chip>
            </div>
          ))}
        </div>
      </div>
    </Demo>
  )
}

const TAG_TEXT = {
  primary: { md: 'AI 적정 시세', sm: '최고 입찰자 · 나' },
  error: { md: '상한가 초과', sm: '상한가 초과' },
} as const

function TagDemo() {
  return (
    <Demo
      title="Tag"
      description="흰 바탕 아웃라인 태그. md = 카드 머리 AI 태그, sm = 상태 배지. 채워진 라벨은 Chip."
    >
      <div className="gap-space-12 grid grid-cols-2">
        {(['primary', 'error'] as const).flatMap((tone) =>
          (['md', 'sm'] as const).map((size) => (
            <div key={`${tone}-${size}`} className="gap-space-8 flex flex-col items-start">
              <Tag tone={tone} size={size}>
                {TAG_TEXT[tone][size]}
              </Tag>
              <Caption>
                tone="{tone}" · size="{size}"
              </Caption>
            </div>
          )),
        )}
      </div>
    </Demo>
  )
}

const PAGE_COUNTS = [2, 3, 4, 5, 6] as const

function PageIndicatorDemo() {
  const [count, setCount] = useState<(typeof PAGE_COUNTS)[number]>(4)
  const [current, setCurrent] = useState(1)
  const page = Math.min(current, count - 1)

  return (
    <Demo
      title="PageIndicator"
      description="8px 점 + 현재 위치 32×8 알약. 모두 gray3이고 폭으로만 구분합니다."
    >
      {/* 실제 쓰임처럼 정사각 이미지 하단 20px 위 가운데에 둡니다. */}
      <div className="relative">
        <ImagePlaceholder ratio={1} />
        <div className="bottom-space-20 absolute inset-x-0 flex justify-center">
          <PageIndicator count={count} current={page} />
        </div>
      </div>
      <div className="gap-space-8 flex items-center">
        <StepButton
          label="이전"
          disabled={page === 0}
          onClick={() => setCurrent(page - 1)}
        />
        <span className="text-body04 text-black0 flex-1 text-center">
          current {page} ({page + 1} / {count})
        </span>
        <StepButton
          label="다음"
          disabled={page === count - 1}
          onClick={() => setCurrent(page + 1)}
        />
      </div>
      <OptionGroup label="count" options={PAGE_COUNTS} value={count} onChange={setCount} />
    </Demo>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border-gray2 text-body04 text-black0 disabled:text-gray3 disabled:border-gray1 px-space-16 h-11 rounded-sm border"
    >
      {label}
    </button>
  )
}

const CAP = 120000

function ProgressBarDemo() {
  const [percent, setPercent] = useState(87.5)
  const value = percent / 100
  const price = Math.round((CAP * value) / 1000) * 1000

  return (
    <Demo title="ProgressBar" description="6px 막대, value 0~1. 폭은 부모를 채우고 캡션은 소비 측이 붙입니다.">
      <div className="gap-space-8 flex flex-col">
        <ProgressBar value={value} label="상한가 대비 현재가" />
        <Caption className="text-gray4">
          현재가 {formatNumber(price)} / 상한가 {formatNumber(CAP)}
        </Caption>
      </div>
      <label className="gap-form-label flex flex-col">
        <span className="text-body03 text-black0">value {value.toFixed(3)}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="accent-primary1 h-11 w-full"
        />
      </label>
      <div className="gap-space-8 flex flex-wrap">
        {[0, 30, 87.5, 100].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPercent(p)}
            className="border-gray2 text-body04 text-black0 px-space-12 h-11 rounded-sm border"
          >
            {p / 100}
          </button>
        ))}
      </div>
    </Demo>
  )
}

function InfoBannerDemo() {
  return (
    <Demo
      title="InfoBanner"
      description="18px 정보 아이콘 + caption02 본문(gray6), 12px 패딩. 한 화면에 하나만 둡니다."
    >
      <div className="gap-space-8 flex flex-col">
        <Caption>tone="default" · 짧은 문장</Caption>
        <InfoBanner>경매 시작 전에도 자유롭게 자동 입찰을 예약할 수 있어요.</InfoBanner>
      </div>
      <div className="gap-space-8 flex flex-col">
        <Caption>tone="default" · 긴 문장(줄바꿈)</Caption>
        <InfoBanner>
          자동 입찰은 다른 입찰자가 입찰할 때마다 최소 입찰 단위만큼 자동으로 올려 입찰해요.
          설정한 상한가를 넘으면 더 이상 입찰하지 않아요.
        </InfoBanner>
      </div>
      <div className="gap-space-8 flex flex-col">
        <Caption>tone="error" · 짧은 문장</Caption>
        <InfoBanner tone="error">결제 기한이 지나 낙찰이 취소되었어요.</InfoBanner>
      </div>
      <div className="gap-space-8 flex flex-col">
        <Caption>tone="error" · 긴 문장(줄바꿈)</Caption>
        <InfoBanner tone="error">
          다른 입찰자가 내 자동 입찰 상한가를 초과하는 금액을 입찰하여 자동 입찰이 종료되었어요.
          계속 참여하려면 상한가를 수정해 주세요.
        </InfoBanner>
      </div>
    </Demo>
  )
}
