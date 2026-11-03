import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import { useAuctionDetailQuery, useRelistAuctionMutation } from '@/api/auctions'
import { isApiError } from '@/api/client'
import type { AuctionDetail } from '@/api/schemas/auctions'
import { relistAuctionRequestSchema } from '@/api/schemas/auctions'
import { isAuctionLongEnough } from '@/api/schemas/products'
import type { ApiErrorCodeName } from '@/api/schemas/common'
import {
  AmountStepper,
  BottomButtonBar,
  Button,
  Header,
  InfoBanner,
  ProductSummary,
} from '@/components/ds'
import { EmptyState, ErrorState } from '@/components/feedback'
import { DEFAULT_BID_INCREMENT, hasErrorCode } from '@/features/auction/auto-bid'
import { defaultSchedule } from '@/features/register/schedule'
import { ScheduleField } from '@/features/register/schedule-field'
import { PurchaseSummarySkeleton } from '@/features/purchase/purchase-summary'
import { Screen } from '@/layouts/screen'
import { formatNumber } from '@/lib/format'

/**
 * 재경매 등록 (/products/:id/relist, id = 이전 auctionId. Figma에 없음 · DESIGN-CHANGES.md).
 * 유찰(입찰 없이 종료)됐거나 시작 전에 취소된 내 경매를 같은 상품으로 다시 엽니다(명세: 상품당 등록 최대 2회, 입찰 단위는 서버가 5,000).
 * 시작가 · 일정만 받고, 등록하면 새 경매 상세로 바꿔 넣습니다.
 */
export function RelistPage() {
  const auctionId = Number(useParams().id)
  const valid = Number.isInteger(auctionId)
  const detail = useAuctionDetailQuery(auctionId, { enabled: valid })
  const navigate = useNavigate()
  const header = <Header title="재경매 등록" />

  if (valid && (detail.isPending || detail.isPlaceholderData)) {
    return (
      <Screen header={header}>
        <PurchaseSummarySkeleton />
      </Screen>
    )
  }
  if (valid && detail.isError && !(isApiError(detail.error) && detail.error.status === 404)) {
    return (
      <Screen header={header} className="justify-center">
        <ErrorState
          title="경매 정보를 불러오지 못했어요"
          retrying={detail.isRefetching}
          onRetry={() => detail.refetch()}
        />
      </Screen>
    )
  }

  const data = detail.data
  const relistable =
    data?.myState.isSeller &&
    (data.status === 'CANCELED' || (data.status === 'ENDED' && data.bidCount === 0))
  if (!data || !relistable) {
    return (
      <Screen header={header} className="justify-center">
        <EmptyState
          title="재경매할 수 없는 경매예요"
          description="내가 등록한 경매 중 유찰됐거나 시작 전에 취소한 경매만 다시 열 수 있어요"
          action={
            <Button block={false} onClick={() => navigate('/', { replace: true })}>
              홈으로
            </Button>
          }
        />
      </Screen>
    )
  }
  return <RelistForm detail={data} />
}

/**
 * 재경매 폼. 필드는 명세 요청(relistAuctionRequestSchema)과 같고, 메시지는 화면용 해요체입니다.
 * 등록 5/6과 같은 규칙: 시작은 지금 이후(프론트 규칙) · 진행 1시간 이상(명세 40006)
 */
const relistFormSchema = z
  .object({
    startPrice: relistAuctionRequestSchema.shape.startPrice,
    startAt: relistAuctionRequestSchema.shape.startAt,
    endAt: relistAuctionRequestSchema.shape.endAt,
  })
  .refine((v) => Date.parse(v.startAt) > Date.now(), {
    path: ['startAt'],
    message: '시작 시간은 지금 이후로 정해주세요.',
  })
  .refine((v) => isAuctionLongEnough(v.startAt, v.endAt), {
    path: ['endAt'],
    message: '경매 시간은 1시간부터 설정할 수 있어요.',
  })
type RelistForm = z.input<typeof relistFormSchema>

