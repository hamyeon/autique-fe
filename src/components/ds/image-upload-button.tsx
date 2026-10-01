import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { forwardRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

const DIRECTION = {
  front: { art: 'img_shoe_front', label: '앞면' },
  side: { art: 'img_shoe_side', label: '측면' },
  outsole: { art: 'img_shoe_outsole', label: '밑창' },
  defect: { art: 'img_shoe_defect', label: '하자' },
} as const

export interface ImageUploadButtonProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'children'
> {
  /** 촬영 방향: 앞면 · 측면 · 밑창 · 하자 */
  direction?: keyof typeof DIRECTION
  /** 기본은 방향 이름 */
  label?: string
  /** 이미 올라간 사진 URL. 있으면 고른 사진보다 우선합니다. */
  image?: string
  /** 테두리를 error1로 (DS 확장). 메시지는 그리드 아래에 소비 측이 둡니다. */
  invalid?: boolean
}

/**
 * 상품 사진 업로드 칸. 정사각 박스 안 일러스트 + 라벨을 누르면 사진 선택 창이 열리고,
 * 고르면 칸이 미리보기로 채워집니다.
 * 숨긴 <input type="file">에 ref와 네이티브 속성이 그대로 전달되어 RHF register와 바로 연결됩니다(값은 FileList).
 * reset으로 값을 비울 때는 key를 바꿔 미리보기도 함께 지워 주세요.
 */
export const ImageUploadButton = forwardRef<HTMLInputElement, ImageUploadButtonProps>(
  function ImageUploadButton(
    {
      direction = 'front',
      label,
      image,
      invalid,
      className,
      onChange,
      accept = 'image/*',
      ...props
    },
    ref,
  ) {
    const [preview, setPreview] = useState<string | null>(null)
    const meta = DIRECTION[direction]
    const name = label ?? meta.label

    /* 미리보기 URL은 바뀌거나 사라질 때 해제합니다. */
    useEffect(() => {
      if (!preview) return
      return () => URL.revokeObjectURL(preview)
    }, [preview])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      /* 선택 창에서 취소하면 files가 비므로 미리보기도 비웁니다(브라우저가 값을 비움). */
      setPreview(file ? URL.createObjectURL(file) : null)
      onChange?.(e)
    }

    const src = image ?? preview

    return (
      <label
        className={cn(
          'bg-white0 has-focus-visible:outline-primary1 relative block aspect-square w-full cursor-pointer overflow-hidden rounded-sm border has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-disabled:cursor-default',
          invalid ? 'border-error1' : 'border-gray2',
          className,
        )}
      >
        <input
          ref={ref}
          type="file"
          accept={accept}
          aria-label={`${name} 사진 ${src ? '다시 고르기' : '올리기'}`}
          aria-invalid={invalid || undefined}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
        {src ? (
          <img src={src} alt={`${name} 사진`} className="block size-full object-cover" />
        ) : (
          <span className="gap-space-8 pt-space-8 text-gray7 absolute inset-0 flex flex-col items-center justify-center">
            <Icon name={meta.art} />
            <span className="text-head03">{name}</span>
          </span>
        )}
      </label>
    )
  },
)
