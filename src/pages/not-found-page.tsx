import { useNavigate } from 'react-router'
import { Button } from '@/components/ds'
import { EmptyState } from '@/components/feedback'
import { Screen } from '@/layouts/screen'

/** 없는 주소. 상품 · 경매를 찾을 수 없을 때와 같은 모양(EmptyState + primary '홈으로') */
export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Screen className="justify-center">
      <EmptyState
        title="페이지를 찾을 수 없어요"
        description="주소가 잘못되었거나 없어진 페이지예요"
        action={
          <Button block={false} onClick={() => navigate('/', { replace: true })}>
            홈으로
          </Button>
        }
      />
    </Screen>
  )
}
