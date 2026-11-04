/*
 * 날짜 · 시간 선택 창 열기. 브라우저 기본 피커(<input type="date|time">)를 씁니다.
 * 앱으로 감쌀 때 Capacitor 날짜 선택 플러그인 등으로 바꿀 수 있도록 이 파일 안에서만 다룹니다.
 */

/** 숨긴 date · time 입력의 선택 창을 엽니다. showPicker가 없는 브라우저는 포커스 + 클릭으로 엽니다. */
export function openNativePicker(input: HTMLInputElement | null) {
  if (!input) return
  try {
    if (typeof input.showPicker === 'function') return input.showPicker()
  } catch {
    /* 아래로 다시 시도 */
  }
  input.focus()
  input.click()
}

/**
 * 손가락으로 쓰는 기기(휴대폰 · 태블릿)인지. 이런 기기는 기기 기본 선택 창(iOS 휠 · 안드로이드 달력)을 쓰고,
 * 마우스로 쓰는 PC 웹은 앱이 그린 선택 시트를 씁니다.
 */
export function prefersNativePicker() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}
