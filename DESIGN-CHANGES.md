# DESIGN-CHANGES

Figma와 다르게 구현했거나 Figma에 없어서 새로 정한 부분을 기록합니다. 디자이너와 맞춰 볼 때 이 문서를 기준으로 봐 주세요.

## 홈 (Figma `홈` 572:7790)

### Figma에 없는 상태 화면 (DS 톤으로 정함)

- **로딩** (`ProductGridSkeleton`)
  - 섹션 제목은 그대로 두고, 그리드 자리에 ProductCard 모양 스켈레톤 4장(gray1, pulse)
- **비어 있음** (`EmptyState`)
  - 배너 아래에 Product 아이콘(gray4) → "아직 열린 경매가 없어요"(head03) → "새 경매가 등록되면 여기에서 보여드릴게요."(body05 gray5)
  - 가운데 정렬, 위아래 32
- **에러** (`ErrorState`)
  - 배너 아래에 Info 아이콘(error1) → "경매 목록을 불러오지 못했어요" → "잠시 후 다시 시도해 주세요." → outline 버튼 "다시 시도"
- **다음 페이지 불러오는 중** (`ProductCardSkeleton`)
  - 그리드 끝에 스켈레톤 2장(한 줄)
- **다음 페이지 실패** (`ErrorState`)
  - 그리드 아래에 "더 불러오지 못했어요" + "다시 시도" (설명 없이 작게)

공통

- 상태 컴포넌트는 `src/components/feedback/`에 있고 `/design-system`의 Feedback 섹션에서 볼 수 있습니다.
- 서버 오류 메시지는 개발자용이라 화면에 그대로 보여주지 않고, 위의 고정 문구를 씁니다.

### Figma와 다르게 구현한 부분

- **지금 인기 있는 경매**
  - Figma: 카드 4장 + LoadMoreButton "더 많은 경매 보러가기"
  - 구현: 8장씩 무한 스크롤. 끝까지 불러오면 같은 LoadMoreButton을 보여주고 `/products`로 이동
  - 이유: 요구사항(목록이 길면 무한 스크롤). Figma 요소는 목록 끝에 유지
- **상단 배너 PageIndicator**
  - Figma: 두 번째 점이 현재 위치
  - 구현: 첫 번째 점이 현재 위치로 고정
  - 이유: 배너 API·이미지가 없어 넘김 없이 첫 장만 보여줌
- **ProductCard 상태**
  - Figma: `planned` · `live` 두 가지
  - 구현: `ended` 추가. Chip `finish` "경매 종료" + 가격 라벨 "최종가"
  - 이유: 홈 목록에 종료된 경매가 섞여 나옴. 칩은 Figma Chip의 `finish` 종류를 그대로 사용
- **ProductCard 탭**
  - Figma: 인터랙션 정의 없음
  - 구현: `href`를 주면 카드 아무 곳이나 눌러 `/products/:auctionId`로 이동, 하트는 따로 눌림
  - 이유: 상품 상세로 가는 진입점
- **등급 칩 문구**
  - Figma: "A등급"
  - 구현: `A`/`B`/`C`/`S` → "N등급", `DS` → "새상품", `UNKNOWN` → 칩 숨김
  - 이유: 명세 등급 값이 Figma 예시보다 많음
- **FloatingActionButton 위치**
  - Figma: 프레임 오른쪽 아래(스크롤해도 고정)
  - 구현: TabBar 위 20, 오른쪽 20(`layout-gutter`)에 고정
  - 이유: DS README "TabBar 위 오른쪽 20px"
- **HomeHeader 검색 · 알림 · 장바구니**
  - Figma: 버튼
  - 구현: 버튼은 있지만 아직 연결하지 않음
  - 이유: 해당 화면은 이번 범위 밖
