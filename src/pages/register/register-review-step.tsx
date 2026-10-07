import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { auctionKeys } from '@/api/auctions'
import {
  BottomButtonBar,
  BottomSheet,
  ImagePlaceholder,
  InfoField,
  SummaryCard,
} from '@/components/ds'
import { Skeleton } from '@/components/feedback'
import type { PhotoSlot, RegisterStep } from '@/features/register/schemas'
import {
  COMPONENT_STATUS_LABELS,
  PHOTO_LABELS,
  PHOTO_SLOTS,
  REGISTER_BID_INCREMENT,
} from '@/features/register/schemas'
import type { RegisterFailure } from '@/features/register/errors'
import { toRegisterFailure } from '@/features/register/errors'
import { submitRegistration } from '@/features/register/submit'
import { formatDotDateTime, formatPrice } from '@/lib/format'
import { RegisterStepScreen } from '@/pages/register/register-step-page'
import { useRegisterNav } from '@/pages/register/use-register-nav'
import { useRegisterStore } from '@/stores/register-store'

/** 비어 있는 선택 항목 표기 */
const EMPTY = '없음'

/**
 * 6/6 경매 정보 확인(Figma 상품 정보 확인 551:2331).
 * README '정보 확인(6/6)': StepHeader → 사진 썸네일 줄 → SummaryCard → InfoField 목록 카드 → BottomButtonBar.
 * 항목을 누르면 그 단계로 가서 고치고, 고친 뒤 '다음'을 누르면 다시 여기로 돌아옵니다(use-register-nav).
 */
export function RegisterReviewStep() {
  const { goTo, goComplete } = useRegisterNav('6')
  const queryClient = useQueryClient()
  const draft = useRegisterStore((s) => s.draft)
  const markReviewed = useRegisterStore((s) => s.markReviewed)
  const [failure, setFailure] = useState<RegisterFailure | null>(null)

  useEffect(() => markReviewed(), [markReviewed])

  const edit = (step: RegisterStep) => () => goTo(step)

  /*
   * 제출: 버튼을 잠그고, 그 사이 다시 눌러도 진행 중인 요청을 재사용합니다(submitRegistration).
   * 실패해도 입력값은 그대로 두고 시트로 알립니다.
   */
  const submitting = useRef(false)
  const submitMutation = useMutation({
    mutationFn: submitRegistration,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: auctionKeys.lists() })
      goComplete()
    },
    onError: (error) => setFailure(toRegisterFailure(error)),
    onSettled: () => {
      submitting.current = false
    },
  })

  const submit = () => {
    if (submitting.current) return
    submitting.current = true
    setFailure(null)
    submitMutation.mutate(useRegisterStore.getState().draft)
  }

  /** 실패 시트의 '수정하러 가기': 해당 단계에서 고친 뒤 다음을 누르면 6/6으로 돌아옵니다. */
  const fix = (target: RegisterFailure) => {
    setFailure(null)
    if (!target.step || target.step === '6') return
    if (target.kind === 'analysis') {
      // 분석 세션이 없어졌으면 같은 사진으로 다시 분석해야 합니다.
      const { update, uncompleteStep } = useRegisterStore.getState()
      update({ analysisId: undefined })
      uncompleteStep('analyzing')
    }
    goTo(target.step)
  }

  const start = draft.auctionStartAt ? new Date(draft.auctionStartAt) : undefined
  const end = draft.auctionEndAt ? new Date(draft.auctionEndAt) : undefined

  return (
    <RegisterStepScreen
      step="6"
      onNext={submit}
      nextDisabled={submitMutation.isPending}
      nextLabel={submitMutation.isPending ? '등록하는 중이에요' : undefined}
    >
      <div className="gap-stack-related flex flex-col">
        <PhotoThumbnails onClick={edit('1')} />

        <SummaryCard
          rows={[
            {
              label: '경매 시작',
              value: start ? formatDotDateTime(start) : EMPTY,
              emphasis: 'regular',
              onClick: edit('5'),
            },
            {
              label: '경매 종료',
              value: end ? formatDotDateTime(end) : EMPTY,
              emphasis: 'regular',
              onClick: edit('5'),
            },
            {
              label: '시작가',
              value: draft.sellingPrice != null ? formatPrice(draft.sellingPrice) : EMPTY,
              emphasis: 'primary',
              onClick: edit('4'),
            },
            // 서버가 정하는 값이라 고칠 수 없습니다.
            { label: '최소 입찰 단위', value: formatPrice(REGISTER_BID_INCREMENT) },
          ]}
        />

        <section className="border-gray2 bg-white0 gap-form-field p-card-padding flex flex-col rounded-sm border">
          <InfoField label="브랜드" value={draft.brand || EMPTY} onClick={edit('2')} />
          <InfoField label="모델명" value={draft.modelName || EMPTY} onClick={edit('2')} />
          <InfoField label="컬러" value={draft.color || EMPTY} onClick={edit('2')} />
          <InfoField label="사이즈" value={draft.size ?? EMPTY} onClick={edit('2')} />
          <InfoField label="상태" value={draft.conditionDescription || EMPTY} onClick={edit('2')} />
          <InfoField
            label="구성품 여부"
            value={draft.componentStatus ? COMPONENT_STATUS_LABELS[draft.componentStatus] : EMPTY}
            onClick={edit('3')}
          />
          <InfoField
            label="판매자 설명"
            value={draft.sellerDescription || EMPTY}
            onClick={edit('3')}
          />
        </section>
      </div>

      <SubmitFailureSheet
        failure={failure}
        onClose={() => setFailure(null)}
        onRetry={submit}
        onFix={fix}
      />
    </RegisterStepScreen>
  )
}

