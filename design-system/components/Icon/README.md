# Icon

Figma `Icon/<Name>` 세트 14개를 그리는 컴포넌트로, 이름과 크기·스타일·상태 속성이 Figma 변형과 같습니다.

| name | size | 그 밖의 속성 | 쓰는 곳 |
| --- | --- | --- | --- |
| `Add` · `Minus` | 24 · 20 | | 금액 스테퍼(24), 플로팅 버튼(20, 흰색) |
| `Info` | 24 · 18 | | 단계 제목 옆 도움말(24, `gray4`), InfoBanner(18, `primary1`/`error1`) |
| `Search` · `Bell` · `Bag` | 24 | | 홈 헤더, 검색창(`gray5`) |
| `ArrowLeft` | 36 | | 헤더 뒤로 가기 |
| `ArrowRight` | 16 · 36 | | 더보기 버튼(16) |
| `ArrowUp` | 20 | | |
| `ArrowDown` | 16 · 20 | | 펼침 버튼(16) |
| `Favorite` | 24 | `style`: `line` · `fill` | 헤더(`black0`: 기본 선, 관심 시 채움), 상품 카드(`error1`) |
| `Home` · `Product` · `User` | 24 | `state`: `default` · `active` | 탭 바 |

- SVG는 `currentColor`로 칠해집니다. `color`에 색 토큰 이름(`black0`, `gray5`, `primary1`, `error1`, `white0` …)을 넘기거나, 주변 글자색을 따르게 두세요. Figma도 마스터는 `black0`이고 인스턴스에서 색만 바꿉니다.
- `Home`·`Product`·`User`는 `color`가 없으면 `state`에 따라 `gray5`(default)·`black0`(active)입니다.
- 새 색이 필요하면 아이콘을 복제하지 말고 `color`만 바꿉니다. 새 모양이 필요하면 Figma에 세트를 먼저 추가합니다.
- 예전 이름(`icn_search_24px` 등)도 같은 모양·색으로 그려지지만, 새 코드에서는 쓰지 마세요.
- 일러스트(`img_shoe_front` 등)와 로고(`autique-logo`)도 `name`으로 그릴 수 있습니다.
- 뜻이 있는 단독 아이콘에는 `label`을 넘기면 `role="img"`로 읽힙니다. 버튼 안 아이콘은 버튼에 `aria-label`을 답니다.
