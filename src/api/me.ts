import { useQuery } from '@tanstack/react-query'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'

export const meKeys = {
  all: ['me'] as const,
  penalties: () => [...meKeys.all, 'penalties'] as const,
}

/* ───────── API 함수 ───────── */

/** noShowCount · bidRestricted · bidRestrictedUntil의 single source of truth */
export function getMyPenalties(signal?: AbortSignal) {
  return request(endpoints.getMyPenalties, { signal })
}

/* ───────── 훅 ───────── */

export function usePenaltiesQuery() {
  return useQuery({
    queryKey: meKeys.penalties(),
    queryFn: ({ signal }) => getMyPenalties(signal),
  })
}
