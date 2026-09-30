# SummaryCard

라벨–값 목록 카드로, InfoRow 최대 4행과 선택적 구분선을 16 패딩 · 8 간격 · `radius-sm` 카드에 담습니다(Figma SummaryCard).

- 결과(낙찰 · 실패 · 만료), 결제, 정보 확인, 상품 상세의 요약 카드가 모두 이것입니다.
- 흔한 구성: 행 2개 → 구분선 → 합계 행(`emphasis: 'total'`). `dividerAfter={2}`.
- `tone="primary"`: `primary4` 바탕 · `primary2` 테두리. 자동 입찰 상태처럼 '나와 관련된' 정보.
- 소비 측이 제공: `rows`(InfoRow 배열), `dividerAfter`, `tone`.
