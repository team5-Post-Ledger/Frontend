import { create } from 'zustand'
import type { CitedBooth, RouteSuggestionResult } from '../lib/api/assistant'

export interface AssistantChatMessage {
  id: number
  role: 'user' | 'ai'
  text: string
  citedBooths?: CitedBooth[]
}

type RouteStage = 'hidden' | 'form' | 'done'

let messageIdSeq = 0
function nextMessageId() {
  messageIdSeq += 1
  return messageIdSeq
}

function createInitialMessages(): AssistantChatMessage[] {
  return [
    { id: nextMessageId(), role: 'ai', text: '안녕하세요, 행사 도우미예요. 부스 위치부터 추천 동선까지 무엇이든 물어보세요.' },
  ]
}

interface AssistantState {
  messages: AssistantChatMessage[]
  routeStage: RouteStage
  minutes: number
  selectedCategoryIds: number[]
  mustVisitIds: number[]
  routeResult: RouteSuggestionResult | null
  routeSaved: boolean
  appendMessage: (message: Omit<AssistantChatMessage, 'id'>) => void
  setRouteStage: (stage: RouteStage) => void
  setMinutes: (minutes: number) => void
  toggleCategory: (id: number) => void
  toggleMustVisit: (id: number) => void
  applyRouteResult: (result: RouteSuggestionResult) => void
  toggleRouteSaved: () => void
}

// §6.11 "MVP는 무상태"는 서버/DB에 대화 이력을 저장하지 않는다는 뜻이고 그대로 유지된다.
// 이 zustand store는 그와 별개로 SPA 내 페이지 이동(부스 상세 → 뒤로가기) 동안만 화면을 살려두는
// in-memory UX 보정일 뿐이다 — persist 미들웨어도, localStorage/sessionStorage도 쓰지 않으므로
// 새로고침하면 그대로 초기화된다.
export const useAssistantStore = create<AssistantState>((set) => ({
  messages: createInitialMessages(),
  routeStage: 'hidden',
  minutes: 90,
  selectedCategoryIds: [],
  mustVisitIds: [],
  routeResult: null,
  routeSaved: false,

  appendMessage: (message) => set((state) => ({ messages: [...state.messages, { ...message, id: nextMessageId() }] })),

  setRouteStage: (stage) => set({ routeStage: stage }),

  setMinutes: (minutes) => set({ minutes }),

  toggleCategory: (id) =>
    set((state) => ({
      selectedCategoryIds: state.selectedCategoryIds.includes(id)
        ? state.selectedCategoryIds.filter((categoryId) => categoryId !== id)
        : [...state.selectedCategoryIds, id],
    })),

  toggleMustVisit: (id) =>
    set((state) => ({
      mustVisitIds: state.mustVisitIds.includes(id) ? state.mustVisitIds.filter((boothId) => boothId !== id) : [...state.mustVisitIds, id],
    })),

  applyRouteResult: (result) => set({ routeResult: result, routeStage: 'done', routeSaved: false }),

  toggleRouteSaved: () => set((state) => ({ routeSaved: !state.routeSaved })),
}))
