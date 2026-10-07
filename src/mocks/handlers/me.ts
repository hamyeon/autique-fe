import { endpoints } from '@/api/endpoints'
import { kst } from '@/mocks/data/common'
import { toPenalties } from '@/mocks/data/me'
import { mockEndpoint } from '@/mocks/define'
import { mockErrors } from '@/mocks/errors'

export const meHandlers = [
  mockEndpoint(endpoints.getMyPenalties, {
    error: mockErrors.UNAUTHORIZED,
    empty: ({ ok }) =>
      ok({
        noShowCount: 0,
        bidRestricted: false,
        bidRestrictedUntil: null,
        serverTime: kst(Date.now()),
        penalties: [],
      }),
    resolve: ({ ok }) => ok(toPenalties()),
  }),
]