type Thumb = { slot: PhotoSlot; url: string | null }

/** 올린 사진 줄(4칸, 간격 8). IndexedDB에서 읽는 동안 스켈레톤, 읽지 못한 사진은 빈 자리. 누르면 1/6 */
function PhotoThumbnails({ onClick }: { onClick: () => void }) {
  const photos = useRegisterStore((s) => s.draft.photos)
  const loadPhoto = useRegisterStore((s) => s.loadPhoto)
  const [thumbs, setThumbs] = useState<Thumb[] | null>(null)

  useEffect(() => {
    let cancelled = false
    let urls: string[] = []
    const slots = PHOTO_SLOTS.filter((slot) => photos?.[slot])
    void Promise.all(
      slots.map(async (slot): Promise<Thumb> => {
        const blob = await loadPhoto(slot).catch(() => null)
        return { slot, url: blob ? URL.createObjectURL(blob) : null }
      }),
    ).then((loaded) => {
      urls = loaded.flatMap((t) => (t.url ? [t.url] : []))
      if (cancelled) return urls.forEach(URL.revokeObjectURL)
      setThumbs(loaded)
    })
    return () => {
      cancelled = true
      urls.forEach(URL.revokeObjectURL)
    }
  }, [photos, loadPhoto])

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="상품 사진 고치기"
      aria-busy={!thumbs || undefined}
      className="gap-space-8 focus-visible:outline-primary1 grid grid-cols-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {thumbs
        ? thumbs.map(({ slot, url }) => (
            <ImagePlaceholder
              key={slot}
              ratio={1}
              src={url ?? undefined}
              alt={`${PHOTO_LABELS[slot]} 사진`}
              className="rounded-sm"
            />
          ))
        : PHOTO_SLOTS.filter((slot) => photos?.[slot]).map((slot) => (
            <Skeleton key={slot} className="aspect-square w-full" />
          ))}
    </button>
  )
}

/** 제출 실패 안내. 끊김 · 서버 오류는 다시 시도, 입력 문제는 해당 단계로, 로그인 만료는 확인만 */
function SubmitFailureSheet({
  failure,
  onClose,
  onRetry,
  onFix,
}: {
  failure: RegisterFailure | null
  onClose: () => void
  onRetry: () => void
  onFix: (failure: RegisterFailure) => void
}) {
  const footer = !failure ? null : failure.kind === 'auth' ? (
    <BottomButtonBar layout="single" primaryLabel="확인" onPrimary={onClose} />
  ) : failure.step && failure.step !== '6' ? (
    <BottomButtonBar
      layout="double"
      primaryLabel="수정하러 가기"
      secondaryLabel="닫기"
      onPrimary={() => onFix(failure)}
      onSecondary={onClose}
    />
  ) : failure.kind === 'invalid' ? (
    <BottomButtonBar layout="single" primaryLabel="확인" onPrimary={onClose} />
  ) : (
    <BottomButtonBar
      layout="double"
      primaryLabel="다시 시도"
      secondaryLabel="닫기"
      onPrimary={() => {
        onClose()
        onRetry()
      }}
      onSecondary={onClose}
    />
  )

  return (
    <BottomSheet open={failure !== null} onClose={onClose} title={failure?.title} footer={footer}>
      {failure && <p className="text-body05 text-gray6">{failure.message}</p>}
    </BottomSheet>
  )
}
