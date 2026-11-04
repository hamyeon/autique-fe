import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { dateTimeSchema } from '@/api/schemas/common'
import type { CreatePurchaseGoalRequest, PurchaseGoalDraft } from '@/api/schemas/purchase-goals'
import {
  createPurchaseGoalRequestSchema,
  purchaseGoalConditionSchema,
} from '@/api/schemas/purchase-goals'
import {
  AmountStepper,
  BottomButtonBar,
  BottomSheet,
  InfoBanner,
  RadioList,
  TextField,
  Textarea,
} from '@/components/ds'
import { hasErrorCode } from '@/features/auction/auto-bid'
import { toOffsetIso } from '@/features/register/schedule'
import { ScheduleField } from '@/features/register/schedule-field'
import { showToast } from '@/stores/toast-store'
import { conditionLabel } from './agent-messages'

/** 예산 기본값 · 단위. 초안에 예산이 없을 때 시작값(사용자가 확인 후 등록) */
const BUDGET_STEP = 10000
const DEFAULT_BUDGET = 100000

/** 시트 위 안내(InfoBanner). warnings · confidence 대신 고정 문구 */
const CONFIRM_NOTICE =
  'AI가 정리한 조건이에요. 확인하면 조건에 맞는 경매에 따로 묻지 않고 자동으로 입찰해요.'

const CONDITION_OPTIONS = purchaseGoalConditionSchema.options.map((value) => ({
  value,
  label: conditionLabel(value),
}))

/**
 * 확인 폼. 필드는 명세 요청(createPurchaseGoalRequestSchema)과 같고, 메시지는 화면용 해요체입니다.
 * 사이즈는 글자로 받아 숫자로 바꿉니다(비우면 모든 사이즈). 마감은 지금 이후(명세 40005).
 */
const confirmFormSchema = z.object({
  minCondition: z.union([purchaseGoalConditionSchema, z.literal('')]).refine((v) => v !== '', {
    message: '최소 등급을 골라 주세요.',
  }),
  hardMaxAmount: createPurchaseGoalRequestSchema.shape.hardMaxAmount,
  size: z
    .string()
    .trim()
    .regex(/^\d*$/, { message: '사이즈는 숫자로만 입력해 주세요. (예: 270)' })
    .refine((v) => v === '' || Number(v) > 0, { message: '사이즈를 확인해 주세요.' }),
  freeTextConditions: z.string(),
  deadline: dateTimeSchema.refine((v) => Date.parse(v) > Date.now(), {
    message: '마감은 지금 이후로 정해 주세요.',
  }),
})
type ConfirmForm = z.input<typeof confirmFormSchema>

/** 기본 마감: 7일 뒤 밤 11시 59분(초안에는 마감이 없음) */
function defaultDeadline() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(23, 59, 0, 0)
  return toOffsetIso(d)
}

function toFormValues(draft: PurchaseGoalDraft): ConfirmForm {
  return {
    minCondition: draft.minCondition ?? '',
    hardMaxAmount: draft.hardMaxAmount ?? DEFAULT_BUDGET,
    size: draft.sizeKr ? String(draft.sizeKr) : '',
    freeTextConditions: draft.freeTextConditions ?? '',
    deadline: defaultDeadline(),
  }
}

export interface AgentConfirmSheetProps {
  open: boolean
  /** 확인할 초안. 닫히는 동안에도 내용이 남도록 닫힌 뒤에도 그대로 넘깁니다. */
  draft: PurchaseGoalDraft | null
  onClose: () => void
  /** 확인한 조건(POST /api/purchase-goals 요청 모양) */
  /** 등록(POST /api/purchase-goals). 실패하면 throw — 지난 마감(40005)은 마감 칸 에러, 그 밖은 토스트 */
  onConfirm: (values: CreatePurchaseGoalRequest) => Promise<void>
}

/**
 * 조건 확인 시트(Figma에 없음 · DESIGN-CHANGES.md). 명세: parse 초안을 사용자가 확인 · 수정하고
 * 마감(deadline)과 빠진 필수값을 채운 뒤 등록합니다. warnings · confidence 대신 위 InfoBanner에 고정 안내를 둡니다(사용자 결정).
 */
export function AgentConfirmSheet({ open, draft, onClose, onConfirm }: AgentConfirmSheetProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmForm>({
    resolver: zodResolver(confirmFormSchema),
    defaultValues: draft ? toFormValues(draft) : undefined,
  })

  /* 열 때마다 초안 값으로 다시 채웁니다(마감 기본값도 새로 계산). */
  useEffect(() => {
    if (open && draft) reset(toFormValues(draft))
  }, [open, draft, reset])

  const submit = handleSubmit(async (values) => {
    if (!draft) return
    /* 모델은 초안 그대로(시세 카탈로그 키와 맞아야 탐색할 수 있어 시트에서 고치지 않음) */
    const body: CreatePurchaseGoalRequest = {
      brand: draft.brand,
      modelKey: draft.modelKey,
      modelQuery: draft.modelQuery ?? draft.modelKey ?? '',
      minCondition: purchaseGoalConditionSchema.parse(values.minCondition),
      hardMaxAmount: values.hardMaxAmount,
      sizeKr: values.size.trim() ? Number(values.size) : null,
      freeTextConditions: values.freeTextConditions.trim() || null,
      deadline: values.deadline,
    }
    try {
      await onConfirm(body)
    } catch (e) {
      if (hasErrorCode(e, 'PURCHASE_GOAL_INVALID')) {
        /* 등급은 목록에서만 고르므로 40005는 지난 마감입니다. */
        setError('deadline', { message: '마감은 지금 이후로 정해 주세요.' }, { shouldFocus: true })
      } else {
        showToast('조건을 등록하지 못했어요. 잠시 후 다시 시도해 주세요')
      }
    }
  })

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="찾을 조건을 확인해 주세요"
      footer={
        <BottomButtonBar
          primaryLabel="이 조건으로 찾기"
          primaryDisabled={isSubmitting}
          onPrimary={submit}
        />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="gap-form-field flex flex-col"
      >
        {/* 명세: 등록 후에는 경매마다 다시 승인을 묻지 않으므로 확인 전에 알려 줍니다. */}
        <InfoBanner>{CONFIRM_NOTICE}</InfoBanner>
        {/* 고칠 수 없는 칸: 다른 모델은 대화에서 문장을 새로 보내 찾습니다. */}
        <TextField label="모델" value={draft?.modelQuery ?? ''} disabled readOnly />
        <Controller
          control={control}
          name="minCondition"
          render={({ field, fieldState }) => (
            <RadioList
              ref={field.ref}
              label="최소 등급"
              options={CONDITION_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="hardMaxAmount"
          render={({ field, fieldState }) => (
            <AmountStepper
              ref={field.ref}
              label="최대 예산"
              labelStyle="field"
              value={field.value}
              onChange={field.onChange}
              min={BUDGET_STEP}
              step={BUDGET_STEP}
              hint="이 금액 안에서만 자동 입찰해요"
              error={fieldState.error?.message}
            />
          )}
        />
        <TextField
          label="사이즈(mm)"
          inputMode="numeric"
          placeholder="비우면 모든 사이즈를 찾아요"
          error={errors.size?.message}
          {...register('size')}
        />
        <Controller
          control={control}
          name="deadline"
          render={({ field, fieldState }) => (
            <ScheduleField
              ref={field.ref}
              label="언제까지 찾을까요"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Textarea
          label="추가 희망 사항(선택)"
          placeholder="예: 박스 있으면 좋아요"
          {...register('freeTextConditions')}
        />
      </form>
    </BottomSheet>
  )
}
