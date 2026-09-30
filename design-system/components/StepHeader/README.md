# StepHeader

단계형 플로우(경매 등록 1/6~6/6)의 화면 머리로, 단계 표시(body06 `gray5`) · 제목(head01) + 선택적 정보 아이콘 · 설명(body05)을 쌓습니다.

- 헤더 아래 `layout-step`(32px), 좌우 `layout-gutter`(20px). 아래 콘텐츠와도 `layout-step` 간격.
- 설명은 해요체 한두 문장: 무엇을 하는 단계인지 + 사용자가 할 일.
- Figma StepHeader의 `step` · `title` · `description` 문구와 `info` 켜고 끄기에 대응해요.
- 정보 아이콘은 용어 설명이 필요한 단계(AI 상품 분석, 경매 시작가 설정)에만 `onInfo`로 켭니다.
