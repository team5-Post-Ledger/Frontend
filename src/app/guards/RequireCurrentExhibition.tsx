import { Navigate, Outlet } from 'react-router'
import { useCurrentExhibitionStore } from '../../stores/currentExhibitionStore'

// admin이 아직 "지금 보고 있는 행사"를 고르지 않았으면(exhibition_admin 다중 담당 — §5.1) 행사
// 목록으로 보내 먼저 고르게 한다. 1번 행사를 임의로 기본 선택해 담당 아닌 행사 데이터를 보여주지
// 않기 위함이다.
export function RequireCurrentExhibition() {
  const exhibitionId = useCurrentExhibitionStore((state) => state.exhibitionId)

  if (exhibitionId === null) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
