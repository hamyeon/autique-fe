/* 남은 시간 계산·표기. 서버 시각과의 차이 보정이 필요해지면 now만 바꿔 넘기면 됩니다. */

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** 마감까지 남은 ms. 지났으면 0 */
export function getRemainingMs(endAt: Date | number, now: Date | number = Date.now()) {
  return Math.max(0, +endAt - +now)
}

export type RemainingStyle =
  /** 실시간 경매 카운트다운: '42:18', 한 시간 이상이면 '1:05:09' */
  | 'clock'
  /** 시작·마감까지 대략: '2일', '3시간', '45분', '1분 미만' */
  | 'short'

/** 남은 ms를 표기로. 0이면 endedLabel(기본 '종료') */
export function formatRemaining(ms: number, style: RemainingStyle = 'clock', endedLabel = '종료') {
  if (ms <= 0) return endedLabel

  if (style === 'short') {
    if (ms >= DAY) return `${Math.floor(ms / DAY)}일`
    if (ms >= HOUR) return `${Math.floor(ms / HOUR)}시간`
    if (ms >= MINUTE) return `${Math.floor(ms / MINUTE)}분`
    return '1분 미만'
  }

  /* 남은 초를 올림해 0초가 되는 순간에만 '종료'가 보이게 합니다. */
  const total = Math.ceil(ms / SECOND)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
