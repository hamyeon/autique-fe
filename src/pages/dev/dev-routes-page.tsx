import { Link } from 'react-router'
import { Header } from '@/components/ds'
import { Screen } from '@/layouts/screen'

/* 개발 모드 전용(/dev/routes): 모든 화면 · 상태로 바로 가는 링크 모음. 상세 링크의 id는 src/mocks/data/auctions.ts 기준 */

interface RouteLink {
  to: string
  label: string
  /** 아직 화면이 없는 경로 */
  pending?: boolean
}

const GROUPS: { title: string; links: RouteLink[] }[] = [
  {
    title: '홈',
    links: [
      { to: '/', label: '홈' },
      { to: '/?mock=empty', label: '홈 · 비어 있음' },
      { to: '/?mock=error', label: '홈 · 에러' },
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
      { to: '/register/analyzing', label: 'AI 분석 자리' },
      { to: '/register/4', label: '4/6 바로 가기(앞 단계 미완료면 되돌아감)' },
      { to: '/register/6', label: '6/6 바로 가기(앞 단계 미완료면 되돌아감)' },
      { to: '/register/complete', label: '등록 완료 바로 가기(등록 전이면 되돌아감)' },
    ],
  },
  {
    title: '아직 없는 화면',
    links: [
      { to: '/auctions/2/live', label: '실시간 경매', pending: true },
      { to: '/products', label: '상품 찾기', pending: true },
      { to: '/mypage', label: '마이페이지', pending: true },
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
  return (
    <Screen header={<Header title="개발용 경로" showBack={false} />}>
      <div className="gap-layout-section flex flex-col">
        {GROUPS.map((group) => (
          <section key={group.title} className="gap-section-title flex flex-col">
            <h2 className="text-head03 text-black0">{group.title}</h2>
            <ul className="divide-gray1 border-gray2 flex flex-col divide-y rounded-sm border">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
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
