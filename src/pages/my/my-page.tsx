import { useNavigate } from 'react-router'
import { useLogoutMutation } from '@/api/auth'
import { useMyProfileQuery } from '@/api/me'
import {
  Divider,
  Header,
  Icon,
  MyPageListButton,
  MyPageMenuSection,
  SellerProfile,
  TabBar,
} from '@/components/ds'
import { ErrorState, Skeleton } from '@/components/feedback'
import { usePressed } from '@/hooks/use-pressed'
import { Screen } from '@/layouts/screen'
import { showPreparingToast } from '@/stores/toast-store'

/** 아직 연결하지 않은 메뉴를 눌렀을 때 안내 */
const notifyPreparing = showPreparingToast

/**
 * 마이페이지 탭(Figma 마이페이지 957:1951): 프로필 → 8px 띠 → 메뉴 그룹 3개(사이 12) + TabBar.
 * 로그인이 필요해 RequireAuth 안에 있습니다.
 * 로그아웃은 먼저 홈으로 옮긴 뒤 서버 무효화를 보냅니다(성공 여부와 관계없이 로컬 토큰 · 캐시를 비움).
 * 토큰을 먼저 비우면 RequireAuth가 이 화면을 /login으로 보내기 때문입니다.
 */
export function MyPage() {
  const navigate = useNavigate()
  const logout = useLogoutMutation()
  const handleLogout = () => {
    navigate('/', { replace: true })
    logout.mutate()
  }

  return (
    <Screen
      top="none"
      header={<Header title="마이페이지" showBack={false} trailing="actions" />}
      bottom={<TabBar active="mypage" />}
    >
      <div className="-mx-layout-gutter gap-space-12 flex flex-col">
        <ProfileSection />
        <MyPageMenuSection title="나의 경매">
          <MyPageListButton href="/my/auctions/ongoing">현재 경매 중인 상품</MyPageListButton>
          <MyPageListButton href="/my/auctions/ended">과거 경매했던 상품</MyPageListButton>
        </MyPageMenuSection>
        <MyPageMenuSection title="쇼핑">
          <MyPageListButton href="/my/likes">관심 목록</MyPageListButton>
          <MyPageListButton onClick={notifyPreparing}>경매 AI Agent 설정</MyPageListButton>
        </MyPageMenuSection>
        <MyPageMenuSection title="고객센터">
          <MyPageListButton onClick={notifyPreparing}>약관 및 정책</MyPageListButton>
          <MyPageListButton showArrow={false} onClick={handleLogout}>
            로그아웃
          </MyPageListButton>
        </MyPageMenuSection>
      </div>
    </Screen>
  )
}

/** 프로필 행(위아래 20 · 왼쪽 20 · 오른쪽 8, SellerProfile lg + 화살표 36) + 8px 띠. [ASSUMED] GET /api/me */
function ProfileSection() {
  const profile = useMyProfileQuery()
  const { pressed, handlers } = usePressed()
  const ROW = 'py-space-20 pl-layout-gutter pr-space-8 flex w-full items-center'

  let row
  if (profile.isPending) {
    row = (
      <div aria-hidden className={`${ROW} gap-space-12`}>
        <Skeleton className="size-15 shrink-0 rounded-full" />
        <div className="gap-space-8 flex flex-1 flex-col">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    )
  } else if (profile.isError) {
    // 프로필만 실패해도 메뉴는 쓸 수 있게 이 자리에서만 에러를 보여줍니다.
    row = (
      <ErrorState
        title="내 정보를 불러오지 못했어요"
        description={null}
        retrying={profile.isRefetching}
        onRetry={() => profile.refetch()}
        className="py-space-20"
      />
    )
  } else {
    const { nickname, email, profileImageUrl } = profile.data
    row = (
      <button
        type="button"
        onClick={notifyPreparing}
        data-pressed={pressed ? '' : undefined}
        {...handlers}
        className={`${ROW} data-pressed:bg-gray0 focus-visible:outline-primary1 justify-between text-left focus-visible:outline-2 focus-visible:-outline-offset-2`}
      >
        <SellerProfile
          size="lg"
          name={`${nickname}님 안녕하세요!`}
          meta={email ?? undefined}
          avatar={profileImageUrl ?? undefined}
          className="flex-1"
        />
        <Icon name="ArrowRight" size={36} />
      </button>
    )
  }

  return (
    <div className="flex flex-col">
      {row}
      <Divider size="section" />
    </div>
  )
}
