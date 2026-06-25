import { create } from 'zustand'
import type { CitedBooth } from '../lib/api/assistant'

export interface AssistantChatMessage {
  id: number
  role: 'user' | 'ai'
  text: string
  citedBooths?: CitedBooth[]
}

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
  routeCtaVisible: boolean
  appendMessage: (message: Omit<AssistantChatMessage, 'id'>) => void
  showRouteCta: () => void
}

// §6.11 "MVP는 무상태"는 서버/DB에 대화 이력을 저장하지 않는다는 뜻이고 그대로 유지된다.
// 이 zustand store는 그와 별개로 SPA 내 페이지 이동(부스 상세 → 뒤로가기) 동안만 화면을 살려두는
// in-memory UX 보정일 뿐이다 — persist 미들웨어도, localStorage/sessionStorage도 쓰지 않으므로
// 새로고침하면 그대로 초기화된다.
export const useAssistantStore = create<AssistantState>((set) => ({
  messages: createInitialMessages(),
  routeCtaVisible: false,

  appendMessage: (message) => set((state) => ({ messages: [...state.messages, { ...message, id: nextMessageId() }] })),

  showRouteCta: () => set({ routeCtaVisible: true }),
}))
