# ProductCard

2열 그리드('비슷한 상품 보기', 상품 찾기)에 쓰는 경매 상품 카드로, 정사각 이미지 위에 상태·등급 칩과 관심 하트를, 아래에 브랜드 · 상품명 · 가격 · 관심 수를 둡니다.

- `status="planned"`(기본): 경매 예정 칩 + "시작가". `status="live"`: LIVE 칩 + "최고가" (Figma ProductCard `status=planned | live`).
- 그리드: 2열이 같은 비율로 늘어나고(열 간격 `space-12`, 행 간격 `space-20`), 이미지는 카드 폭에 맞춰 정사각형을 유지합니다.
- 브랜드 body03, 상품명 body04, 가격 라벨 `gray5`, 금액 body03, 관심 수 caption02 `gray4`.
- 하트는 `Icon/Favorite` `error1` 색: 기본 `style=line`, 관심 등록 시 `style=fill`.
- 소비 측이 제공: `image`, `brand`, `name`, `price`, `status`, `grade`, `meta`, 관심 상태와 핸들러. 이미지가 없으면 `gray1` 바탕이 보입니다.
