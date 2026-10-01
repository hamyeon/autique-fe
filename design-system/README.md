# Autique

AI가 상품 정보를 분석하고 시세 기반 가격 판단을 돕는 빈티지 신발 경매 플랫폼 Autique의 디자인 시스템입니다.

새 화면을 만들거나 프론트를 구현할 때는 이 문서 → `tokens.json` → 해당 컴포넌트 README 순서로 읽고, 색·간격·반경은 반드시 토큰 이름으로, UI는 아래 컴포넌트로 조립하세요. 컴포넌트는 `window.Autique.<이름>`으로 쓸 수 있고, 아이콘은 `Autique.Icon`에 Figma 세트 이름과 변형을 넘기면 됩니다(`<Icon name="Search" />`, `<Icon name="Info" size={18} color="primary1" />`).

## 원칙

- **숫자가 주인공.** 경매 앱이라 금액이 가장 중요한 정보입니다. 핵심 금액 하나만 title02 + `primary1`로 크게, 나머지 금액은 body03 `black0`.
- **블루는 '나와 AI', 레드는 '시간과 위험'.** `primary1` 계열은 AI 시세·내 입찰·기회에, `error1` 계열은 남은 시간·LIVE·초과·만료·관심(상품 카드 하트)·입력 에러에만 씁니다. 장식용 색은 없습니다.
- **흑백이 기본.** 배경은 `white0`, 텍스트는 `black0`, 주 버튼도 `black0`. 색은 의미가 있을 때만 들어옵니다.
- **평평하게.** 그림자·그라데이션 없음. 영역은 1px 테두리(`gray2`)와 구분선(`gray1`)으로 나눕니다.

## 시각 기초

**색.** 스타일가이드의 product color(`primary1`~`primary4`), caution color(`error1`~`error4`), gray scale(`white0`, `gray1`~`gray7`, `black0`) 17개가 전부입니다. 숫자가 클수록 연해지는(primary·error) / 진해지는(gray) 구조입니다. 테마는 라이트 하나뿐. 바텀시트 딤만 `black0` 90% 불투명도를 씁니다.

**타이포.** Pretendard 한 가족(Regular 400 · Medium 500 · SemiBold 600 · Bold 700, `fonts/`의 .otf 파일 포함). title(700) · head(600) · body(400~600) · caption(12px) · label(10px) 15단계. 줄 높이는 대부분 160%, 제목·라벨은 140%. 금액 스테퍼 숫자도 title02로, 타입 스케일 밖의 값은 없습니다.

**간격.** 원시값 4 · 8 · 12 · 16 · 20 · 24 · 32 위에 용도 이름을 붙인 의미 토큰을 씁니다: `layout-gutter`(20, 화면 좌우), `layout-top`(16, 헤더 아래), `layout-section`(24, 섹션 사이), `layout-step`(32, 등록 단계 화면), `section-title`(8), `card-padding`(16), `card-row`(8), `stack-tight`(4), `stack-related`(12), `form-field`(16), `form-label`(8). 의미 토큰을 먼저 고르고, 맞는 용도가 없을 때만 `space-N`을 씁니다. Figma의 Spacing / Primitives 변수와 이름이 같습니다(`/` ↔ `-`).

**모서리.** 칩·입력·카드·배너 `radius-sm`(4px), 버튼 `radius-md`(8px), 바텀시트 `radius-lg`(20px, 위쪽만), 진행 바·인디케이터·핸들 `radius-full`. Figma에서는 Radius 변수(`radius/sm`·`md`·`lg`·`full`)로 연결돼 있습니다.

## 컴포넌트

| 그룹 | 컴포넌트 |
| --- | --- |
| Navigation | Header, HomeHeader, SearchHeader, TabBar, SortTabs |
| Actions | Button, BottomButtonBar, FloatingActionButton, LoadMoreButton, LoadMoreDownButton |
| Status · Feedback | Chip, Tag, PageIndicator, ProgressBar, InfoBanner |
| Forms | TextField, Textarea, SegmentedControl, TimeInput, AmountStepper, RadioList, ImageUploadButton, StepHeader, InfoField |
| Auction | BiddingListItem, ProductCard, ProductSummary, SellerProfile, InfoRow, SummaryCard, PriceCard, AuctionStatusCard |
| Overlay | BottomSheet |
| Foundations | Icon, Divider, ImagePlaceholder |

## 화면 골격

