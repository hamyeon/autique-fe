# ProgressBar

진행 정도를 보여주는 6px 막대로, `gray1` 트랙 위에 `primary1` 채움을 `radius-full`로 둡니다(Figma ProgressBar).

- 쓰는 곳: 실시간 경매 상태 카드의 "현재가 / 내 자동 입찰 상한가" 비율. AuctionStatusCard의 `progress`가 이 컴포넌트를 씁니다.
- `value`는 0~1. 폭은 부모를 채웁니다.
- 막대 아래 캡션(caption02 `gray4`, 예: "현재가 105,000 / 상한가 120,000")은 소비 측이 붙입니다.
- 소비 측이 제공: `value`, 필요하면 스크린리더용 `label`.
