/* 확인 페이지와 Screen 데모가 함께 쓰는 BottomButtonBar 예시 값 */
export const BAR_LAYOUTS = ['single', 'double', 'triple', 'secondary', 'primaryDanger'] as const
export type BarLayout = (typeof BAR_LAYOUTS)[number]

export const BAR_LABELS = {
  primaryLabel: '입찰하기',
  secondaryLabel: '상한가 수정',
  dangerLabel: '자동 입찰 취소',
} as const
