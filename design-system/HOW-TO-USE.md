# 디자인 시스템 사용 안내 (개발용)

이 폴더는 claude.ai의 **Autique 디자인 시스템**(Figma에서 동기화)을 레포로 옮겨온 **읽기 전용 원본**입니다. 앱 코드는 여기서 직접 import하지 않고, 이 내용을 기준으로 `src/`에 구현합니다.

## 무엇이 어디에 있나

| 경로 | 내용 |
| --- | --- |
| `README.md` | 디자인 원칙, 화면 골격, 여백 규칙 — **가장 먼저 읽을 문서** |
| `tokens.md` / `tokens.json` / `tokens.css` | 색 17개, 타이포 15단계, 간격 18개, 반경 4개 |
| `components/<Name>/README.md` | 컴포넌트별 사용 규칙(variant, 상태, 쓰는 곳) |
| `components/<Name>/preview.html` | 사용 예시 마크업 |
| `reference/index.d.ts` | 전체 컴포넌트 props 타입 — **props의 유일한 기준** |
| `reference/bundle.css` · `bundle.js` | 원본 구현(React 18 전역 번들). 치수·스타일 확인용 참고 자료이며 앱에서 불러오지 않음 |
| `assets/icons`, `assets/illustrations`, `assets/logos` | SVG 원본 (아이콘은 `currentColor`) |

> DS 페이지가 자동 생성하는 컴포넌트별 api.md는 여러 줄 타입을 제대로 읽지 못하고 갱신도 늦어서 이 폴더에 넣지 않습니다. props는 항상 `reference/index.d.ts`를 보세요.

## 앱 코드로 옮길 때의 기준

- 토큰은 `src/index.css`의 Tailwind `@theme`로 옮겨 `bg-primary1`, `text-gray5`, `px-layout-gutter`, `rounded-sm` 같은 클래스로 씁니다.
- 타이포는 `title01`~`label02` 15개를 Tailwind 유틸리티로 만들어 씁니다.
- 컴포넌트는 `src/components/ds/`에 React + TypeScript로 구현하고, props는 `reference/index.d.ts`를 따릅니다.
- 아이콘은 `src/assets/icons/`로 복사해 하나의 `Icon` 컴포넌트로 감쌉니다.
- 폰트는 Pretendard를 npm 패키지(`pretendard`)의 woff2로 불러옵니다.

## 동기화

디자인 시스템이 바뀌면 claude.ai에서 이 폴더를 다시 내보내 통째로 교체합니다. 이 폴더 안의 파일은 직접 수정하지 않습니다.
