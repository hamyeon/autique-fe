# AmountStepper

입찰 금액을 최소 입찰 단위(5,000원)씩 올리고 내리는 52px 박스로, − 금액 + 를 한 줄에 두고 아래에 규칙 캡션을 붙입니다.

- 라벨 body04 `gray7`, 금액 Bold 22px(줄높이 22px — 타입 스케일 밖의 값, Figma 그대로), 힌트 caption02 `gray5`.
- 테두리는 Figma에서 `#DADADA`로 팔레트 밖 값이었고, 가장 가까운 `gray2`로 맞췄습니다.
- 쓰는 곳: 자동 입찰 상한가 설정, 직접 입찰 가격 설정 바텀시트.
- 최솟값·최댓값에서는 `minDisabled`/`maxDisabled`로 버튼을 막습니다.
- 소비 측이 제공: 표시할 `value`(쉼표 + 원), `onDecrease`, `onIncrease`, `label`, `hint`.
