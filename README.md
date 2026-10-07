<img width="1920" height="1080" alt="01" src="https://github.com/user-attachments/assets/77e352d9-7872-4e9e-8f67-e248bfd08854" />

# Autique FE

Autique 모바일 웹 프론트엔드입니다. 추후 Capacitor로 앱 래핑을 고려해 Vite 기반 SPA로 구성했습니다.

## 기술 스택

| 영역            | 사용 기술                                      |
| --------------- | ---------------------------------------------- |
| 빌드 / 언어     | Vite, React 19, TypeScript                     |
| 라우팅          | React Router                                   |
| 스타일링        | Tailwind CSS v4, shadcn/ui (Radix)             |
| 서버 상태       | TanStack Query                                 |
| 클라이언트 상태 | Zustand                                        |
| 폼 / 검증       | React Hook Form + Zod                          |
| 코드 품질       | ESLint, Prettier (+ Tailwind 클래스 자동 정렬) |
| 패키지 매니저   | pnpm                                           |
| 배포            | Vercel                                         |

## 시작하기

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

`pnpm dev`는 `host: true`로 떠서 같은 와이파이의 휴대폰에서 `http://<내 PC IP>:5173`으로 접속해 볼 수 있습니다.

## 스크립트

| 명령                                | 설명                       |
| ----------------------------------- | -------------------------- |
| `pnpm dev`                          | 개발 서버                  |
| `pnpm build`                        | 타입 체크 후 프로덕션 빌드 |
| `pnpm preview`                      | 빌드 결과 미리보기         |
| `pnpm lint` / `pnpm lint:fix`       | ESLint 검사 / 자동 수정    |
| `pnpm format` / `pnpm format:check` | Prettier 포맷 / 검사       |
| `pnpm typecheck`                    | 타입 체크만                |

## 폴더 구조

```
src/
├── app/            # 앱 진입 설정 (providers, router)
├── api/            # API 호출 함수, TanStack Query 훅
├── components/
│   └── ui/         # shadcn/ui 컴포넌트 (CLI로 추가)
├── hooks/          # 공용 커스텀 훅
├── layouts/        # 페이지 레이아웃 (MobileLayout)
├── lib/            # 유틸 (cn, queryClient)
├── pages/          # 라우트 단위 페이지
├── stores/         # Zustand 스토어
└── index.css       # Tailwind, 테마 변수, 모바일 기본 스타일
```

import 경로는 `@/` alias를 사용합니다. 예: `import { cn } from '@/lib/utils'`

## shadcn/ui 컴포넌트 추가

```bash
pnpm dlx shadcn@latest add button drawer input form
```

`src/components/ui/`에 소스가 생성되며, 필요에 따라 직접 수정해서 사용합니다. 전체 색상 톤은 `src/index.css`의 `:root` 변수로 조정합니다.

## 모바일 대응 메모

- 높이는 `h-screen` 대신 `min-h-dvh` / `h-dvh`를 사용합니다 (iOS 주소창 문제).
- 노치·홈 인디케이터 여백은 `pt-safe`, `pb-safe` 유틸리티를 사용합니다.
- input 글자 크기는 16px 이상으로 강제되어 iOS 자동 확대가 발생하지 않습니다.
- 터치 영역은 최소 44px(`h-11`)을 권장합니다.

## 배포

Vercel에 레포를 연결하면 pnpm을 자동 인식합니다. `vercel.json`의 rewrite 설정으로 새로고침 시 404가 나지 않습니다.
