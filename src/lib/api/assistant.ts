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
  // 질문이 동선 추천 의도로 보이면 true. §6.10 동선 미니폼을 펼치라는 신호일 뿐, §6.11 응답 필드는 아니다.
  suggestsRoute: boolean
}

export interface RouteSuggestionStop {
  visitOrder: number
  boothId: number
  boothName: string
  floor: number
  posX: number
  posY: number
  estMinutes: number
  reason: string
}

export interface RouteSuggestionResult {
  totalEstMinutes: number
  rationale: string
  stops: RouteSuggestionStop[]
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
      answer: '동선을 추천해드릴게요. 아래 조건만 확인해 주세요.',
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

/**
 * "추천 방문 동선" 블록을 채우는 목 데이터. 실제 동선 생성/저장은 §6.10이 담당한다:
 *   - POST /api/recommendations/route  (exhibitionId·interestText·availableMinutes·mustVisitBoothIds → routeId 발급)
 *   - GET  /api/recommendations/me     (저장된 동선을 /my/route 목록에 노출)
 * 지금은 백엔드가 없어 같은 exhibitionId 부스 중 "꼭 갈 부스"를 앞에 배치해 3~4개만 가짜로 보여준다.
 * TODO(§6.10 연동 지점): 백엔드가 준비되면 이 함수 본문을 위 POST 호출로 교체하고,
 * 결과 routeId를 저장(§6.10 GET /api/recommendations/me)해 /my/route에서 조회되게 한다.
 */
export async function getMockRouteSuggestion(exhibitionId: number, mustVisitBoothIds: number[]): Promise<RouteSuggestionResult> {
  const booths = await getBoothsByExhibition(exhibitionId)
  const mustVisit = booths.filter((booth) => mustVisitBoothIds.includes(booth.id))
  const rest = booths.filter((booth) => !mustVisitBoothIds.includes(booth.id))
  const picks = [...mustVisit, ...rest].slice(0, 4)

  const stops: RouteSuggestionStop[] = picks.map((booth, index) => ({
    visitOrder: index + 1,
    boothId: booth.id,
    boothName: booth.name,
    floor: booth.floor,
    posX: booth.posX,
    posY: booth.posY,
    estMinutes: 15 + index * 5,
    reason: mustVisitBoothIds.includes(booth.id)
      ? '꼭 갈 부스로 지정하셨어요.'
      : `관심 태그(${booth.tags[0] ?? booth.name})와 관련도가 높아요.`,
  }))

  return mockDelay(
    {
      totalEstMinutes: stops.reduce((sum, stop) => sum + stop.estMinutes, 0),
      rationale: '관심사와 가용 시간을 반영해 혼잡도가 낮은 순서로 정렬했습니다.',
      stops,
    },
    900,
  )
}
