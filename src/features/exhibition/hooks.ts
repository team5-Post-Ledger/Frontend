import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getExhibition,
  getExhibitions,
  getRecommendedExhibitions,
  updateExhibition,
  type ExhibitionEditInput,
} from '../../lib/api/exhibitions'
import { useCurrentExhibitionStore } from '../../stores/currentExhibitionStore'

// admin이 currentExhibitionStore에서 고른 "지금 보고 있는 행사"를 따른다(§5.1 exhibition_admin —
// 한 admin이 여러 행사를 담당할 수 있어 1번을 임의로 기본 노출하지 않는다). 선택이 없으면
// (exhibitionId=null) 쿼리를 비활성화한다. 방문자 화면은 이 훅을 쓰지 않는다 — useExhibition(id)로
// 직접 조회한다.
export function useCurrentExhibition() {
  const exhibitionId = useCurrentExhibitionStore((state) => state.exhibitionId)

  return useQuery({
    queryKey: ['exhibition', 'current', exhibitionId],
    queryFn: () => getExhibition(exhibitionId as number),
    enabled: exhibitionId !== null,
  })
}

export function useRecommendedExhibitions() {
  return useQuery({
    queryKey: ['exhibition', 'recommended'],
    queryFn: getRecommendedExhibitions,
  })
}

export function useExhibitions() {
  return useQuery({
    queryKey: ['exhibition', 'list'],
    queryFn: getExhibitions,
  })
}

export function useExhibition(id: number | null) {
  return useQuery({
    queryKey: ['exhibition', id],
    queryFn: () => getExhibition(id as number),
    enabled: id !== null,
  })
}

export function useUpdateExhibition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExhibitionEditInput }) => updateExhibition(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibition'] })
    },
  })
}