375 × 812 iOS 기준. 위에서부터 상태바 44 → 헤더 60 → 콘텐츠(좌우 20) → 하단(BottomButtonBar 78/144 또는 TabBar) → 홈 인디케이터 21. 375는 설계 기준일 뿐 고정 폭이 아닙니다: 헤더·바·본문은 화면 폭을 채우고(좌우 여백 20 유지), 상품 그리드는 2열이 같은 비율로 늘어나며, 상단 이미지와 상품 카드 이미지는 정사각 비율을 유지합니다. 스크롤 화면은 내용 높이만큼 늘어납니다.

- **탭 화면(홈 · 상품 찾기 · 마이페이지):** HomeHeader 또는 SearchHeader → ProductCard 2열 그리드 → FloatingActionButton → TabBar.
- **단계형 폼(경매 등록 1/6~6/6):** Header → StepHeader → 필드들(16 간격; ImageUploadButton 2×2, TextField, SegmentedControl, TimeInput) → BottomButtonBar single.
- **상품 상세:** Header(`trailing="favorite"`) → 정사각 이미지 + PageIndicator → 칩 줄(상태 + 등급, 간격 4) → 상품명(head02) + 영문명 → Divider → InfoRow 일정·가격 행 → SummaryCard(primary) → AI 가격 산정 근거 → 판매자 설명 + SellerProfile → 비슷한 상품(ProductCard 2열). 경매 중·종료 상세에는 SummaryCard 대신 LoadMoreButton('실시간 경매 상황 자세히 보기', '입찰 내역 자세히 보기')이 들어가요.
- **실시간 경매:** Header(`trailing="live"`) → AuctionStatusCard(`leading` · `exceeded` · 참여 전 `watching`) → 입찰 내역(BiddingListItem + 구분선) → InfoBanner → BottomButtonBar triple(참여 전 화면은 자동 입찰하기 · 직접 입찰하기). 상한가 초과 때만 InfoBanner `error`.
- **결과:** 칩 → head01 결과 메시지 → ProductSummary → SummaryCard → InfoBanner → BottomButtonBar. 낙찰 성공은 `triple`(결제하기 / 상품 상세 보기 · 낙찰 포기), 낙찰 실패는 `single`, 결제 기한 만료는 `secondary`(문의하기), 차순위 구매 기회는 `primaryDanger`(구매하기 / 구매 포기). 낙찰 칩은 Chip `best`, 차순위는 `recommend`, 만료는 `caution`.
- **결제:** ProductSummary → SummaryCard → "결제 수단" → RadioList → BottomButtonBar.
- **정보 확인(6/6):** StepHeader → 사진 썸네일 줄 → SummaryCard → InfoField 목록 카드 → BottomButtonBar.
- **바텀시트:** BottomSheet 안에 InfoBanner → InfoRow → AmountStepper → 캡션 → BottomButtonBar.

**화면 여백 규칙.** 모든 화면이 이 규칙을 따라요(Figma 변수에 연결돼 있어요).

| 자리 | 값 | 토큰 |
| --- | --- | --- |
| 화면 좌우 | 20 | `layout-gutter` |
| 헤더 아래 첫 콘텐츠 | 16 | `layout-top` |
| 상단 이미지(상세 · 홈 배너) 아래 첫 콘텐츠 | 24 | `layout-section` |
| 경매 등록 단계 화면: 헤더 아래, StepHeader와 필드 사이 | 32 | `layout-step` |
| 섹션 사이 | 24 | `layout-section` |
| 한 섹션 안 묶음 (섹션 제목 → 그리드, 상품 요약 → 카드, 정보 행 → 더보기 버튼, 판매자 설명 → 프로필) | 16 | `space-16` |
| 카드 → 안내 배너 | 12 | `stack-related` |
| 본문 맨 아래 | 24 | `layout-section` |

- 맨 아래 24 밑에 붙는 BottomButtonBar·TabBar가 위쪽 패딩 12를 더해서, 스크롤 화면에서 마지막 콘텐츠와 버튼 사이는 36으로 보여요.
- 스크롤이 없는 화면은 남는 공간이 본문 아래로 가서 버튼이 화면 맨 아래에 붙어요.
- 앱에서는 헤더와 하단 바가 화면 위아래에 붙어 있지만(sticky) 흐름 안에 자리를 차지해서, 본문 아래 여백은 24면 마지막 콘텐츠가 바에 가려지지 않아요. 노치·홈 인디케이터 여백(safe-area)은 헤더 위·하단 바 아래에 더해요.
- 예외: 가운데 정렬 화면(AI 로딩, 등록 완료, 결제 완료)은 콘텐츠를 세로 가운데에 둬요. iOS 푸시 알림 화면은 시스템 UI라 규칙 밖이에요.

