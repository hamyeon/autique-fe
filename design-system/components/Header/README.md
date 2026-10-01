# Header

화면 상단 60px 헤더로, 뒤로 가기 버튼(36px 영역)과 화면 제목(head02)을 왼쪽에, 필요할 때 오른쪽에 액션 하나를 둡니다.

- Figma Header 세트의 `trailing=none | favorite | live`와 같습니다: 기본(제목만), `trailing="favorite"`(검은 하트: 기본 선, 관심 등록 시 검은 채움, 상품 상세), `trailing="live"`(LIVE 칩, 실시간 경매).
- 배경 `white0`, 하단 1px `gray2` 선. 상태바(44px) 바로 아래에 붙고, 화면 폭을 채웁니다(제목은 왼쪽, 액션은 오른쪽 끝).
- 패딩: 위아래 12, 왼쪽 8(뒤로 가기 없으면 20), 오른쪽 18 — LIVE 칩일 때만 20(Figma 그대로).
- `showBack={false}`면 제목이 화면 좌우 여백(20)에서 시작합니다. 긴 제목은 한 줄 말줄임이고, 뒤로 가기·액션은 줄어들지 않아요.
- 앱 코드의 기본 뒤로 가기는 이전 화면(`navigate(-1)`), 돌아갈 기록이 없으면 홈입니다.
- 홈 화면에는 HomeHeader, 상품 찾기에는 SearchHeader를 씁니다.
- 소비 측이 제공: `title`, `onBack`, 하트 사용 시 `favorited`·`onFavorite`.
