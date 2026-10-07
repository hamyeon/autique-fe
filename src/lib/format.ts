/* 화면 표기 유틸. 금액·시간 문자열은 여기서만 만듭니다. */

/** 105000 → '105,000원' */
export function formatPrice(value: number) {
  return `${formatNumber(value)}원`
}

/** 105000 → '105,000' (캡션처럼 '원'을 붙이지 않을 때) */
export function formatNumber(value: number) {
  return Math.round(value).toLocaleString('ko-KR')
}

/** Date → '20:32' (입찰 내역 시각) */
export function formatClock(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 'A' → 'A등급', 'DS' → '새상품'. 판정 불가(UNKNOWN)는 칩을 숨기도록 undefined */
export function formatGrade(grade: string) {
  if (grade === 'UNKNOWN') return undefined
  if (grade === 'DS') return '새상품'
  return `${grade}등급`
}
