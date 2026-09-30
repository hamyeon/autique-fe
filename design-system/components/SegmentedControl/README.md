# SegmentedControl

2~4개 선택지 중 하나를 고르는 가로 버튼 묶음으로, 각 칸은 40px 높이·body05입니다(Figma SegmentedControl, 칸 하나는 `_SegmentItem`).

| 상태 | 모양 |
| --- | --- |
| 기본 | 흰 배경, `gray2` 테두리, `black0` 글자 |
| 눌림 | `gray2` 배경 |
| 선택 | `gray6` 채움, 흰 글자 |
| 비활성 | `gray2` 배경, `gray5` 글자 |

- 쓰는 곳: 구성품 여부처럼 짧고 배타적인 선택.
- 제어형(`value` + `onChange`) 또는 비제어형(`defaultValue`) 모두 됩니다. 비활성 선택지는 `disabledOptions`.
- 소비 측이 제공: `options`, 값, `label`.
