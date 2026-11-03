import { useNavigate, useParams } from 'react-router'
import { BottomButtonBar } from '@/components/ds'
import { CompleteIllustration } from '@/components/feedback'
import { Screen } from '@/layouts/screen'

/**
 * 결제 완료 (/orders/:id/complete. Figma 396:6432). 결제 화면 자리를 바꿔 넣으므로 뒤로 가기는 결제 전 화면(경매 결과 등)으로 갑니다.
 * 배송 기능이 없어(명세: 기능 구현 X) Figma의 '마이페이지에서 배송 현황 확인' 문장은 뺐습니다(DESIGN-CHANGES.md).
 */
export function OrderCompletePage() {
  const navigate = useNavigate()
  const { id } = useParams()

  return (
    <Screen
      className="gap-layout-section items-center justify-center text-center"
      bottom={
        <BottomButtonBar
          layout="single"
          primaryLabel="주문 상세 보기"
          onPrimary={() => navigate(`/orders/${id}`, { replace: true })}
        />
      }
    >
      <CompleteIllustration />
      <div className="gap-space-8 flex flex-col items-center">
        <p className="text-head01 text-black0">결제가 완료되었어요.</p>
        <p className="text-body06 text-gray6">판매자가 상품을 배송할 예정이에요.</p>
      </div>
    </Screen>
  )
}
