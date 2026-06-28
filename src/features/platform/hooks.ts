import { useQuery } from '@tanstack/react-query'
import {
  getPlatformExhibition,
  getPlatformStatsOverview,
  listPlatformAccountants,
  listPlatformAdmins,
  listPlatformAds,
  listPlatformExhibitionAdmins,
  listPlatformExhibitions,
} from './api'

export const platformQueryKeys = {
  exhibitions: ['platform', 'exhibitions'] as const,
  exhibition: (id: number | null) => ['platform', 'exhibitions', id] as const,
  exhibitionAdmins: (id: number | null) => ['platform', 'exhibitions', id, 'admins'] as const,
  admins: ['platform', 'admins'] as const,
  accountants: ['platform', 'accountants'] as const,
  ads: ['platform', 'ads'] as const,
  stats: ['platform', 'stats'] as const,
}

export function usePlatformExhibitions() {
  return useQuery({
    queryKey: platformQueryKeys.exhibitions,
    queryFn: () => listPlatformExhibitions(),
  })
}

export function usePlatformExhibition(id: number | null) {
  return useQuery({
    queryKey: platformQueryKeys.exhibition(id),
    queryFn: () => getPlatformExhibition(id as number),
    enabled: id !== null,
  })
}

export function usePlatformExhibitionAdmins(id: number | null) {
  return useQuery({
    queryKey: platformQueryKeys.exhibitionAdmins(id),
    queryFn: () => listPlatformExhibitionAdmins(id as number),
    enabled: id !== null,
  })
}

export function usePlatformAdmins() {
  return useQuery({
    queryKey: platformQueryKeys.admins,
    queryFn: listPlatformAdmins,
  })
}

export function usePlatformAccountants() {
  return useQuery({
    queryKey: platformQueryKeys.accountants,
    queryFn: listPlatformAccountants,
  })
}

export function usePlatformAds() {
  return useQuery({
    queryKey: platformQueryKeys.ads,
    queryFn: listPlatformAds,
  })
}

export function usePlatformStatsOverview() {
  return useQuery({
    queryKey: platformQueryKeys.stats,
    queryFn: getPlatformStatsOverview,
  })
}
