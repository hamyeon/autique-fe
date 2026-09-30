import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/* index.css @theme의 DS 토큰 이름을 알려줘야 text-title01(크기)과 text-gray5(색)를 서로 다른 그룹으로 봅니다. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'title01',
        'title02',
        'head01',
        'head02',
        'head03',
        'body01',
        'body02',
        'body03',
        'body04',
        'body05',
        'body06',
        'caption01',
        'caption02',
        'label01',
        'label02',
      ],
      spacing: [
        'space-4',
        'space-8',
        'space-12',
        'space-16',
        'space-20',
        'space-24',
        'space-32',
        'layout-gutter',
        'layout-top',
        'layout-section',
        'layout-step',
        'section-title',
        'card-padding',
        'card-row',
        'stack-tight',
        'stack-related',
        'form-field',
        'form-label',
      ],
      radius: ['sm', 'md', 'lg', 'full'],
    },
  },
})

/** Tailwind 클래스를 조건부로 합치고, 충돌하는 클래스는 뒤의 것으로 정리합니다. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
