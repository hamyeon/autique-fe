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

/**
 * 날짜·시각 표기.
 * - relative(기본): 오늘/내일/어제는 '오늘 오후 8시', 그 밖은 '2026년 9월 30일 오후 8시'
 * - relative=false: 항상 '2026년 9월 30일 오후 8시' (종료된 경매)
 * 분이 있으면 '오후 8시 30분'
 */
export function formatDateTime(date: Date, { relative = true, now = new Date() } = {}) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const time = `${hours < 12 ? '오전' : '오후'} ${hours % 12 || 12}시${minutes ? ` ${minutes}분` : ''}`

  if (relative) {
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / (24 * 60 * 60 * 1000))
    const word = { [-1]: '어제', 0: '오늘', 1: '내일' }[dayDiff]
    if (word) return `${word} ${time}`
  }
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Date → '2026.09.21' (경매 일정 입력 · 확인) */
export function formatDotDate(date: Date) {
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
}

/** Date → '오후 4:00' (경매 일정 입력) */
export function formatMeridiemClock(date: Date) {
  const hours = date.getHours()
  return `${hours < 12 ? '오전' : '오후'} ${hours % 12 || 12}:${pad2(date.getMinutes())}`
}

/** Date → '2026.09.21 오후 4시', 분이 있으면 '오후 4시 30분' (경매 정보 확인) */
export function formatDotDateTime(date: Date) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  return `${formatDotDate(date)} ${hours < 12 ? '오전' : '오후'} ${hours % 12 || 12}시${minutes ? ` ${minutes}분` : ''}`
}
