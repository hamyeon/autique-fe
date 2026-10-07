import { sessionAppStorage } from '@/lib/storage'

/*
 * 등록 흐름이 시작된 브라우저 기록 위치.
 * 등록이 끝나면 그 위치까지 기록을 되돌린 뒤 완료 화면으로 바꿔 넣어, 완료 화면에서 뒤로 가기를 누르면
 * 등록 단계가 아니라 등록을 시작하기 전 화면(홈 등)으로 가게 합니다.
 * React Router가 history.state.idx에 기록 순번을 넣어 둡니다.
 */

const KEY = 'autique-register-entry-idx'
/** 앱을 처음 연 주소. /register/…로 바로 열렸으면(새로고침) 저장해 둔 시작 위치를 이어서 씁니다. */
const openedInRegister = window.location.pathname.startsWith('/register')
let entryIdx: number | null = null

export function currentHistoryIdx(): number | null {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx
  return typeof idx === 'number' ? idx : null
}

/** RegisterLayout이 처음 그려질 때(등록 흐름에 들어올 때) 부릅니다. */
export function rememberRegisterEntry() {
  const idx = currentHistoryIdx()
  if (idx === null) return
  if (entryIdx === null && openedInRegister) {
    const saved = Number(sessionAppStorage.getItem(KEY))
    entryIdx = Number.isInteger(saved) && saved <= idx ? saved : idx
  } else {
    entryIdx = idx
  }
  sessionAppStorage.setItem(KEY, String(entryIdx))
}

export function registerEntryIdx() {
  return entryIdx
}
