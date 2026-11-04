import { Link } from 'react-router'
import { Header, InfoBanner } from '@/components/ds'
import { Screen } from '@/layouts/screen'
import { isMockAllOn } from '@/mocks/define'

/*
 * 개발 모드 전용(/dev/routes): 모든 화면 · 상태로 바로 가는 링크 모음. 상세 링크의 id는 src/mocks/data/auctions.ts 기준.
 * 경매 · 주문 API는 실서버로 가므로(src/mocks/config.ts passthrough) 목 경매 링크는 '목 데이터로 보기'를 켜고 엽니다.
 */

interface RouteLink {
  to: string
  label: string
  /** 아직 화면이 없는 경로 */
  pending?: boolean
  /** 페이지를 새로 엽니다(?mock=reset 처럼 페이지를 열 때 읽는 값) */
  reload?: boolean
}

const GROUPS: { title: string; links: RouteLink[] }[] = [
  {
    title: '목 데이터로 보기(?mock=all)',
    links: [
      {
        to: '/dev/routes?mock=all',
        label: '켜기: 이 탭에서 로그인 말고는 모두 목으로',
        reload: true,
      },
      { to: '/dev/routes?mock=off', label: '끄기: 실서버로 되돌리기', reload: true },
    ],
  },
  {
    title: '낙찰 이후(목 데이터로 보기를 켜고)',
    links: [
      { to: '/auctions/13/result', label: '결과 · 낙찰 · 결제 대기(결제 · 구매 포기)' },
      { to: '/auctions/14/result', label: '결과 · 패찰 · 차순위 후보' },
      { to: '/auctions/15/result', label: '결과 · 차순위 제안 받음 → 차순위 구매 기회로' },
      { to: '/auctions/16/result', label: '결과 · 결제 기한 만료(노쇼)' },
      { to: '/auctions/4/result', label: '결과 · 참여하지 않은 경매' },
      { to: '/auctions/19/result', label: '결과 · 유찰' },
      { to: '/auctions/999/result', label: '결과 · 없는 경매' },
      { to: '/auctions/13/result?mock=error', label: '결과 · 에러' },
      { to: '/orders/50', label: '결제(주문 50) → 결제 완료' },
      { to: '/orders/51', label: '결제 · 기한 만료 주문' },
      { to: '/backup-offers/90', label: '차순위 구매 기회(구매 · 포기)' },
      { to: '/products/4', label: '종료된 상품 상세 → 내 경매 결과 보기' },
      {
        to: '/dev/routes?mock=reset',
        label: '목 상태 초기화(결제 · 포기한 것 되돌리기)',
        reload: true,
      },
    ],
  },
  {
    title: '알림 · 판매자 관리(목 데이터로 보기를 켜고)',
    links: [
      { to: '/notifications', label: '알림 목록(안 읽은 3개, 누르면 해당 화면으로)' },
      { to: '/notifications?mock=empty', label: '알림 · 비어 있음' },
      { to: '/notifications?mock=error', label: '알림 · 에러' },
      { to: '/products/18', label: '내 경매 · 예정(경매 취소 · 시작가 수정)' },
      { to: '/products/19', label: '내 경매 · 유찰(재경매 등록)' },
      { to: '/products/17', label: '내 경매 · 진행 중(하단 없음)' },
      { to: '/products/19/relist', label: '재경매 등록 화면' },
      { to: '/products/2/relist', label: '재경매 · 할 수 없는 경매' },
    ],
  },
  {
    title: '경매 AI Agent(API 연결 전 데모 · ?scenario=)',
    links: [
      { to: '/agent', label: '01 온보딩(말풍선 하나씩 → 조건 보내면 확인 시트)' },
      { to: '/agent?scenario=confirm', label: '조건 확인 대기(버튼을 누르면 확인 시트)' },
      { to: '/agent?scenario=searching', label: '02 탐색 중(“취소” 입력 → 바로 취소)' },
      { to: '/agent?scenario=found', label: '03-1 경매 찾기 성공' },
      { to: '/agent?scenario=bidding', label: '03-2 자동 입찰 중(“취소” 입력 → 취소 요청)' },
      { to: '/agent?scenario=won', label: '03-3 낙찰 성공(결제 링크)' },
      { to: '/agent?scenario=lost', label: '03-4 낙찰 실패 · 다시 탐색' },
      { to: '/agent?scenario=not-found', label: '03-5 조건에 맞는 경매 없음' },
      { to: '/agent?scenario=loading', label: '불러오는 중' },
      { to: '/agent?scenario=error', label: '에러' },
    ],
  },
  {
    title: '홈',
    links: [
      { to: '/', label: '홈' },
      { to: '/?mock=empty', label: '홈 · 비어 있음' },
      { to: '/?mock=error', label: '홈 · 에러' },
    ],
  },
  {
    title: '경매 리스트 · 마이페이지',
    links: [
      { to: '/products', label: '경매 리스트 · 인기순' },
      { to: '/products?sort=latest', label: '경매 리스트 · 최신순' },
      { to: '/products?mock=empty', label: '경매 리스트 · 비어 있음' },
      { to: '/products?mock=error', label: '경매 리스트 · 에러' },
      { to: '/search', label: '검색(입력 전)' },
      { to: '/search?q=나이키', label: '검색 결과 · 나이키' },
      { to: '/search?q=asics', label: '검색 결과 · asics(대소문자 무시)' },
      { to: '/search?q=없는상품', label: '검색 결과 · 없음' },
      { to: '/search?q=나이키&mock=error', label: '검색 결과 · 에러' },
      { to: '/my', label: '마이페이지' },
      { to: '/my?mock=empty', label: '마이페이지 · 이메일 없는 계정(목록은 비어 있음)' },
      { to: '/my?mock=error', label: '마이페이지 · 에러(프로필 자리만)' },
      { to: '/my/selling', label: '내가 판매했던 상품(목: 진행 중 17 · 18 → 종료 19)' },
      { to: '/my/participating', label: '내가 참여했던 상품(진행 중 → 종료)' },
      { to: '/my/likes', label: '위시리스트(처음엔 비어 있음 · 하트를 누르면 추가)' },
      { to: '/my/likes?mock=error', label: '위시리스트 · 에러' },
      { to: '/login', label: '로그인(로그인 상태면 홈으로)' },
      { to: '/login/kakao?error=access_denied', label: '카카오 콜백 · 동의 취소(로그인 화면으로)' },
      { to: '/login/kakao?code=x&state=x', label: '카카오 콜백 · 요청 만료(state 불일치)' },
    ],
  },
  {
    title: '상품 상세 · 경매 예정',
    links: [
      { to: '/products/1', label: '나이키 에어포스 1 로우 화이트' },
      { to: '/products/3', label: '반스 x 베이프 프리미엄 뉴스쿨 카모 그린' },
      { to: '/products/18', label: '내가 판매자(버튼 잠김)' },
    ],
  },
  {
    title: '상품 상세 · 경매 중',
    links: [
      { to: '/products/2', label: '살로몬 XT-6 ADV 블랙' },
      { to: '/products/20', label: '내가 최고 입찰자 · 자동입찰 중' },
      { to: '/products/17', label: '내가 판매자(버튼 잠김)' },
    ],
  },
  {
    title: '상품 상세 · 경매 종료',
    links: [
      { to: '/products/4', label: '나이키 덩크 로우 레트로 블랙 화이트' },
      { to: '/products/19', label: '유찰(입찰 0건)' },
    ],
  },
  {
    title: '자동 입찰',
    links: [
      { to: '/products/1', label: '설정 전 · 경매 예정' },
      { to: '/products/2', label: '설정 전 · 경매 중' },
      { to: '/products/12', label: '설정 후 · 경매 예정(예약 중 120,000원)' },
      { to: '/products/20', label: '설정 후 · 경매 중(자동 입찰 중 150,000원)' },
      { to: '/products/2?mock=autobid-outbid', label: '제출 시 현재가가 올라감(한 번)' },
      { to: '/products/1?mock=autobid-ended', label: '제출 시 경매 종료' },
      { to: '/products/1?mock=autobid-error', label: '제출 시 서버 오류(다시 시도하면 성공)' },
      { to: '/products/1?mock=error', label: '모든 API 에러(상세부터 실패)' },
      { to: '/dev/routes?mock=reset', label: '목 상태 초기화', reload: true },
    ],
  },
  {
    title: '실시간 경매',
    links: [
      { to: '/auctions/2/live', label: '참여 전(watching)' },
      { to: '/auctions/20/live', label: '자동 입찰 중 · 최고가(leading)' },
      { to: '/auctions/11/live', label: '내가 밀림 · 상대 자동 입찰 있음(exceeded)' },
      { to: '/auctions/17/live', label: '내가 판매자(버튼 잠김)' },
      { to: '/auctions/2/live?mock=ending', label: '30초 후 종료 → 결과 화면' },
      { to: '/auctions/2/live?mock=busy', label: '다른 입찰이 1초마다' },
      { to: '/auctions/2/live?mock=quiet', label: '다른 입찰 없음' },
      { to: '/auctions/2/live?mock=bid-outbid', label: '직접 입찰 제출 시 이미 더 높은 입찰' },
      { to: '/auctions/2/live?mock=error', label: '에러' },
      { to: '/auctions/2/live?mock=empty', label: '입찰 내역 없음' },
      { to: '/auctions/12/live', label: '시작 전 경매' },
      { to: '/auctions/999/live', label: '없는 경매' },
      { to: '/dev/routes?mock=reset', label: '목 상태 초기화', reload: true },
    ],
  },
  {
    title: '상품 상세 · 상태',
    links: [
      { to: '/products/999', label: '없는 상품(찾을 수 없어요)' },
      { to: '/products/1?mock=error', label: '에러' },
      { to: '/products/1?mock=empty', label: '비슷한 상품 없음' },
    ],
  },
  {
    title: '경매 등록(뼈대: 입력 UI 없음)',
    links: [
      { to: '/register', label: '처음부터(첫 미완료 단계로)' },
      { to: '/register/1', label: '1/6 상품 이미지 업로드' },
      { to: '/register/1?mock=photo-mismatch', label: '1/6 · 밑창 촬영 면 불일치(사진을 고르면)' },
      { to: '/register/analyzing', label: 'AI 분석 자리' },
      { to: '/register/4', label: '4/6 바로 가기(앞 단계 미완료면 되돌아감)' },
      { to: '/register/6', label: '6/6 바로 가기(앞 단계 미완료면 되돌아감)' },
      { to: '/register/complete', label: '등록 완료 바로 가기(등록 전이면 되돌아감)' },
    ],
  },
  {
    title: '개발용',
    links: [
      { to: '/design-system', label: '디자인 시스템' },
      { to: '/design-system/screen-demo', label: 'Screen 데모' },
    ],
  },
]

