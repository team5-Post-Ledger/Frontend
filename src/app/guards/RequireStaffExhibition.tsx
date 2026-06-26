import { Navigate, Outlet } from 'react-router'
import { useStaffExhibitionStore } from '../../stores/staffExhibitionStore'

// STAFF가 아직 담당 행사를 선택하지 않은 상태에서 /checkin 하위 작업 화면에 직접 진입하면
// /checkin(피커 겸 홈)으로 돌려보낸다. admin의 RequireCurrentExhibition에 대응하는 STAFF 전용 가드.
export function RequireStaffExhibition() {
  const exhibitionId = useStaffExhibitionStore((state) => state.exhibitionId)

  if (exhibitionId === null) {
    return <Navigate to="/checkin" replace />
  }

  return <Outlet />
}
