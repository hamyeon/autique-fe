# BiddingListItem

실시간 경매 화면 '입찰 내역'의 한 줄로, 시간 · 입찰자와 입찰 방식 · 금액을 보여줍니다.

- `price="best"`: 현재 최고가이고 내가 유리할 때. `primary1` 금액 + 최고가 칩.
- `price="worst"`: 현재 최고가지만 내가 밀렸을 때(상한가 초과). `error1` 금액 + 빨간 최고가 칩.
- `price="default"`: 지난 입찰. `black0` 금액(body01).
- 최고가 표시는 목록 맨 위 한 줄에만. 줄 사이에는 1px 구분선을 소비 측에서 넣습니다.
- 소비 측이 제공: `time`(HH:MM), `bidder`, `method`(자동 입찰/직접 입찰), `amount`(쉼표 + "원").
