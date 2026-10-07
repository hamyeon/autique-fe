import { useState } from 'react'
import {
  AmountStepper,
  BottomButtonBar,
  BottomSheet,
  InfoBanner,
  InfoRow,
  LoadMoreDownButton,
  PriceCard,
} from '@/components/ds'
import type { PriceResult } from '@/features/register/schemas'
import { REGISTER_BID_INCREMENT } from '@/features/register/schemas'
import { formatNumber, formatPrice } from '@/lib/format'
import { RegisterStepScreen } from '@/pages/register/register-step-page'
import { useRegisterNav } from '@/pages/register/use-register-nav'
import { useRegisterStore } from '@/stores/register-store'

/** 시세가 없으면 가격 계산 결과가 모두 0(사용자 결정). 이때는 직접 정해야 합니다. */
const hasMarketPrice = (price: PriceResult) => price.recommendedPrice > 0

/** 기준가를 고칠 수 있는 범위: AI 최소 ~ 최대 추천가. 시세가 없으면 0원 초과 아무 값 */
function priceBounds(price: PriceResult) {
  if (!hasMarketPrice(price)) return { min: REGISTER_BID_INCREMENT, max: undefined }
  return { min: price.minRecommendedPrice, max: price.maxRecommendedPrice }
}

const clamp = (value: number, min: number, max = Infinity) => Math.min(max, Math.max(min, value))

/**
 * 4/6 경매 시작가 설정(Figma 가격 설정 551:3084 · 펼침 551:3111 · 가격 수정 551:3237).
 * '기준가로 설정하기'는 AI 기준가를, '가격 수정하기' 시트는 최소~최대 추천가 안에서 고친 값을 기준가(= 경매 시작가)로 정합니다.
 */
export function RegisterStartPriceStep() {
  const { goNext } = useRegisterNav('4')
  const completeStep = useRegisterStore((s) => s.completeStep)
  const priceResult = useRegisterStore((s) => s.draft.priceResult)
  const savedPrice = useRegisterStore((s) => s.draft.sellingPrice)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editPrice, setEditPrice] = useState(0)

  // RegisterLayout이 3/6을 끝내야 들어오게 하므로 실제로는 항상 있습니다.
  if (!priceResult) return null

  const marketPrice = hasMarketPrice(priceResult)
  const { min, max } = priceBounds(priceResult)

  const setPrice = (sellingPrice: number) => {
    if (completeStep('4', { sellingPrice })) goNext()
  }

  const openSheet = () => {
    // 전에 고친 값이 있으면 그 값부터, 없으면 AI 기준가부터
    setEditPrice(clamp(savedPrice ?? priceResult.recommendedPrice, min, max))
    setSheetOpen(true)
  }

  return (
    <RegisterStepScreen
      step="4"
      nextDisabled={!marketPrice}
      onNext={() => setPrice(priceResult.recommendedPrice)}
      onSecondary={openSheet}
    >
      <div className="gap-stack-related flex flex-col">
        {marketPrice ? (
          <PriceCard
            tag="AI 적정 기준가"
            price={formatPrice(priceResult.recommendedPrice)}
            rows={[
              { label: '최소 추천가', value: formatPrice(priceResult.minRecommendedPrice) },
              { label: '최대 추천가', value: formatPrice(priceResult.maxRecommendedPrice) },
            ]}
          />
        ) : (
          <InfoBanner>
            비슷한 상품의 거래 정보가 없어 AI 기준가를 정하지 못했어요. 가격 수정하기에서 기준가를
            직접 정해주세요.
          </InfoBanner>
        )}
        {priceResult.reason && (
          <LoadMoreDownButton title="가격 산정 근거 자세히 보기">
            <p className="whitespace-pre-line">{priceResult.reason}</p>
          </LoadMoreDownButton>
        )}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="경매 시작가 수정"
        footer={
          <BottomButtonBar
            layout="single"
            primaryLabel="이 가격으로 설정하기"
            primaryDisabled={editPrice <= 0}
            onPrimary={() => {
              setSheetOpen(false)
              setPrice(editPrice)
            }}
          />
        }
      >
        <InfoBanner>
          {marketPrice
            ? 'AI가 판단한 적정 시세의 최소·최대 추천가의 범위 내에서 판매 기준가를 새롭게 설정할 수 있어요.'
            : '비슷한 상품의 거래 정보가 없어 기준가를 직접 정해야 해요.'}
        </InfoBanner>
        {marketPrice && (
          <InfoRow
            label="AI 추천 기준가"
            value={formatPrice(priceResult.recommendedPrice)}
            emphasis="primary"
          />
        )}
        <AmountStepper
          label="기준가"
          value={editPrice}
          onChange={setEditPrice}
          min={min}
          max={max}
          step={REGISTER_BID_INCREMENT}
          hint={`${formatNumber(REGISTER_BID_INCREMENT)}원 단위로 조정할 수 있어요. 기준가가 경매 시작가가 돼요.`}
        />
      </BottomSheet>
    </RegisterStepScreen>
  )
}
