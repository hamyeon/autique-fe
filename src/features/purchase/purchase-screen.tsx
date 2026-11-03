import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { BottomButtonBar, Button, Header } from '@/components/ds'
import { EmptyState, ErrorState } from '@/components/feedback'
import { Screen } from '@/layouts/screen'
import { isNotFoundError } from '@/features/purchase/purchase'
import { PurchaseSummarySkeleton } from '@/features/purchase/purchase-summary'

/*
 * 낙찰 이후 화면(경매 결과 · 결제 · 차순위 구매 기회)의 불러오는 중 · 실패 · 없음 화면.
 * 본문은 각 화면이 PurchaseSummary + 하단 버튼으로 그립니다.
 */

/** 결제할 수 없는 상태(결제 완료 · 기한 만료 · 패찰 등)의 하단: 검정 '다른 상품 둘러보기' 하나(사용자 결정, 2026-11-03) */
export function BrowseBottom() {
  const navigate = useNavigate()
  return (
    <BottomButtonBar
      layout="single"
      primaryLabel="다른 상품 둘러보기"
      onPrimary={() => navigate('/products')}
    />
  )
}

interface PurchaseStateScreenProps {
  title: string
  /** 주소의 ID가 숫자가 아님 등 요청 없이도 없는 경우 */
  invalid?: boolean
  /** 불러오는 중이면 스켈레톤 */
  pending: boolean
  error: unknown
  notFoundTitle: string
  errorTitle: string
  retrying: boolean
  onRetry: () => void
}

/** pending · error 중 하나일 때 그 상태 화면. 둘 다 아니면 null */
export function PurchaseStateScreen({
  title,
  invalid = false,
  pending,
  error,
  notFoundTitle,
  errorTitle,
  retrying,
  onRetry,
}: PurchaseStateScreenProps): ReactNode {
  const navigate = useNavigate()
  const header = <Header title={title} />

  if (invalid || isNotFoundError(error)) {
    return (
      <Screen header={header} className="justify-center">
        <EmptyState
          title={notFoundTitle}
          description="주소가 잘못되었거나 내 정보가 아니에요"
          action={
            <Button block={false} onClick={() => navigate('/', { replace: true })}>
              홈으로
            </Button>
          }
        />
      </Screen>
    )
  }
  if (pending) {
    return (
      <Screen header={header}>
        <PurchaseSummarySkeleton />
      </Screen>
    )
  }
  return (
    <Screen header={header} className="justify-center">
      <ErrorState title={errorTitle} retrying={retrying} onRetry={onRetry} />
    </Screen>
  )
}
