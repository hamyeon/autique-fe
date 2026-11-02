import { BottomButtonBar } from '@/components/ds'

/*
 * 구매 에이전트(경매 AI Agent)가 관리 중인 경매. 명세: managedByPurchaseAgent=true면
 * 직접 입찰 · 자동입찰 수정 · 중단이 40917로 막히므로 버튼을 미리 막고 이유를 알립니다.
 * canBid · canModify · canCancel에는 이 제한이 반영되지 않아 따로 봅니다.
 */

/** 상세 · 실시간 · 입찰 시트 공통 안내 */
export const AGENT_MANAGED_NOTICE =
  '경매 AI Agent가 관리 중인 경매라 상한가 수정, 입찰 중단, 직접 입찰은 할 수 없어요.'

/** 에이전트가 관리 중일 때 하단: 누를 수 없는 버튼 하나 */
export function AgentManagedBottom() {
  return <BottomButtonBar layout="single" primaryLabel="AI Agent가 입찰 중이에요" primaryDisabled />
}
