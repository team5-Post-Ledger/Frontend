import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createBooth,
  deleteBooth,
  getBoothCategories,
  getBoothEmbeddings,
  getBooths,
  getBoothsByExhibition,
  regenerateBoothEmbedding,
  updateBooth,
  type BoothInput,
} from '../../lib/api/booths'

export function useBooths() {
  return useQuery({ queryKey: ['booths', 'list'], queryFn: getBooths })
}

export function useBoothsByExhibition(exhibitionId: number | null) {
  return useQuery({
    queryKey: ['booths', 'byExhibition', exhibitionId],
    queryFn: () => getBoothsByExhibition(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

export function useBoothCategories() {
  return useQuery({ queryKey: ['booths', 'categories'], queryFn: getBoothCategories })
}

export function useBoothEmbeddings() {
  return useQuery({ queryKey: ['booths', 'embeddings'], queryFn: getBoothEmbeddings })
}

export function useCreateBooth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BoothInput) => createBooth(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] })
    },
  })
}

export function useUpdateBooth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: BoothInput }) => updateBooth(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] })
    },
  })
}

export function useDeleteBooth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteBooth(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths'] })
    },
  })
}

export function useRegenerateBoothEmbedding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (boothId: number) => regenerateBoothEmbedding(boothId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths', 'embeddings'] })
    },
  })
}
