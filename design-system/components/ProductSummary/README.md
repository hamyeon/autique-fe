# ProductSummary

결과·결제 화면 맨 위의 상품 요약으로, 48px 썸네일(`radius-sm`) 옆에 상품명(head02)과 영문명(body05 `gray5`)을 8px 간격으로 둡니다(Figma ProductSummary).

- 쓰는 곳: 낙찰 성공·실패, 결제, 결제 기한 만료, 차순위 구매 기회 화면의 칩·결과 메시지 아래.
- 폭을 채우고, 상품명과 영문명은 한 줄에서 말줄임(…) 처리됩니다.
- 썸네일이 없으면 `gray1` 바탕이 보입니다.
- 소비 측이 제공: `name`, `subName`, `image`.
