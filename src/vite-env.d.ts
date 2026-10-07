/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** 'off'면 개발 모드에서도 MSW 목을 끄고 실제 서버로 보냅니다. */
  readonly VITE_MOCK?: 'on' | 'off'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** 대문자 확장자 이미지(목 상품 사진 등). vite/client는 소문자 *.jpg만 선언합니다. */
declare module '*.JPG' {
  const src: string
  export default src
}
