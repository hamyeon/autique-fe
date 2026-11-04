import { endpoints } from '@/api/endpoints'
import { addGoal, cancelGoal, findGoal, listGoals, mockParse } from '@/mocks/data/purchase-goals'
import { idParam, mockEndpoint } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

/* 구매 목표(경매 AI Agent · 쇼핑메이트 PIKI). 실서버 응답 모양 · 오류는 2026-11-04 개발 토큰으로 확인 */
export const purchaseGoalHandlers = [
  /** 실서버는 AI 해석에 몇 초 걸려 목도 조금 기다립니다. */
  mockEndpoint(endpoints.parsePurchaseGoal, {
    error: mockErrors.AI_CALL_FAILED,
    resolve: async ({ body, ok }) => {
      await new Promise((r) => setTimeout(r, 1200))
      return ok(mockParse(body.text))
    },
  }),

  mockEndpoint(endpoints.createPurchaseGoal, {
    error: mockErrors.INVALID_REQUEST,
    resolve: ({ body, ok, fail }) => {
      if (Date.parse(body.deadline) <= Date.now())
        return fail(mockErrors.PURCHASE_GOAL_DEADLINE_PAST(body.deadline))
      return ok(addGoal(body), 201)
    },
  }),

  mockEndpoint(endpoints.getPurchaseGoals, {
    error: mockErrors.UNAUTHORIZED,
    empty: ({ ok }) => ok([]),
    resolve: ({ ok }) => ok(listGoals()),
  }),

  mockEndpoint(endpoints.getPurchaseGoal, {
    error: mockErrors.PURCHASE_GOAL_NOT_FOUND(0),
    resolve: ({ params, ok, fail }) => {
      const id = idParam(params, 'id')
      const goal = findGoal(id)
      return goal ? ok(goal) : fail(mockErrors.PURCHASE_GOAL_NOT_FOUND(id))
    },
  }),

  mockEndpoint(endpoints.cancelPurchaseGoal, {
    error: mockErrors.INVALID_PURCHASE_GOAL_STATUS('CANCELLED'),
    resolve: ({ params, ok, fail }) => {
      const id = idParam(params, 'id')
      const result = cancelGoal(id)
      if (!result) return fail(mockErrors.PURCHASE_GOAL_NOT_FOUND(id))
      if (result.conflict) return fail(mockErrors.INVALID_PURCHASE_GOAL_STATUS(result.conflict))
      return ok(result.cancelled)
    },
  }),
]
