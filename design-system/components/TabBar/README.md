# TabBar

화면 하단의 3탭 내비게이션(홈 · 상품 찾기 · 마이페이지)으로, 탭마다 24px 아이콘과 label01 텍스트를 4px 간격으로 쌓습니다(Figma TabBar `active=home | product | mypage`).

- 선택된 탭은 `black0` 아이콘·글자, 나머지는 `gray5`. 아이콘은 `Icon/Home`·`Product`·`User`의 `state=active | default`입니다.
- 세 탭이 화면 폭을 똑같이 나눠 갖습니다(375px에서 125px씩, 넓은 기기에서는 같이 늘어남). 상단 1px `gray2` 선, 위 12px·아래 8px 패딩. 아래에 홈 인디케이터가 붙습니다.
- 탭이 있는 화면(홈, 상품 찾기, 마이페이지)에서는 BottomButtonBar를 함께 쓰지 않습니다.
- 앱 코드는 각 탭이 라우터 링크(`/` · `/products` · `/mypage`)이고, `active`가 없으면 현재 경로로 정해집니다. 홈 인디케이터 여백은 화면 골격(Screen)의 하단 영역이 더합니다.
- 소비 측이 제공: `active`, `onChange`.
