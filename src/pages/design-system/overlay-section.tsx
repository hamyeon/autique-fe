import { useState } from 'react'
import {
  AmountStepper,
  BottomButtonBar,
  BottomSheet,
  Button,
  InfoBanner,
  InfoRow,
} from '@/components/ds'
import { formatPrice } from '@/lib/format'
import { Caption, Demo, Section } from './showcase'

const CURRENT = 105000
const MIN_CAP = CURRENT + 5000

export function OverlaySection() {
  return (
    <Section id="overlay" title="Overlay">
      <BottomSheetDemo />
      <LongSheetDemo />
      <InlineSheetDemo />
    </Section>
  )
}

/** README 바텀시트 구성: InfoBanner → 정보 행 → AmountStepper → 캡션 → BottomButtonBar */
function BottomSheetDemo() {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)
  /* 시트 안에서 바꾸는 값. 예약하기 전에 닫으면 버립니다. */
  const [draft, setDraft] = useState(MIN_CAP)

  const openSheet = () => {
    setDraft(saved ?? MIN_CAP)
    setOpen(true)
  }

  return (
    <Demo
      title="BottomSheet"
      description="vaul 동작 + DS 겉모양: black0 90% 딤, 위쪽 radius-lg, 60×4 핸들, 내용 좌우 20 · 간격 12. 딤 누르기 · 아래로 끌기 · Esc로 닫혀요."
    >
      <Button onClick={openSheet}>자동 입찰 상한가 설정 열기</Button>
      <Caption>
        예약된 상한가: {saved === null ? '없음' : formatPrice(saved)} (예약 없이 닫으면 바꾼 값은
        버려져요)
      </Caption>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="자동 입찰 상한가 설정"
        footer={
          <BottomButtonBar
            primaryLabel="자동 입찰 예약"
            onPrimary={() => {
              setSaved(draft)
              setOpen(false)
            }}
          />
        }
      >
        <InfoBanner>
          설정한 금액은 실제 결제 금액이 아니에요. 다른 입찰자가 나타나면 5,000원씩 자동으로
          입찰하고, 이때 설정한 상한가를 넘지 않아요.
        </InfoBanner>
        <InfoRow label="현재가" value={formatPrice(CURRENT)} />
        <AmountStepper
          label="내 자동 입찰 상한가"
          value={draft}
          onChange={setDraft}
          min={MIN_CAP}
          max={300000}
        />
        <p className="text-caption02 text-gray5">
          상한가는 현재가보다 5,000원 이상 높게 정할 수 있어요. 입찰은 5,000원씩 올라가고, 실제
          결제 금액은 경쟁 상황에 따라 달라져요.
        </p>
      </BottomSheet>
    </Demo>
  )
}

function LongSheetDemo() {
  const [open, setOpen] = useState(false)

  return (
    <Demo
      title="BottomSheet · 긴 내용"
      description="시트는 화면 높이의 11/12까지만 올라오고, 넘치는 내용은 시트 안에서 스크롤돼요. 버튼 바는 아래에 남아요."
    >
      <Button variant="outline" onClick={() => setOpen(true)}>
        긴 내용 시트 열기
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="경매 참여 안내"
        footer={
          <BottomButtonBar
            layout="double"
            primaryLabel="확인"
            secondaryLabel="닫기"
            onPrimary={() => setOpen(false)}
            onSecondary={() => setOpen(false)}
          />
        }
      >
        {Array.from({ length: 14 }, (_, i) => (
          <InfoRow key={i} label={`안내 ${i + 1}`} value="스크롤해서 끝까지 보세요" emphasis="regular" />
        ))}
        <InfoBanner>마지막 줄이에요. 버튼 바에 가려지지 않아야 해요.</InfoBanner>
      </BottomSheet>
    </Demo>
  )
}

function InlineSheetDemo() {
  return (
    <Demo
      title="BottomSheet · inline"
      description="미리보기·문서용: 포털과 딤 없이 그 자리에 시트만 그려요."
    >
      <div className="-mx-layout-gutter bg-gray1 pt-space-24">
        <BottomSheet
          inline
          title="직접 입찰 가격 설정"
          footer={<BottomButtonBar primaryLabel="입찰하기" />}
        >
          <InfoRow label="최소 다음 입찰가" value={formatPrice(110000)} />
          <AmountStepper label="입찰 금액" defaultValue={110000} min={110000} />
        </BottomSheet>
      </div>
    </Demo>
  )
}
