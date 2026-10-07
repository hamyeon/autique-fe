/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** 'off'면 개발 모드에서도 MSW 목을 끄고 실제 서버로 보냅니다. */
  readonly VITE_MOCK?: 'on' | 'off'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
