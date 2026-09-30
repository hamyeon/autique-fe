# PriceCard

AI가 산정한 가격을 보여주는 카드로, 왼쪽에 블루 아웃라인 태그(AI 적정 시세 / AI 적정 기준가), 오른쪽에 title02 `primary1` 금액, 구분선 아래 라벨–값 행을 둡니다.

- 흰 바탕, `gray2` 테두리, 패딩 16px, 행 간격 8px, 구분선 `gray1`.
- 태그는 Tag(`size=md`), 구분선은 Divider, 행은 InfoRow(`emphasis`)입니다(Figma PriceCard).
- AI가 낸 숫자에만 쓰고, 사용자가 입력한 금액과 섞지 마세요. 산정 근거는 카드 아래 'AI 가격 산정 근거' 본문으로.
