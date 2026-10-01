# AmountStepper

입찰 금액을 최소 입찰 단위(5,000원)씩 올리고 내리는 박스로, − 금액 + 를 한 줄에 두고 아래에 규칙 캡션을 붙입니다.

- 라벨 body04 `gray7`, 금액 title02 `black0`, 힌트 caption02 `gray5`. 박스는 위아래 8 · 좌우 12 패딩, `gray2` 테두리, `radius-sm`.
- 쓰는 곳: 자동 입찰 상한가 설정, 직접 입찰 가격 설정 바텀시트.
- 숫자 `value`(또는 `defaultValue`)와 `min`·`max`·`step`(기본 5,000)을 넘기면 스스로 계산하고, 최솟값·최댓값에서 해당 버튼이 흐려지며(30%) 눌리지 않습니다. 표시는 `format`(기본 `120,000원`).
- error: 박스 테두리 `error1` + 아래 caption01 `error1` 메시지.
- 소비 측이 제공: `value`·`onChange`, `min`, `max`, `step`, `label`, `hint`.
