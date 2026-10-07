import { useNavigate, useParams } from 'react-router'
import { Button, Header } from '@/components/ds'
import { EmptyState } from '@/components/feedback'
import { Screen } from '@/layouts/screen'

/** 경매 결과 (/auctions/:id/result). 결과 화면 작업 전까지의 자리입니다. 실시간 경매가 끝나면 이리로 replace 이동합니다. */
export function AuctionResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toDetail = () => navigate(`/products/${id}`, { replace: true })

  return (
    <Screen header={<Header title="경매 결과" onBack={toDetail} />} className="justify-center">
      <EmptyState
        title="경매가 끝났어요"
        description="결과 화면은 준비 중이에요."
        action={
          <Button variant="outline" block={false} onClick={toDetail}>
            상품 상세로
          </Button>
        }
      />
    </Screen>
  )
}
