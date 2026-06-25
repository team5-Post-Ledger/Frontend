import { getBoothsByExhibition } from './booths'
import { mockDelay } from './mockClient'

export interface CitedBooth {
  boothId: number
  name: string
  floor: number
  posX: number
  posY: number
}

export interface AssistantAskInput {
  exhibitionId: number
  question: string
}

export interface AssistantAskResult {
  answer: string
  citedBooths: CitedBooth[]
  // 질문이 동선 추천 의도로 보이면 true. §6.10 /my/route로 유도하는 CTA를 보여주라는 신호일 뿐,
  // §6.11 응답 필드는 아니다.
  suggestsRoute: boolean
}

const ROUTE_INTENT_PATTERN = /동선|루트|경로/

/**
 * POST /api/assistant/ask 목 구현(§6.11). 실제 파이프라인은 question 임베딩 → 같은 exhibitionId의
 * booth_embedding 코사인 유사도 Top-K → LLM이 후보 안 boothId만 인용 → DB로 boothId 검증
 * (할루시네이션 가드) 순서다(v2.5 8장 재사용). 지금은 백엔드/임베딩이 없으므로 같은 exhibitionId
 * 부스의 name·tags를 키워드로 매칭해 흉내낸다. MVP는 무상태이므로 대화 이력은 저장하지 않는다.
 */
export async function askAssistant({ exhibitionId, question }: AssistantAskInput): Promise<AssistantAskResult> {
  const booths = await getBoothsByExhibition(exhibitionId)

  if (ROUTE_INTENT_PATTERN.test(question)) {
    return mockDelay({
      answer: "동선 추천은 '내 동선'에서 새로 만들 수 있어요.",
      citedBooths: [],
      suggestsRoute: true,
    })
  }

  // 자연어 질문이므로 "질문이 부스명/태그(키워드)를 포함하는지"로 매칭한다(반대 방향은 거의 항상 실패한다 —
  // 예: "AI 관련 부스 어디 있어?" 전체가 부스명에 포함될 리 없다).
  const term = question.trim().toLowerCase()
  const matched = term
    ? booths.filter((booth) => [booth.name, ...booth.tags].some((keyword) => term.includes(keyword.toLowerCase())))
    : []

  if (matched.length > 0) {
    const top = matched.slice(0, 3)
    return mockDelay({
      answer: `${top.map((booth) => booth.name).join(', ')} 부스가 관련이 있어요. ${top[0].floor}층에서 확인할 수 있습니다.`,
      citedBooths: top.map((booth) => ({ boothId: booth.id, name: booth.name, floor: booth.floor, posX: booth.posX, posY: booth.posY })),
      suggestsRoute: false,
    })
  }

  // §6.11 검증 규칙 2: 인용 부스가 0개면 "찾지 못했습니다" + 유사도 Top-3 후보를 대신 제시한다.
  const fallback = booths.slice(0, 3)
  return mockDelay({
    answer: '관련 부스를 찾지 못했습니다. 대신 지금 둘러볼 만한 부스를 추천해드려요.',
    citedBooths: fallback.map((booth) => ({ boothId: booth.id, name: booth.name, floor: booth.floor, posX: booth.posX, posY: booth.posY })),
    suggestsRoute: false,
  })
}
