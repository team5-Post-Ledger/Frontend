import type { Booth, BoothCategory, BoothEmbedding } from '../../types'
import { mockDelay } from './mockClient'

const MOCK_CATEGORIES: BoothCategory[] = [
  { id: 1, exhibitionId: 1, name: 'AI/ML' },
  { id: 2, exhibitionId: 1, name: '로보틱스' },
  { id: 3, exhibitionId: 1, name: '클라우드' },
  { id: 4, exhibitionId: 1, name: 'IoT' },
  { id: 5, exhibitionId: 1, name: '핀테크' },
]

let mockBooths: Booth[] = [
  {
    id: 1,
    exhibitionId: 1,
    exhibitorId: 1,
    categoryId: 1,
    name: '테크노바 · AI 솔루션',
    description: '실시간 머신비전 및 AI 추론 솔루션 데모 전시.',
    tags: ['AI', '머신비전', '로보틱스'],
    posX: 12,
    posY: 34,
    floor: 1,
  },
  {
    id: 2,
    exhibitionId: 1,
    exhibitorId: 2,
    categoryId: 2,
    name: '스마트로보 부스',
    description: '협동로봇 및 자동화 라인 시연.',
    tags: ['로보틱스', '자동화'],
    posX: 28,
    posY: 34,
    floor: 1,
  },
  {
    id: 3,
    exhibitionId: 1,
    exhibitorId: 3,
    categoryId: 3,
    name: '클라우드웍스',
    description: '엔터프라이즈 클라우드 인프라 솔루션.',
    tags: ['클라우드', '인프라'],
    posX: 12,
    posY: 52,
    floor: 1,
  },
  {
    id: 4,
    exhibitionId: 1,
    exhibitorId: 4,
    categoryId: 1,
    name: '데이터브릿지',
    description: '데이터 파이프라인 및 분석 플랫폼.',
    tags: ['데이터', 'AI'],
    posX: 8,
    posY: 20,
    floor: 2,
  },
  {
    id: 5,
    exhibitionId: 1,
    exhibitorId: 5,
    categoryId: 4,
    name: '엣지센서랩',
    description: 'IoT 엣지 디바이스 및 센서 네트워크.',
    tags: ['IoT', '센서'],
    posX: 24,
    posY: 20,
    floor: 2,
  },
  {
    id: 6,
    exhibitionId: 1,
    exhibitorId: 6,
    categoryId: 5,
    name: '핀테크온',
    description: '결제·정산 API 플랫폼 전시.',
    tags: ['핀테크', 'API'],
    posX: 40,
    posY: 20,
    floor: 2,
  },
]

// 부스 6은 등록 직후 상태를 보여주기 위해 임베딩이 아직 없다.
let mockEmbeddings: BoothEmbedding[] = [
  { id: 1, boothId: 1, embedding: [], model: 'fairpilot-embedding-v1', sourceHash: 'hash-1', updatedAt: '2026-06-10T09:00:00' },
  { id: 2, boothId: 2, embedding: [], model: 'fairpilot-embedding-v1', sourceHash: 'hash-2', updatedAt: '2026-06-10T09:00:00' },
  { id: 3, boothId: 3, embedding: [], model: 'fairpilot-embedding-v1', sourceHash: 'hash-3', updatedAt: '2026-06-10T09:00:00' },
  { id: 4, boothId: 4, embedding: [], model: 'fairpilot-embedding-v1', sourceHash: 'hash-4', updatedAt: '2026-06-10T09:00:00' },
  { id: 5, boothId: 5, embedding: [], model: 'fairpilot-embedding-v1', sourceHash: 'hash-5', updatedAt: '2026-06-10T09:00:00' },
]

let nextBoothId = 7
let nextEmbeddingId = 6

export async function getBoothCategories(): Promise<BoothCategory[]> {
  return mockDelay(MOCK_CATEGORIES)
}

export async function getBooths(): Promise<Booth[]> {
  return mockDelay(mockBooths)
}

export async function getBoothsByExhibition(exhibitionId: number): Promise<Booth[]> {
  return mockDelay(mockBooths.filter((booth) => booth.exhibitionId === exhibitionId))
}

export async function getBoothEmbeddings(): Promise<BoothEmbedding[]> {
  return mockDelay(mockEmbeddings)
}

export type BoothInput = Omit<Booth, 'id' | 'exhibitionId'>

export async function createBooth(input: BoothInput): Promise<Booth> {
  const booth: Booth = { id: nextBoothId++, exhibitionId: 1, ...input }
  mockBooths = [...mockBooths, booth]
  return mockDelay(booth)
}

export async function updateBooth(id: number, input: BoothInput): Promise<Booth> {
  const booth: Booth = { id, exhibitionId: 1, ...input }
  mockBooths = mockBooths.map((existing) => (existing.id === id ? booth : existing))
  return mockDelay(booth)
}

export async function deleteBooth(id: number): Promise<void> {
  mockBooths = mockBooths.filter((booth) => booth.id !== id)
  mockEmbeddings = mockEmbeddings.filter((embedding) => embedding.boothId !== id)
  await mockDelay(undefined)
}

export async function regenerateBoothEmbedding(boothId: number): Promise<BoothEmbedding> {
  const updatedAt = new Date().toISOString()
  const existing = mockEmbeddings.find((embedding) => embedding.boothId === boothId)

  const embedding: BoothEmbedding = existing
    ? { ...existing, updatedAt }
    : { id: nextEmbeddingId++, boothId, embedding: [], model: 'fairpilot-embedding-v1', sourceHash: `hash-${boothId}`, updatedAt }

  mockEmbeddings = existing
    ? mockEmbeddings.map((item) => (item.boothId === boothId ? embedding : item))
    : [...mockEmbeddings, embedding]

  return mockDelay(embedding)
}
