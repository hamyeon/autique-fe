import { useEffect } from 'react'
import type { DefaultValues } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { TextField, Textarea } from '@/components/ds'
import type { RegisterDraft } from '@/features/register/schemas'
import { productInfoStepSchema } from '@/features/register/schemas'
import { RegisterStepScreen } from '@/pages/register/register-step-page'
import { useRegisterNav } from '@/pages/register/use-register-nav'
import { useRegisterStore } from '@/stores/register-store'

type ProductInfoInput = z.input<typeof productInfoStepSchema>

/** 숫자 칸: 비우면 undefined(필수 메시지), 숫자가 아니면 NaN(숫자 메시지) */
const toNumber = (v: unknown) => (v === '' || v == null ? undefined : Number(v))

/** 가격 계산 요청에 들어가는 값. 바뀌면 가격을 다시 계산해야 합니다(상태 설명은 무관). */
const PRICE_FIELDS = new Set(['brand', 'modelName', 'color', 'size'])

/** 스토어(AI 분석 값 · 고친 값)에서 폼 기본값 */
function productInfoDefaults(): DefaultValues<ProductInfoInput> {
  const { draft } = useRegisterStore.getState()
  return {
    brand: draft.brand ?? '',
    modelName: draft.modelName ?? '',
    color: draft.color ?? '',
    size: draft.size ?? undefined,
    conditionGrade: draft.conditionGrade ?? 'UNKNOWN',
    conditionDescription: draft.conditionDescription ?? '',
  }
}

/**
 * 2/6 AI 상품 분석(Figma 551:2377). AI 분석 값으로 채우고 사용자가 고칩니다.
 * conditionGrade는 화면에 없고 AI 값 그대로 보냅니다. 입력은 바로바로 스토어에 저장되어 돌아와도 남습니다.
 */
export function RegisterProductInfoStep() {
  const { goNext: goNextStep } = useRegisterNav('2')
  const update = useRegisterStore((s) => s.update)
  const completeStep = useRegisterStore((s) => s.completeStep)

  const {
    register,
    handleSubmit,
    subscribe,
    formState: { errors, isValid },
  } = useForm<ProductInfoInput, unknown, z.output<typeof productInfoStepSchema>>({
    resolver: zodResolver(productInfoStepSchema),
    mode: 'onTouched',
    defaultValues: productInfoDefaults(),
  })

  /* 고친 값은 바로 저장합니다(뒤로 가기 · 새로고침에도 남게). 브랜드 · 모델명 · 컬러 · 사이즈가 바뀌면 가격을 다시 계산해야 합니다. */
  useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: ({ values, type, name }) => {
        if (type !== 'change') return
        const patch = values as Partial<RegisterDraft>
        update(name && PRICE_FIELDS.has(name) ? { ...patch, priceResult: undefined } : patch)
      },
    })
  }, [subscribe, update])

  const goNext = handleSubmit((values) => {
    if (completeStep('2', values)) goNextStep()
  })

  return (
    <RegisterStepScreen step="2" nextDisabled={!isValid} onNext={() => void goNext()}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void goNext()
        }}
        className="gap-form-field flex flex-col"
      >
        <TextField
          label="브랜드"
          autoComplete="off"
          error={errors.brand?.message}
          {...register('brand')}
        />
        <TextField
          label="모델명"
          autoComplete="off"
          error={errors.modelName?.message}
          {...register('modelName')}
        />
        <TextField
          label="컬러"
          autoComplete="off"
          error={errors.color?.message}
          {...register('color')}
        />
        <TextField
          label="사이즈"
          inputMode="numeric"
          autoComplete="off"
          placeholder="예: 270"
          error={errors.size?.message}
          {...register('size', { setValueAs: toNumber })}
        />
        <Textarea label="상태" {...register('conditionDescription')} />
        {/* 키보드 '이동/완료'로도 제출되도록 */}
        <button type="submit" hidden />
      </form>
    </RegisterStepScreen>
  )
}
