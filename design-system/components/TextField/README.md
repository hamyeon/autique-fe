# TextField

라벨(head03) 아래 8px 간격으로 50px 높이 입력창(body02, `gray2` 테두리, `radius-sm`)을 두는 한 줄 입력 필드입니다.

| 상태 (Figma Input) | 모양 |
| --- | --- |
| default | 흰 배경, `gray2` 테두리, placeholder `gray5` |
| filled | 입력값 `black0` |
| focus | 테두리 `primary1` |
| disabled | `gray1` 배경, 글자 `gray5` |
| error | 테두리 `error1`(포커스 중에도 유지), 입력 아래 4px에 caption01 `error1` 메시지 |

- 필드끼리는 16px 간격으로 쌓습니다.
- 네이티브 `input` 속성(value, onChange, placeholder, disabled…)을 그대로 넘깁니다. 앱 코드는 ref가 input으로 가서 React Hook Form `register`와 바로 연결됩니다.
- 에러 메시지는 `error`로 넘깁니다: "브랜드를 입력해 주세요.", "20자 이내로 입력해 주세요."
