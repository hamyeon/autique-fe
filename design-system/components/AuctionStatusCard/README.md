# AuctionStatusCard

내가 참여 중인 실시간 경매의 상태 카드로, `primary4` 배경·`primary2` 테두리 위에 현재가(title02 `primary1`), 상태 태그, 정보 행, 자동 입찰 상한가 진행 바를 보여줍니다.

- `status`는 Figma 변형과 같아요.
  - `leading`(기본): 내가 최고 입찰자. `primary4` 바탕, 현재가 title02 `primary1`, Tag(sm, primary), 진행 바.
  - `exceeded`: 상한가 초과. `error4` 바탕 · `error2` 테두리, 현재 최고 입찰가 title02 `black0`, Tag(sm, error), 구분선 `error`, 진행 바 없음.
  - `watching`: 참여 전. 흰 카드, 현재가는 InfoRow `total`, 배지 없음.
- 남은 시간은 `emphasis: 'danger'`(`error1`).
- 진행 바는 ProgressBar 컴포넌트입니다. `progress`는 현재가 ÷ 상한가(0~1). 아래 캡션 caption02 `gray4`.
- 행은 InfoRow라서 `emphasis`를 받아요(상한가 도달은 `totalDanger`).
