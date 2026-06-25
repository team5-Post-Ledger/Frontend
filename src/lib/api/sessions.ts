import type { Session } from '../../types'
import { mockDelay } from './mockClient'

let mockSessions: Session[] = [
  {
    id: 1,
    exhibitionId: 1,
    hostExhibitorId: null,
    title: '키노트: 제조의 미래와 AI',
    description: 'AI와 로보틱스가 만드는 차세대 제조 현장을 조망합니다.',
    location: '메인 스테이지',
    startAt: '2026-09-01T10:00:00',
    endAt: '2026-09-01T11:00:00',
    capacity: 300,
  },
  {
    id: 2,
    exhibitionId: 1,
    hostExhibitorId: 2,
    title: '로보틱스 자동화 실전 사례',
    description: '협동로봇 자동화 도입 사례를 공유합니다.',
    location: '세미나실 B',
    startAt: '2026-09-01T13:30:00',
    endAt: '2026-09-01T14:30:00',
    capacity: 120,
  },
  {
    id: 4,
    exhibitionId: 1,
    hostExhibitorId: null,
    title: '스타트업 피칭 라운지',
    description: '제조·로보틱스 스타트업 5곳의 투자 피칭이 이어집니다.',
    location: '피칭존',
    startAt: '2026-09-01T13:00:00',
    endAt: '2026-09-01T14:00:00',
    capacity: 60,
  },
  {
    id: 3,
    exhibitionId: 1,
    hostExhibitorId: 4,
    title: '데이터 파이프라인 구축 워크숍',
    description: '대용량 데이터 처리 파이프라인 설계 노하우를 다룹니다.',
    location: '세미나실 C',
    startAt: '2026-09-02T15:00:00',
    endAt: '2026-09-02T16:30:00',
    capacity: 80,
  },
  {
    id: 5,
    exhibitionId: 1,
    hostExhibitorId: 6,
    title: '핀테크 결제 트렌드 세미나',
    description: '박람회 현장 결제·정산 API 동향을 소개합니다.',
    location: '세미나실 A',
    startAt: '2026-09-02T10:00:00',
    endAt: '2026-09-02T11:00:00',
    capacity: 150,
  },
]

let nextSessionId = 6

export async function getSessions(exhibitionId: number): Promise<Session[]> {
  return mockDelay(mockSessions.filter((session) => session.exhibitionId === exhibitionId))
}

export type SessionInput = Omit<Session, 'id' | 'exhibitionId'>

export async function createSession(exhibitionId: number, input: SessionInput): Promise<Session> {
  const session: Session = { id: nextSessionId++, exhibitionId, ...input }
  mockSessions = [...mockSessions, session]
  return mockDelay(session)
}

export async function updateSession(id: number, input: SessionInput): Promise<Session> {
  const exhibitionId = mockSessions.find((session) => session.id === id)?.exhibitionId ?? 1
  const session: Session = { id, exhibitionId, ...input }
  mockSessions = mockSessions.map((existing) => (existing.id === id ? session : existing))
  return mockDelay(session)
}

export async function deleteSession(id: number): Promise<void> {
  mockSessions = mockSessions.filter((session) => session.id !== id)
  await mockDelay(undefined)
}
