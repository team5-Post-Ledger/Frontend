import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StaffExhibitionState {
  exhibitionId: number | null
  setExhibitionId: (id: number | null) => void
}

// STAFF는 exhibition_staff(§2.5)로 여러 행사에 배정될 수 있어 "지금 담당하는 행사"를 선택해야 한다.
// persist 키를 admin의 'fairpilot.admin.currentExhibitionId'와 분리해 역할 전환 시 서로 덮어쓰지 않는다.
export const useStaffExhibitionStore = create<StaffExhibitionState>()(
  persist(
    (set) => ({
      exhibitionId: null,
      setExhibitionId: (id) => set({ exhibitionId: id }),
    }),
    { name: 'fairpilot.staff.currentExhibitionId' },
  ),
)
