import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEducationGuide,
  deleteEducationGuide,
  getEducationGuide,
  getEducationGuides,
  updateEducationGuide,
  type EducationGuideInput,
} from '../../lib/api/education'

export function useEducationGuides() {
  return useQuery({
    queryKey: ['educationGuides', 'list'],
    queryFn: getEducationGuides,
  })
}

export function useEducationGuide(id: number | null) {
  return useQuery({
    queryKey: ['educationGuides', id],
    queryFn: () => getEducationGuide(id as number),
    enabled: id !== null,
  })
}

export function useCreateEducationGuide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EducationGuideInput) => createEducationGuide(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educationGuides'] })
    },
  })
}

export function useUpdateEducationGuide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: EducationGuideInput }) => updateEducationGuide(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educationGuides'] })
    },
  })
}

export function useDeleteEducationGuide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEducationGuide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educationGuides'] })
    },
  })
}
