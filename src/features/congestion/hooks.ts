import { useQuery } from '@tanstack/react-query'
import { getCongestionLive } from './api'

// enabled: false면 5초 폴링까지 통째로 멈춘다 — 시작 전/종료 행사에서 존재하지 않는 실시간
// 데이터를 폴링하지 않기 위한 스위치(features/congestion/availability.ts 판정과 함께 쓴다).
export function useCongestionLive(exhibitionId?: number | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['congestion', 'live', exhibitionId ?? 'all'],
    queryFn: () => getCongestionLive(exhibitionId ?? undefined),
    refetchInterval: 5000,
    enabled: options?.enabled ?? true,
  })
}