## 아이콘과 일러스트

아이콘은 Figma `Icon/<Name>` 세트 14개(Add, Minus, Info, Search, Bell, Bag, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Favorite, Home, Product, User)이고, 크기(`size`)·모양(`style=line|fill`)·탭 상태(`state=default|active`)가 변형입니다. 1.4~2px 라인이며, 모양은 한 벌이고 색은 인스턴스에서 바꿉니다: 기본 `black0`, 비활성 탭·회색 검색은 `gray5`, 도움말 정보는 `gray4`, 상품 카드 관심 하트는 `error1`(헤더 하트는 `black0`), 배너 정보는 `primary1`/`error1`, 검은 버튼 위는 `white0`. 코드도 같은 규칙으로 `Autique.Icon`의 `color`를 씁니다(SVG는 `currentColor`). 파일 이름은 `<name>-<size>[-<style>].svg`(Assets 탭).

일러스트는 업로드 칸용 신발 4종(`img_shoe_front/side/outsole/defect`, `gray7`)과 로고(`autique-logo.svg`)입니다.

## 접근성 메모

원본 팔레트의 `gray5`(3.95:1), `gray4`(2.8:1), `error1`(3.4:1)은 흰 배경 위 본문 크기 대비 기준 4.5:1에 못 미칩니다. 원본 그대로 두었으니 라벨·캡션·짧은 강조에만 쓰고, 꼭 읽어야 하는 문장에는 `gray6` 이상을 쓰세요.

## 앱과 함께 정한 것

앱을 만들며 정한 규칙으로, Figma에도 같은 변형이 있어요(입력 컴포넌트의 `state=error`·`invalid`, `_FieldError`, BottomButton `primary`·`outline`·`danger`, Header `trailing=favorited`·`showBack`).

- **에러 상태(폼):** TextField · Textarea · TimeInput · SegmentedControl · RadioList · AmountStepper · ImageUploadButton. 테두리 `error1`(포커스 중에도 유지), 메시지는 입력 아래 4px에 caption01 `error1`, 해요체 한 문장. 값을 고치면 바로 풀려요. 사진처럼 여러 칸이면 메시지를 한 줄로 모읍니다("측면, 밑창 사진을 올려 주세요.").
- **값:** Button은 `primary`·`outline`·`danger` 세 가지, SegmentedControl 선택 `black0`, Header 눌린 하트 `black0` 채움(상품 카드 하트는 `error1`), Header 뒤로 가기 없을 때 왼쪽 20, SortTabs 간격 8, 금액 스테퍼 숫자 title02, Chip 높이 22 고정, 상품 카드 금액은 숫자 body03 + '원' body04.
- **동작:** 터치 영역은 겉모양을 바꾸지 않고 44px 안팎으로 넓혀요. 키보드 포커스는 `primary1` 2px 링. 긴 텍스트: 상품 카드 상품명 두 줄, 브랜드·닉네임·헤더 제목 한 줄 말줄임, 배너는 단어 단위 줄바꿈.

## 동기화되지 않은 것

컴포넌트 설명과 토큰 사용 메모는 Figma 파일을 보고 제가 풀어 쓴 것입니다. 아래는 가져오지 않았거나 원본과 다릅니다.

- 카카오페이·네이버페이 로고(`img_kakao_pay`, `img_naver_pay`): 제3자 상표 이미지라 넣지 않았습니다. RadioList의 `badge`로 소비 측에서 제공하세요.
- 상품 썸네일 자리표시(`img_thumb`)와 iOS 상태바·홈 인디케이터: 기기 UI라 컴포넌트로 만들지 않았습니다.
- outline·danger 버튼의 눌림/비활성 상태: 두지 않기로 했습니다.
- 딤 불투명도는 Figma 색 스타일 `overlay/dim`(`black0` 90%)입니다. 토큰에는 따로 두지 않았습니다.
- Figma 화면 안 일부 값(칩·배지 안쪽 간격 2·5·6·7·9·10, 알림 카드 모서리 16)은 4의 배수 체계 밖이라 변수에 연결하지 않았습니다.
- Figma 컴포넌트 안쪽 일부 값(입력칸·세그먼트 안쪽 10, 헤더 오른쪽 18 — LIVE 칩일 때만 20, LIVE 칩 점 간격 5)은 4의 배수 체계 밖이라 변수에 연결하지 않았습니다. 앱 코드도 같은 값을 그대로 씁니다.
