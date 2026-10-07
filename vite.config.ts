import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_ 접두어가 없는 값도 읽습니다. 이 값들은 브라우저 번들에 들어가지 않습니다.
  const env = loadEnv(mode, process.cwd(), '')

  /*
   * 개발용 API 프록시. 실제 서버가 CORS를 허용하지 않아(Origin이 붙으면 403) 개발 서버가 대신 요청합니다.
   * - .env.local 의 API_PROXY_TARGET 이 있을 때만 켜고, 이때 VITE_API_BASE_URL 은 비워 /api 상대 경로로 부릅니다.
   * - changeOrigin은 Host만 바꾸므로 Origin 헤더는 직접 지웁니다.
   * - 배포(Vercel) · 앱(Capacitor)에서는 쓸 수 없어 백엔드 CORS 허용이 필요합니다.
   */
  const proxy: Record<string, ProxyOptions> | undefined = env.API_PROXY_TARGET
    ? {
        '/api': {
          target: env.API_PROXY_TARGET,
          changeOrigin: true,
          configure: (proxyServer) => {
            proxyServer.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
          },
        },
      }
    : undefined

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      // 같은 와이파이의 휴대폰에서 접속해 테스트할 수 있도록
      host: true,
      proxy,
    },
  }
})
