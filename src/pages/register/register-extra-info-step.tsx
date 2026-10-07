import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import type { ComponentStatus } from '@/api/schemas/common'
import { BottomButtonBar, SegmentedControl, Textarea } from '@/components/ds'
import { ErrorState, LoadingIllustration } from '@/components/feedback'
import { ANALYSIS_MIN_STAGE_MS } from '@/features/register/analysis'
import type { RegisterFailure } from '@/features/register/errors'
import { toRegisterFailure } from '@/features/register/errors'
import { calculateRegisterPrice } from '@/features/register/pricing'
import type { RegisterDraft } from '@/features/register/schemas'
import type { ExtraInfoForm } from '@/features/register/schemas'
import { COMPONENT_STATUS_LABELS, extraInfoFormSchema } from '@/features/register/schemas'
import { Screen } from '@/layouts/screen'
import { RegisterStepScreen } from '@/pages/register/register-step-page'
import { useRegisterNav } from '@/pages/register/use-register-nav'
import { useRegisterStore } from '@/stores/register-store'

type ExtraInfoInput = z.input<typeof extraInfoFormSchema>

/** 칸 문구 → componentStatus */
const COMPONENT_BY_LABEL = Object.fromEntries(
  Object.entries(COMPONENT_STATUS_LABELS).map(([status, label]) => [label, status]),
) as Record<string, ComponentStatus>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 3/6 추가 정보 입력(Figma 551:2407). 구성품 여부(필수) · 판매자 설명(선택).
 * 'AI 기준가 분석하기' → POST /api/products/calculate-price(AI 가격 로딩 화면) → 4/6.
 * 가격에 영향을 주는 값(2/6 상품 정보 · 구성품)이 그대로면 받아 둔 결과를 다시 씁니다(세션당 1회 계산 · src/features/register/pricing.ts).
 */
export function RegisterExtraInfoStep() {
  const { goNext: goNextStep, goTo } = useRegisterNav('3')
  const update = useRegisterStore((s) => s.update)
  const completeStep = useRegisterStore((s) => s.completeStep)
  const uncompleteStep = useRegisterStore((s) => s.uncompleteStep)
  const [pricing, setPricing] = useState(false)
  const [failure, setFailure] = useState<RegisterFailure | null>(null)
  /** 계산 중에 화면을 떠났으면 결과만 저장하고 이동하지 않습니다. */
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const {
    control,
    register,
    handleSubmit,
    subscribe,
    formState: { isValid },
  } = useForm<ExtraInfoInput, unknown, z.output<typeof extraInfoFormSchema>>({
    resolver: zodResolver(extraInfoFormSchema),
    mode: 'onTouched',
    defaultValues: {
      componentStatus: useRegisterStore.getState().draft.componentStatus,
      sellerDescription: useRegisterStore.getState().draft.sellerDescription ?? '',
    },
  })

  /* 고친 값은 바로 저장합니다. 구성품이 바뀌면 가격을 다시 계산해야 합니다(판매자 설명은 가격과 무관). */
  useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: ({ values, type, name }) => {
        if (type !== 'change') return
        const patch = values as Partial<RegisterDraft>
        update(name === 'componentStatus' ? { ...patch, priceResult: undefined } : patch)
      },
    })
  }, [subscribe, update])

  const runPricing = async (values: ExtraInfoForm) => {
    // 가격에 영향을 주는 값이 그대로면 받아 둔 결과를 다시 씁니다(다시 부르면 40003).
    const saved = useRegisterStore.getState().draft.priceResult
    if (saved) {
      if (completeStep('3', { ...values, priceResult: saved })) goNextStep()
      return
    }

    setFailure(null)
    setPricing(true)
    const startedAt = Date.now()
    try {
      const priceResult = await calculateRegisterPrice(values)
      // 응답이 빨라도 로딩 화면이 깜빡이듯 지나가지 않게
      await wait(Math.max(0, ANALYSIS_MIN_STAGE_MS - (Date.now() - startedAt)))
      if (!completeStep('3', { ...values, priceResult })) return
      // 가격을 새로 계산했으니 4/6에서 기준가를 다시 확인받습니다(고친 기준가는 시트의 시작값으로 남김).
      uncompleteStep('4')
      if (mounted.current) goNextStep()
    } catch (error) {
      if (mounted.current) setFailure(toRegisterFailure(error))
    } finally {
      if (mounted.current) setPricing(false)
    }
  }

  /** 검증을 통과하면 가격 계산(handleSubmit은 누를 때만 부릅니다) */
  const goNext = () => void handleSubmit(runPricing)()

  if (pricing) return <PriceLoading />
  if (failure) {
    return (
      <PriceFailure
        failure={failure}
        onRetry={goNext}
        onClose={() => setFailure(null)}
        onFix={(step) => {
          setFailure(null)
          goTo(step)
        }}
      />
    )
  }

  return (
    <RegisterStepScreen step="3" nextDisabled={!isValid} onNext={goNext}>
      <div className="gap-form-field flex flex-col">
        <Controller
          control={control}
          name="componentStatus"
          render={({ field, fieldState }) => (
            <SegmentedControl
              ref={field.ref}
              label="구성품 여부"
              options={Object.values(COMPONENT_STATUS_LABELS)}
              value={field.value ? COMPONENT_STATUS_LABELS[field.value] : ''}
              onChange={(label) => field.onChange(COMPONENT_BY_LABEL[label])}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Textarea
          label="판매자 설명"
          placeholder="상품에 대한 추가 정보가 있다면 입력해주세요."
          {...register('sellerDescription')}
        />
      </div>
    </RegisterStepScreen>
  )
}

/** AI 가격 로딩(Figma 694:2795): 분석 로딩과 같은 일러스트 + 문구, 가운데 정렬 */
function PriceLoading() {
  return (
    <Screen className="items-center justify-center">
      <div className="gap-space-24 flex flex-col items-center" role="status" aria-live="polite">
        <LoadingIllustration />
        <div className="gap-stack-tight flex flex-col items-center text-center">
          <p className="text-body01 text-black0">
            <span className="block">상품 정보를 바탕으로</span>
            <span className="block">AI 기준가를 설정하는 중이에요</span>
          </p>
          <p className="text-body04 text-gray5">잠시만 기다려주세요</p>
        </div>
      </div>
    </Screen>
  )
}

/** 가격 계산 실패. 입력 문제면 해당 단계로, 그 밖에는 다시 시도. 입력값은 그대로 */
function PriceFailure({
  failure,
  onRetry,
  onClose,
  onFix,
}: {
  failure: RegisterFailure
  onRetry: () => void
  onClose: () => void
  onFix: (step: NonNullable<RegisterFailure['step']>) => void
}) {
  const fixStep = failure.step && failure.step !== '3' ? failure.step : null
  return (
    <Screen
      className="justify-center"
      bottom={
        fixStep ? (
          <BottomButtonBar
            layout="double"
            primaryLabel="수정하러 가기"
            secondaryLabel="닫기"
            onPrimary={() => onFix(fixStep)}
            onSecondary={onClose}
          />
        ) : (
          <BottomButtonBar
            layout="double"
            primaryLabel="다시 시도"
            secondaryLabel="닫기"
            onPrimary={onRetry}
            onSecondary={onClose}
          />
        )
      }
    >
      <ErrorState title={failure.title} description={failure.message} />
    </Screen>
  )
}
