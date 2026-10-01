# RadioList

하나를 고르는 세로 목록으로, `gray1` 테두리 박스 안에 24px 라디오와 body04 라벨 행을 12px 간격·`gray1` 구분선으로 나눠 둡니다(결제 화면의 결제 수단).

- 선택: `black0` 굵은 링(두께 4). 미선택: `gray5` 얇은 링(두께 1). 행은 Figma RadioItem(라디오 → 로고 → 라벨, 간격 8), 라디오는 `_Radio`입니다.
- 행에 결제사 로고 같은 42×24 배지를 `badge`(이미지 URL)로 붙일 수 있습니다. 카카오페이·네이버페이 로고는 제3자 상표라 시스템에 넣지 않았으니 소비 측에서 제공하세요.
- 제어형(`value` + `onChange`) 또는 비제어형(`defaultValue`). 키보드는 ↑↓로 이동하며 선택(앱 코드는 Radix RadioGroup).
- error: 박스 테두리 `error1` + 아래 4px에 caption01 `error1` 메시지. 하나를 고르면 풀려요.
