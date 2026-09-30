# InfoRow

라벨–값 한 줄로, 왼쪽에 라벨(body05 `gray5`), 오른쪽 끝에 값을 둡니다(Figma InfoRow). 상세·결과·결제 화면의 정보 행과 모든 카드 안의 행이 이것입니다.

| emphasis | 값 스타일 | 쓰는 곳 |
| --- | --- | --- |
| `default` | body03 `black0` | 대부분의 금액·값 |
| `regular` | body04 `black0` | 날짜·상태처럼 강조가 필요 없는 값 |
| `primary` | body03 `primary1` | 시작가처럼 AI·나와 관련된 금액 |
| `danger` | body03 `error1` | 남은 시간, 참여 제한 |
| `total` | head02 `primary1` | 결제할 금액, 참여 전 카드의 현재가 |
| `totalDanger` | head02 `error1` | 상한가 도달 |
| `hero` | title02 `primary1` | AI 적정 시세처럼 카드의 대표 금액 |

- 양 끝 정렬이라 값 길이가 달라져도 밀리지 않아요. 라벨–값 사이 최소 간격 `space-8`.
- 카드 안에서 행끼리는 `card-row`(8) 간격.
- 예전 `tone: 'danger' | 'primary'`도 같은 뜻으로 받아요.
