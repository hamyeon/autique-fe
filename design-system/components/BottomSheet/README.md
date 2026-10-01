# BottomSheet

화면 위로 올라오는 시트로, `black0` 90% 딤 위에 위쪽 모서리 20px(`radius-lg`)의 흰 시트, 60×4 `gray2` 핸들, 제목(head03)과 내용, 하단 버튼 바를 둡니다.

- 쓰는 곳: 자동 입찰 상한가 설정, 직접 입찰 가격 설정처럼 현재 화면을 떠나지 않고 값 하나를 정할 때.
- 내용은 20px 좌우 여백, 12px 간격: InfoBanner → 정보 행 → AmountStepper → 캡션 순이 기본.
- 딤을 누르거나, 아래로 끌어내리거나, Esc를 누르면 `onClose`(앱 코드는 vaul). 미리보기처럼 화면 안에 그리려면 `inline`.
- 화면 높이의 11/12까지만 올라오고, 넘치는 내용은 시트 안에서 스크롤되며 버튼 바는 아래에 남아요. 아래는 홈 인디케이터만큼 띄웁니다.
- 소비 측이 제공: `open`, `onClose`, `title`, 내용(children), `footer`(보통 BottomButtonBar).
