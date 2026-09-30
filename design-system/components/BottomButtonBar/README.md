# BottomButtonBar

화면 하단(홈 인디케이터 바로 위)에 고정되는 버튼 영역으로, 좌우 20px·상하 12px 패딩 안에 Button을 배치합니다.

Figma 변형 이름(`layout`) 그대로 받습니다. 예전 이름 `layout4`·`layout5`도 계속 동작합니다:

| layout | 구성 | 쓰는 곳 |
| --- | --- | --- |
| `single` | primary 1개 (78px) | 대부분의 화면: 다음, 입찰하기 |
| `double` | primary + secondary 가로 | 두 선택지가 대등할 때 |
| `triple` | primary / secondary + danger (144px) | 실시간 경매: 입찰 · 수정 · 취소 |
| `secondary` | outline 1개 | 주 행동이 없는 화면: 문의하기 (예전 `layout4`) |
| `primaryDanger` | primary / danger 세로 (144px) | 결과 화면: 구매 · 포기 (예전 `layout5`) |

- 소비 측이 제공: 라벨(`primaryLabel`, `secondaryLabel`, `dangerLabel`)과 핸들러.
- 한 바에 primary는 최대 1개.
