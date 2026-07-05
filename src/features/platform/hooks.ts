import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activatePlatformAccountant,
  assignPlatformAdmin,
  createPlatformAd,
  createPlatformAdSlot,
  createPlatformExhibition,
  deactivatePlatformAccountant,
  deletePlatformAdSlot,
  deletePlatformExhibition,
  getPlatformExhibition,
  getPlatformStatsOverview,
  invitePlatformAccountant,
  invitePlatformAdmin,
  listPlatformAccountants,
  listPlatformAdmins,
  listPlatformAdSlots,
  listPlatformAds,
  listPlatformExhibitionAdmins,
  listPlatformExhibitions,
  resendPlatformInvite,
  updatePlatformAd,
  updatePlatformAdSlot,
  updatePlatformAdStatus,
  updatePlatformExhibition,
  updatePlatformExhibitionStatus,
  type CreatePlatformAdInput,
  type CreatePlatformAdSlotInput,
  type CreatePlatformExhibitionInput,
  type InvitePlatformAccountInput,
  type UpdatePlatformAdInput,
  type UpdatePlatformAdSlotInput,
  type UpdatePlatformExhibitionInput,
} from './api'
import type { Advertisement, Exhibition } from '../../types'

export const platformQueryKeys = {
  exhibitions: ['platform', 'exhibitions'] as const,
  exhibition: (id: number | null) => ['platform', 'exhibitions', id] as const,
  exhibitionAdmins: (id: number | null) => ['platform', 'exhibitions', id, 'admins'] as const,
  admins: ['platform', 'admins'] as const,
  accountants: ['platform', 'accountants'] as const,
  adSlots: ['platform', 'ad-slots'] as const,
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
    queryFn: () => listPlatformAdmins(),
  })
}

export function usePlatformAccountants() {
  return useQuery({
    queryKey: platformQueryKeys.accountants,
    queryFn: () => listPlatformAccountants(),
  })
}

export function usePlatformAds() {
  return useQuery({
    queryKey: platformQueryKeys.ads,
    queryFn: () => listPlatformAds(),
  })
}

export function usePlatformAdSlots() {
  return useQuery({
    queryKey: platformQueryKeys.adSlots,
    queryFn: () => listPlatformAdSlots(),
  })
}

export function usePlatformStatsOverview() {
  return useQuery({
    queryKey: platformQueryKeys.stats,
    queryFn: () => getPlatformStatsOverview(),
  })
}

export function useCreatePlatformExhibition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePlatformExhibitionInput) => createPlatformExhibition(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.exhibitions })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.stats })
    },
  })
}

export function useUpdatePlatformExhibition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdatePlatformExhibitionInput }) =>
      updatePlatformExhibition(id, input),
    onSuccess: (exhibition) => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.exhibitions })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.exhibition(exhibition.id) })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.stats })
    },
  })
}

export function useUpdatePlatformExhibitionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Exhibition['status'] }) =>
      updatePlatformExhibitionStatus(id, status),
    onSuccess: (exhibition) => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.exhibitions })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.exhibition(exhibition.id) })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.stats })
    },
  })
}

export function useDeletePlatformExhibition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deletePlatformExhibition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.exhibitions })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.stats })
    },
  })
}

export function useInvitePlatformAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: InvitePlatformAccountInput) => invitePlatformAdmin(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.admins })
    },
  })
}

export function useResendPlatformInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => resendPlatformInvite(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.admins })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.accountants })
    },
  })
}

export function useAssignPlatformAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ exhibitionId, userId }: { exhibitionId: number; userId: number }) =>
      assignPlatformAdmin(exhibitionId, userId),
    onSuccess: (_admin, variables) => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.admins })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.exhibitions })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.exhibition(variables.exhibitionId) })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.exhibitionAdmins(variables.exhibitionId) })
    },
  })
}

export function useInvitePlatformAccountant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: InvitePlatformAccountInput) => invitePlatformAccountant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.accountants })
    },
  })
}

export function useDeactivatePlatformAccountant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => deactivatePlatformAccountant(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.accountants })
    },
  })
}

export function useActivatePlatformAccountant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => activatePlatformAccountant(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.accountants })
    },
  })
}

export function useCreatePlatformAdSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePlatformAdSlotInput) => createPlatformAdSlot(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.adSlots })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.stats })
    },
  })
}

export function useUpdatePlatformAdSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ slotId, input }: { slotId: number; input: UpdatePlatformAdSlotInput }) =>
      updatePlatformAdSlot(slotId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.adSlots })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.ads })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.stats })
    },
  })
}

export function useDeletePlatformAdSlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (slotId: number) => deletePlatformAdSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.adSlots })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.ads })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.stats })
    },
  })
}

export function useCreatePlatformAd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePlatformAdInput) => createPlatformAd(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.ads })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.stats })
    },
  })
}

export function useUpdatePlatformAd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ adId, input }: { adId: number; input: UpdatePlatformAdInput }) => updatePlatformAd(adId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.ads })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.stats })
    },
  })
}

export function useUpdatePlatformAdStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ adId, status }: { adId: number; status: Advertisement['status'] }) =>
      updatePlatformAdStatus(adId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.ads })
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.stats })
    },
  })
}
