import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CurrentExhibitionState {
  exhibitionId: number | null
  setExhibitionId: (exhibitionId: number | null) => void
}

// EXPO_ADMIN은 exhibition_admin(§5.1)으로 여러 행사를 담당할 수 있어 "지금 보고 있는 행사"를
// 골라야 한다. persist가 localStorage 동기 복원을 맡아 새로고침/직접 진입에도 마지막 선택이
// 유지된다. 임의로 특정 행사를 기본값으로 두지 않는다 — null이면 호출 측이 선택을 유도해야 한다.
export const useCurrentExhibitionStore = create<CurrentExhibitionState>()(
  persist(
    (set) => ({
      exhibitionId: null,
      setExhibitionId: (exhibitionId) => set({ exhibitionId }),
    }),
    { name: 'fairpilot.admin.currentExhibitionId' },
  ),
)