/** 서버가 거절한 이유별 안내(해요체) */
const REJECT_MESSAGE: Partial<Record<ApiErrorCodeName, string>> = {
  ACTIVE_AUCTION_EXISTS: '이 상품은 이미 예약됐거나 진행 중인 경매가 있어요.',
  RELIST_LIMIT_EXCEEDED: '이 상품은 경매 등록 횟수(최대 2번)를 모두 썼어요.',
  RELIST_NOT_ALLOWED: '유찰됐거나 시작 전에 취소된 경매만 재경매할 수 있어요.',
  NOT_PRODUCT_OWNER: '내가 등록한 상품만 재경매할 수 있어요.',
}

function RelistForm({ detail }: { detail: AuctionDetail }) {
  const navigate = useNavigate()
  const relist = useRelistAuctionMutation(detail.auctionId)
  const [error, setError] = useState<string | null>(null)
  const step = detail.bidIncrement || DEFAULT_BID_INCREMENT
  const schedule = defaultSchedule()

  const {
    control,
    handleSubmit,
    setError: setFieldError,
    formState: { isValid },
  } = useForm<RelistForm, unknown, z.output<typeof relistFormSchema>>({
    resolver: zodResolver(relistFormSchema),
    mode: 'onChange',
    defaultValues: {
      startPrice: detail.startPrice,
      startAt: schedule.auctionStartAt,
      endAt: schedule.auctionEndAt,
    },
  })

  const submit = handleSubmit(async (values) => {
    setError(null)
    try {
      const created = await relist.mutateAsync(values)
      navigate(`/products/${created.auctionId}`, { replace: true })
    } catch (e) {
      if (hasErrorCode(e, 'AUCTION_TIME_INVALID')) {
        setFieldError('endAt', {
          message: '경매 시간은 1시간 이상이어야 하고, 시작 시간은 지금 이후여야 해요.',
        })
        return
      }
      const name = (Object.keys(REJECT_MESSAGE) as ApiErrorCodeName[]).find((n) =>
        hasErrorCode(e, n),
      )
      if (name) {
        setError(REJECT_MESSAGE[name]!)
        return
      }
      const offline = isApiError(e) && (e.kind === 'network' || e.kind === 'timeout')
      setError(
        offline
          ? '연결이 불안정해서 재경매를 등록하지 못했어요.'
          : '일시적인 문제로 재경매를 등록하지 못했어요.',
      )
    }
  })

  return (
    <Screen
      header={<Header title="재경매 등록" />}
      bottom={
        <BottomButtonBar
          layout="single"
          primaryLabel={relist.isPending ? '등록하는 중이에요' : '재경매 등록하기'}
          primaryDisabled={!isValid || relist.isPending}
          onPrimary={() => void submit()}
        />
      }
    >
      <div className="gap-layout-section flex flex-col">
        <ProductSummary
          name={detail.product.name}
          subName={detail.product.subName}
          image={detail.product.imageUrls[0]}
        />
        <div className="gap-form-field flex flex-col">
          <Controller
            control={control}
            name="startPrice"
            render={({ field, fieldState }) => (
              <AmountStepper
                label="시작가"
                labelStyle="field"
                value={field.value}
                onChange={field.onChange}
                min={step}
                step={step}
                hint={`${formatNumber(step)}원 단위로 조정할 수 있어요.`}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="startAt"
            render={({ field, fieldState }) => (
              <ScheduleField
                ref={field.ref}
                label="시작 시간"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="endAt"
            render={({ field, fieldState }) => (
              <ScheduleField
                ref={field.ref}
                label="종료 시간"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
        {/* 안내 · 거절 이유는 입력 아래 맨 끝(사용자 결정, 2026-11-03) */}
        <InfoBanner tone={error ? 'error' : 'default'}>
          {error ??
            '같은 상품으로 새 경매를 열어요. 상품당 경매 등록은 취소한 경매를 포함해 최대 2번까지예요.'}
        </InfoBanner>
      </div>
    </Screen>
  )
}
