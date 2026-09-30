# LoadMoreDownButton

같은 자리에서 펼쳐지는 접이식 박스로, 닫힘 상태는 LoadMoreButton과 같은 모양에 아래 화살표를, 열림 상태는 12px 아래에 caption02 `gray5` 본문을 보여줍니다(Figma `open=false | true`).

- 쓰는 곳: 가격 설정 화면의 "가격 산정 근거 자세히 보기"처럼 부가 설명.
- 열리면 화살표가 위로 뒤집힙니다.
- 제어형(`open` + `onToggle`) 또는 비제어형(`defaultOpen`).
- 소비 측이 제공: `title`, 본문(children).
