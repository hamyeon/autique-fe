import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { ImageUploadButton } from '@/components/ds'
import type { PhotoSlot } from '@/features/register/schemas'
import { PHOTO_SLOTS, isStepDone, photosStepSchema } from '@/features/register/schemas'
import { ImageDecodeError, toUploadJpeg } from '@/lib/image'
import { RegisterStepScreen } from '@/pages/register/register-step-page'
import { nextStepAfter, useRegisterNav } from '@/pages/register/use-register-nav'
import { useRegisterStore } from '@/stores/register-store'

type PhotosForm = z.input<typeof photosStepSchema>
type SlotMap<T> = Partial<Record<PhotoSlot, T>>

/**
 * 1/6 상품 이미지 업로드(Figma 551:2291). 2×2 칸에 사진을 고르면 긴 변 2048px JPEG로 줄여
 * IndexedDB에 두고(업로드는 '다음' = AI 분석 때), 채워진 칸을 다시 누르면 바꾸고 오른쪽 위 X로 지웁니다.
 * 필수 사진(측면 · 앞면 · 밑창)이 빠지면 '다음'만 비활성으로 두고 칸 · 메시지로 따로 알리지 않습니다.
 */
export function RegisterPhotosStep() {
  const { goTo } = useRegisterNav('1')
  const setPhoto = useRegisterStore((s) => s.setPhoto)
  const removePhoto = useRegisterStore((s) => s.removePhoto)
  const loadPhoto = useRegisterStore((s) => s.loadPhoto)
  const completeStep = useRegisterStore((s) => s.completeStep)

  const {
    setValue,
    formState: { isValid },
  } = useForm<PhotosForm>({
    resolver: zodResolver(photosStepSchema),
    defaultValues: { photos: useRegisterStore.getState().draft.photos ?? {} },
  })

  /** 스토어의 사진 정보를 폼에 다시 넣고 검증합니다. */
  const syncForm = () =>
    setValue('photos', (useRegisterStore.getState().draft.photos ?? {}) as PhotosForm['photos'], {
      shouldValidate: true,
    })

  const [previews, setPreviews] = useState<SlotMap<string>>({})
  const [busy, setBusy] = useState<SlotMap<boolean>>({})
  const [slotErrors, setSlotErrors] = useState<SlotMap<string>>({})
  /** 칸을 비울 때 ImageUploadButton 안쪽 미리보기도 비우려고 key를 바꿉니다. */
  const [keys, setKeys] = useState<SlotMap<number>>({})

  /* 미리보기 URL은 바뀌거나 화면을 떠날 때 해제합니다. */
  const previewsRef = useRef(previews)
  previewsRef.current = previews
  useEffect(() => () => Object.values(previewsRef.current).forEach(URL.revokeObjectURL), [])

  const setPreview = (slot: PhotoSlot, url: string | undefined) =>
    setPreviews((prev) => {
      if (prev[slot]) URL.revokeObjectURL(prev[slot])
      return { ...prev, [slot]: url }
    })

  const bumpKey = (slot: PhotoSlot) =>
    setKeys((prev) => ({ ...prev, [slot]: (prev[slot] ?? 0) + 1 }))

  /* 돌아오거나 새로고침하면 IndexedDB에서 사진을 읽어 미리보기를 채웁니다. 파일이 없으면 칸을 비웁니다. */
  useEffect(() => {
    let cancelled = false
    const saved: SlotMap<unknown> = useRegisterStore.getState().draft.photos ?? {}
    void Promise.all(
      PHOTO_SLOTS.filter((slot) => saved[slot]).map(async (slot) => {
        const blob = await loadPhoto(slot).catch(() => null)
        if (cancelled) return
        if (blob) setPreview(slot, URL.createObjectURL(blob))
        else await removePhoto(slot)
      }),
    ).then(() => !cancelled && syncForm())
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 처음 한 번만
  }, [])

  const handleFile = async (slot: PhotoSlot, e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const file = input.files?.[0]
    // 같은 사진을 다시 골라도 change가 나도록 비웁니다.
    input.value = ''
    // 선택 창에서 취소하면 원래 사진을 그대로 둡니다.
    if (!file) return bumpKey(slot)

    setBusy((prev) => ({ ...prev, [slot]: true }))
    try {
      const jpeg = await toUploadJpeg(file)
      await setPhoto(slot, jpeg)
      setPreview(slot, URL.createObjectURL(jpeg))
      setSlotErrors((prev) => ({ ...prev, [slot]: undefined }))
    } catch (err) {
      setSlotErrors((prev) => ({
        ...prev,
        [slot]:
          err instanceof ImageDecodeError
            ? '사진을 불러올 수 없어요. 다른 사진을 골라 주세요.'
            : '사진을 저장하지 못했어요. 다시 골라 주세요.',
      }))
    } finally {
      // 실패하면 안쪽 미리보기(고른 원본)를 지워 원래 사진 또는 빈 칸으로 되돌립니다.
      bumpKey(slot)
      setBusy((prev) => ({ ...prev, [slot]: false }))
      syncForm()
    }
  }

  const deletePhoto = async (slot: PhotoSlot) => {
    await removePhoto(slot)
    setPreview(slot, undefined)
    setSlotErrors((prev) => ({ ...prev, [slot]: undefined }))
    bumpKey(slot)
    syncForm()
  }

  const isBusy = Object.values(busy).some(Boolean)

  const goNext = () => {
    if (!completeStep('1')) return
    const { draft, completed } = useRegisterStore.getState()
    // 사진을 바꾸면 분석 세션이 지워지므로, 남아 있으면 사진 그대로 → 다시 분석하지 않습니다.
    if (isStepDone('analyzing', draft, completed)) goTo(nextStepAfter('analyzing'))
    else goTo('analyzing')
  }

  // 읽을 수 없는 사진처럼 다시 골라야 하는 경우만 알립니다(한 줄).
  const message = PHOTO_SLOTS.map((slot) => slotErrors[slot]).find(Boolean)

  return (
    <RegisterStepScreen step="1" nextDisabled={!isValid || isBusy} onNext={goNext}>
      <div className="gap-stack-tight flex flex-col">
        <div className="gap-space-8 grid grid-cols-2" aria-busy={isBusy || undefined}>
          {PHOTO_SLOTS.map((slot) => (
            <ImageUploadButton
              key={`${slot}-${keys[slot] ?? 0}`}
              direction={slot}
              image={previews[slot]}
              invalid={!!slotErrors[slot]}
              disabled={busy[slot]}
              onChange={(e) => void handleFile(slot, e)}
              onRemove={() => void deletePhoto(slot)}
            />
          ))}
        </div>
        {message && (
          <p role="alert" className="text-caption01 text-error1">
            {message}
          </p>
        )}
      </div>
    </RegisterStepScreen>
  )
}
