# Button

높이 54px, 모서리 `radius-md`(8px), 텍스트 head03의 버튼으로, 대부분 BottomButtonBar 안에서 화면의 다음 행동을 담당합니다.

| variant | 기본 | 눌림 | 비활성 | 쓰는 곳 |
| --- | --- | --- | --- | --- |
| `primary` | `black0` 배경 · 흰 글자 | `gray7` | `gray5` | 화면의 핵심 행동 하나(입찰하기, 다음, 결제하기) |
| `neutral` | `gray5` 배경 · 흰 글자 | `gray4` | `gray2` | 덜 중요한 채움 버튼(나중에 하기) — Figma BottomButton `variant=secondary` |
| `outline` | 흰 배경 · `gray3` 테두리 | – | – | 하단 바의 보조 행동(취소, 수정) |
| `danger` | 흰 배경 · `error2` 테두리 · `error1` 글자 | – | – | 되돌리기 어려운 행동(예약 취소, 포기) |

- 눌림은 `:active`, 비활성은 `disabled` 속성으로 적용됩니다. outline·danger의 눌림/비활성 모양은 Figma에 없습니다.
- `variant="secondary"`는 예전 이름으로 `outline`과 같습니다.
- 기본은 부모 폭을 꽉 채웁니다(`block`). 인라인으로 쓰려면 `block={false}`.
- 라벨은 동사로 끝나는 짧은 말: "입찰하기", "자동 입찰 예약".
