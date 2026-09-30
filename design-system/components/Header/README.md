# Header

화면 상단 60px 헤더로, 뒤로 가기 버튼(36px 영역)과 화면 제목(head02)을 왼쪽에, 필요할 때 오른쪽에 액션 하나를 둡니다.

- Figma Header 세트의 `trailing=none | favorite | live`와 같습니다: 기본(제목만), `trailing="favorite"`(검은 선 하트, 상품 상세), `trailing="live"`(LIVE 칩, 실시간 경매).
- 배경 `white0`, 하단 1px `gray2` 선. 상태바(44px) 바로 아래에 붙고, 화면 폭을 채웁니다(제목은 왼쪽, 액션은 오른쪽 끝).
- 홈 화면에는 HomeHeader, 상품 찾기에는 SearchHeader를 씁니다.
- 소비 측이 제공: `title`, `onBack`, 하트 사용 시 `favorited`·`onFavorite`.
