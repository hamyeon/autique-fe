import { useQuery } from '@tanstack/react-query'
import { request } from '@/api/client'
import { endpoints } from '@/api/endpoints'

export const meKeys = {
  all: ['me'] as const,
  penalties: () => [...meKeys.all, 'penalties'] as const,
  profile: () => [...meKeys.all, 'profile'] as const,
}

/* ───────── API 함수 ───────── */

/** noShowCount · bidRestricted · bidRestrictedUntil의 single source of truth */
export function getMyPenalties(signal?: AbortSignal) {
  return request(endpoints.getMyPenalties, { signal })
}

/** 로그인한 나(마이페이지 프로필) */
export function getMyProfile(signal?: AbortSignal) {
  return request(endpoints.getMyProfile, { signal })
}

/* ───────── 훅 ───────── */

/** 로그인한 나(마이페이지 프로필) */
export function useMyProfileQuery() {
  return useQuery({
    queryKey: meKeys.profile(),
    queryFn: ({ signal }) => getMyProfile(signal),
  })
}

export function usePenaltiesQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: meKeys.penalties(),
    queryFn: ({ signal }) => getMyPenalties(signal),
    enabled,
  })
}
