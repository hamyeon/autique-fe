import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { auctionKeys } from '@/api/auctions'
import { BottomButtonBar, BottomSheet, ImagePlaceholder, SummaryCard } from '@/components/ds'
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
import { usePressed } from '@/hooks/use-pressed'
import { formatDotDateTime, formatPrice } from '@/lib/format'
import { RegisterStepScreen } from '@/pages/register/register-step-page'
import { useRegisterNav } from '@/pages/register/use-register-nav'
import { useRegisterStore } from '@/stores/register-store'

/** 비어 있는 선택 항목 표기 */
const EMPTY = '없음'

/**
 * 6/6 경매 정보 확인(Figma 상품 정보 확인 551:2331).
 * StepHeader → 32 → [상품명(한국어 head02 + 영문 body05 gray5) → 12 → 사진 줄] → 24 → SummaryCard
 * → 24 → 구성품 여부 · 상태 · 판매자 설명(각 제목 body03 → 4 → body05 gray6, 사이 12) → BottomButtonBar.
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
    onSuccess: ({ auctionId }) => {
      void queryClient.invalidateQueries({ queryKey: auctionKeys.lists() })
      goComplete(auctionId)
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

  const englishName = [draft.brand, draft.modelName, draft.color].filter(Boolean).join(' ')
  const start = draft.auctionStartAt ? new Date(draft.auctionStartAt) : undefined
  const end = draft.auctionEndAt ? new Date(draft.auctionEndAt) : undefined

  return (
    <RegisterStepScreen
      step="6"
      onNext={submit}
      nextDisabled={submitMutation.isPending}
      nextLabel={submitMutation.isPending ? '등록하는 중이에요' : undefined}
    >
      <div className="gap-layout-section flex flex-col">
        <div className="gap-stack-related flex flex-col">
          <Pressable onClick={edit('2')}>
            {/* 가격 계산 응답의 한국어 상품명(한 줄 말줄임) + 영문 전체명. 서버가 한국어명을 못 만들었으면 영문 전체명만 크게 */}
            <span className="text-head02 text-black0 block truncate">
              {draft.priceResult?.nameKo || englishName || EMPTY}
            </span>
            {draft.priceResult?.nameKo && englishName && (
              <span className="text-body05 text-gray5 block">{englishName}</span>
            )}
          </Pressable>

          <PhotoThumbnails onClick={edit('1')} />
        </div>

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

        <div className="gap-stack-related flex flex-col">
          <Pressable onClick={edit('3')}>
            <TextSection title="구성품 여부">
              {draft.componentStatus ? COMPONENT_STATUS_LABELS[draft.componentStatus] : EMPTY}
            </TextSection>
          </Pressable>
          <Pressable onClick={edit('2')}>
            <TextSection title="상태">{draft.conditionDescription || EMPTY}</TextSection>
          </Pressable>
          {/* 판매자 설명은 선택 항목이라 비어 있으면 안내 문구를 보여줍니다(사용자 결정). */}
          <Pressable onClick={edit('3')}>
            <TextSection title="판매자 설명">
              {draft.sellerDescription?.trim() || '작성된 판매자 설명이 없습니다'}
            </TextSection>
          </Pressable>
        </div>
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

/** 제목(body03 black0) → 4 → 글(body05 gray6, 줄바꿈 유지). Figma 6/6 '구성품 여부' · '상태' · '판매자 설명' */
function TextSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="gap-stack-tight flex flex-col text-left">
      <h3 className="text-body03 text-black0">{title}</h3>
      <p className="text-body05 text-gray6 break-words whitespace-pre-line">{children}</p>
    </section>
  )
}

/** 눌러서 해당 단계로 고치러 가는 덩어리. 눌린 동안 흐려집니다. */
function Pressable({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const { pressed, handlers } = usePressed()
  return (
    <button
      type="button"
      onClick={onClick}
      data-pressed={pressed ? '' : undefined}
      {...handlers}
      className="focus-visible:outline-primary1 block w-full min-w-0 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 data-pressed:opacity-60"
    >
      {children}
    </button>
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
