import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmTextGuide,
  createEducationGuide,
  deleteEducationGuide,
  getEducationGuide,
  getEducationGuidePublic,
  getEducationGuides,
  getEducationGuidesByRole,
  getGuideCompletion,
  recordVideoComplete,
  submitQuiz,
  updateEducationGuide,
  type EducationGuideInput,
  type QuizAnswer,
} from '../../lib/api/education'
import type { EducationTargetRole } from '../../types'

const LMS_KEYS = {
  completion: (id: number | null) => ['educationGuides', 'completion', id] as const,
  byRole: (role: EducationTargetRole | null) => ['educationGuides', 'byRole', role] as const,
  progress: ['staffExhibitions', 'progress'] as const,
} as const

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

// STAFF·EXHIBITOR 화면 전용 — 정답 제거 DTO 반환 (§6.7).
export function useEducationGuidesByRole(targetRole: EducationTargetRole | null) {
  return useQuery({
    queryKey: LMS_KEYS.byRole(targetRole),
    queryFn: () => getEducationGuidesByRole(targetRole as EducationTargetRole),
    enabled: targetRole !== null,
  })
}

export function useEducationGuidePublic(id: number | null) {
  return useQuery({
    queryKey: ['educationGuides', 'public', id],
    queryFn: () => getEducationGuidePublic(id as number),
    enabled: id !== null,
  })
}

// 단건 이수 현황 — 상세 화면에서 버튼 활성/비활성 판정에 사용.
export function useGuideCompletion(id: number | null) {
  return useQuery({
    queryKey: LMS_KEYS.completion(id),
    queryFn: () => getGuideCompletion(id as number),
    enabled: id !== null,
  })
}

function useLmsInvalidate() {
  const queryClient = useQueryClient()
  return (guideId: number, targetRole: EducationTargetRole) => {
    queryClient.invalidateQueries({ queryKey: LMS_KEYS.completion(guideId) })
    queryClient.invalidateQueries({ queryKey: LMS_KEYS.byRole(targetRole) })
    queryClient.invalidateQueries({ queryKey: LMS_KEYS.progress })
  }
}

// POST /api/education/guides/{id}/quiz/submit
export function useSubmitQuiz(targetRole: EducationTargetRole) {
  const invalidate = useLmsInvalidate()
  return useMutation({
    mutationFn: ({ guideId, answers }: { guideId: number; answers: QuizAnswer[] }) =>
      submitQuiz(guideId, answers),
    onSuccess: (_, { guideId }) => invalidate(guideId, targetRole),
  })
}

// POST /api/education/guides/{id}/video-complete
export function useRecordVideoComplete(targetRole: EducationTargetRole) {
  const invalidate = useLmsInvalidate()
  return useMutation({
    mutationFn: (guideId: number) => recordVideoComplete(guideId),
    onSuccess: (_, guideId) => invalidate(guideId, targetRole),
  })
}

// POST /api/education/guides/{id}/confirm
export function useConfirmTextGuide(targetRole: EducationTargetRole) {
  const invalidate = useLmsInvalidate()
  return useMutation({
    mutationFn: (guideId: number) => confirmTextGuide(guideId),
    onSuccess: (_, guideId) => invalidate(guideId, targetRole),
  })
}