export function DevRoutesPage() {
  const mockAll = isMockAllOn()
  return (
    <Screen header={<Header title="개발용 경로" showBack={false} />}>
      <div className="gap-layout-section flex flex-col">
        <InfoBanner tone={mockAll ? 'error' : 'default'}>
          {mockAll
            ? '목 데이터로 보기가 켜져 있어요. 이 탭에서는 로그인 말고 모두 목 데이터예요.'
            : '목 데이터로 보기가 꺼져 있어요. 경매 · 주문은 실서버 데이터예요.'}
        </InfoBanner>
        {GROUPS.map((group) => (
          <section key={group.title} className="gap-section-title flex flex-col">
            <h2 className="text-head03 text-black0">{group.title}</h2>
            <ul className="divide-gray1 border-gray2 flex flex-col divide-y rounded-sm border">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    reloadDocument={link.reload}
                    className="px-space-12 gap-space-8 focus-visible:outline-primary1 flex min-h-11 items-center justify-between focus-visible:outline-2"
                  >
                    <span className="text-body04 text-black0">
                      {link.label}
                      {link.pending && (
                        <span className="text-caption02 text-gray4"> · 준비 중</span>
                      )}
                    </span>
                    <span className="text-caption02 text-gray5 shrink-0">{link.to}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Screen>
  )
}
