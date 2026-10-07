/*
 * 5/6 경매 일정 값 다루기. 저장 · 전송은 기기 시간대 오프셋을 붙인 ISO-8601(명세: 오프셋 포함),
 * 피커와는 'YYYY-MM-DD' · 'HH:mm' 문자열로 주고받습니다.
 */

const HOUR = 60 * 60 * 1000
const pad2 = (n: number) => String(n).padStart(2, '0')

/** Date → '2026-09-21T16:00:00+09:00' */
export function toOffsetIso(date: Date) {
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00` +
    `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`
  )
}

/** Date → <input type="date"> 값 '2026-09-21' */
export function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Date → <input type="time"> 값 '16:00' */
export function toTimeInputValue(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

/** 날짜 또는 시간 한쪽만 바꾼 새 ISO. 잘못된 값이면 원래 값 */
export function withDate(iso: string, dateValue: string) {
  const [y, m, d] = dateValue.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(iso)
  date.setFullYear(y, m - 1, d)
  return toOffsetIso(date)
}

export function withTime(iso: string, timeValue: string) {
  const [h, min] = timeValue.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(min)) return iso
  const date = new Date(iso)
  date.setHours(h, min, 0, 0)
  return toOffsetIso(date)
}

/** 처음 들어왔을 때의 일정: 30분 이상 남은 가장 가까운 정각에 시작, 최소 시간(1시간) 뒤 종료 */
export function defaultSchedule(now = new Date()) {
  const start = new Date(now.getTime() + 30 * 60 * 1000)
  start.setMinutes(0, 0, 0)
  start.setTime(start.getTime() + HOUR)
  return {
    auctionStartAt: toOffsetIso(start),
    auctionEndAt: toOffsetIso(new Date(start.getTime() + HOUR)),
  }
}
