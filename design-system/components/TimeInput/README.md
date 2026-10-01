# TimeInput

날짜와 시간을 나란히 보여주는 입력으로, 각 칸(Figma `_TimeInputField`)은 50px 높이에 값(body02)을 왼쪽, 단위 라벨 "날짜"·"시간"(body04 `gray5`)을 오른쪽에 둡니다.

- 두 칸은 8px 간격, 폭을 반씩 나눕니다.
- 쓰는 곳: 경매 일정 설정(시작 시간, 종료 시간).
- 표기: 날짜 `2026.09.21`, 시간 `오후 4:00`.
- 실제 선택 UI(피커)는 소비 측이 연결합니다. `onDateClick`·`onTimeClick`을 넘기면 그 칸이 버튼이 되고, 포커스 시 테두리 `primary1`.
- error: 칸 테두리 `error1` + 아래 caption01 `error1` 메시지(예: "종료 시간은 시작 시간 이후여야 해요.").
- 소비 측이 제공: `label`, `date`, `time`, 필요하면 클릭 핸들러와 `error`.
