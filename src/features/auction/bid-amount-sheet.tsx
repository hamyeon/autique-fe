import type { ReactNode } from 'react'
import type { InfoRowData } from '@/components/ds'
import { AmountStepper, BottomButtonBar, BottomSheet, InfoBanner, InfoRow } from '@/components/ds'

/** 시트 내용 대신 보여줄 안내(경매 종료 · 입찰할 수 없음). '확인'을 누르면 onClose */
export interface BidSheetNotice {
  title: string
  message: string
}

export interface BidAmountSheetProps {
  open: boolean
  onClose: () => void
  title: string
  /** InfoBanner 문구 */
  banner: ReactNode
  bannerTone?: 'default' | 'error'
  /** 배너 아래 정보 행(AI 적정 시세 · 현재가 등) */
  infoRow?: InfoRowData
  stepperLabel?: string
  value: number
  min: number
  step: number
  onChange: (value: number) => void
  /** 금액 때문에 실패: 스테퍼 테두리 error1 + 아래 문구 */
  amountError?: string | null
  /** 스테퍼 바로 아래 짧은 안내(최솟값이 올라갔을 때 등) */
  amountNotice?: string | null
  /** 스테퍼 아래 규칙 캡션 */
  caption?: ReactNode
  /** 요청 실패 문구. 캡션 아래 caption01 error1 */
  requestError?: string | null
  primaryLabel: string
  primaryDisabled?: boolean
  onSubmit: () => void
  /** 있으면 금액 입력 대신 안내만 보여줍니다. */
  notice?: BidSheetNotice | null
}

/**
 * 금액 입력 바텀시트 골격(design-system README '바텀시트'): InfoBanner → InfoRow → AmountStepper → 캡션 → BottomButtonBar.
 * 자동 입찰 상한가 시트와 직접 입찰 시트가 같이 씁니다. 요청 · 검증은 각 시트가 맡고, 여기는 그리기만 합니다.
 */
export function BidAmountSheet({
  open,
  onClose,
  title,
  banner,
  bannerTone = 'default',
  infoRow,
  stepperLabel,
  value,
  min,
  step,
  onChange,
  amountError,
  amountNotice,
  caption,
  requestError,
  primaryLabel,
  primaryDisabled,
  onSubmit,
  notice,
}: BidAmountSheetProps) {
  if (notice) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={notice.title}
        footer={<BottomButtonBar layout="single" primaryLabel="확인" onPrimary={onClose} />}
      >
        <p className="text-body05 text-gray6">{notice.message}</p>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <BottomButtonBar
          layout="single"
          primaryLabel={primaryLabel}
          primaryDisabled={primaryDisabled}
          onPrimary={onSubmit}
        />
      }
    >
      <InfoBanner tone={bannerTone}>{banner}</InfoBanner>
      {infoRow && <InfoRow {...infoRow} />}
      <AmountStepper
        label={stepperLabel}
        value={value}
        onChange={onChange}
        min={min}
        step={step}
        error={amountError ?? undefined}
        hint={amountNotice ?? undefined}
      />
      {caption && <p className="text-caption02 text-gray5">{caption}</p>}
      {requestError && (
        <p role="alert" className="text-caption01 text-error1">
          {requestError}
        </p>
      )}
    </BottomSheet>
  )
}
