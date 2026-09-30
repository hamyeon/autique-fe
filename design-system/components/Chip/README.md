# Chip

상품·경매·입찰 상태를 짧은 말로 보여주는 22px 높이 라벨(label01, 모서리 `radius-sm`)입니다.

| kind | 모양 | 의미 (Figma 이름) |
| --- | --- | --- |
| `plan` | `black0` 채움 | 경매 예정 · 낙찰 (chip_plan default) |
| `finish` | `gray5` 채움 | 경매 종료 (chip_plan finish) |
| `live` | `error1` 채움 + 흰 점 | 진행 중인 실시간 경매 (chip_plan live) |
| `level` | `gray1` 채움 | 상품 등급: A등급 (chip_level) |
| `best` | `primary1` 채움 | 입찰 내역에서 내가 최고가 (chip_best Default) |
| `worst` | `error1` 채움 | 다른 사람이 최고가, 내가 밀림 (chip_best Variant2) |
| `caution` | 흰 바탕 `error2` 테두리 | 결제 기한 만료 같은 문제 상태 (chip_caution) |
| `recommend` | 흰 바탕 `primary2` 테두리 | 차순위 구매 대기 같은 기회 (chip_recommand) |

- 상태 칩 + 등급 칩을 4px(`stack-tight`) 간격으로 나란히 두는 것이 기본 조합입니다.
- 텍스트는 명사형 2~8자.
