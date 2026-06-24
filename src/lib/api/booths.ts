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
  {
    id: 7,
    exhibitionId: 1,
    exhibitorId: 2,
    categoryId: 2,
    name: '스마트로보 · 협동로봇 라이브쇼',
    description: '하루 3회 협동로봇 라이브 데모를 진행합니다.',
    tags: ['로보틱스', '라이브데모'],
    posX: 44,
    posY: 34,
    floor: 1,
  },
  {
    id: 8,
    exhibitionId: 1,
    exhibitorId: 3,
    categoryId: 3,
    name: '클라우드웍스 · 멀티클라우드 존',
    description: '멀티클라우드 운영 자동화 데모존.',
    tags: ['클라우드', '자동화'],
    posX: 28,
    posY: 52,
    floor: 1,
  },
  {
    id: 9,
    exhibitionId: 1,
    exhibitorId: 5,
    categoryId: 4,
    name: '엣지센서랩 · 스마트팩토리 센서',
    description: '진동·온도 센서 기반 예지보전 데모.',
    tags: ['IoT', '예지보전'],
    posX: 40,
    posY: 20,
    floor: 2,
  },
  {
    id: 10,
    exhibitionId: 1,
    exhibitorId: 6,
    categoryId: 5,
    name: '핀테크온 · QR 결제 체험존',
    description: 'QR 기반 간편결제 체험 부스.',
    tags: ['핀테크', 'QR'],
    posX: 56,
    posY: 20,
    floor: 2,
  },
  {
    id: 11,
    exhibitionId: 1,
    exhibitorId: 4,
    categoryId: null,
    name: '데이터브릿지 · 라운지',
    description: '네트워킹 라운지 및 미니 상담 부스.',
    tags: ['네트워킹'],
    posX: 8,
    posY: 40,
    floor: 3,
  },
  {
    id: 12,
    exhibitionId: 1,
    exhibitorId: 1,
    categoryId: 1,
    name: '테크노바 · 채용상담존',
    description: '개발/리서치 직군 현장 채용 상담.',
    tags: ['채용', 'AI'],
    posX: 24,
    posY: 40,
    floor: 3,
  },
  // exhibitionId: 3(2026 부산 푸드테크 박람회) — booth_category가 없는 박람회이므로 categoryId는 전부 null.
  {
    id: 13,
    exhibitionId: 3,
    exhibitorId: 7,
    categoryId: null,
    name: '쿡로보 · 무인 조리 로봇존',
    description: '로봇 팔이 즉석 요리를 만드는 무인 조리 데모.',
    tags: ['푸드테크', '로봇조리'],
    posX: 10,
    posY: 15,
    floor: 1,
  },
  {
    id: 14,
    exhibitionId: 3,
    exhibitorId: 8,
    categoryId: null,
    name: '프레시체인 · 콜드체인 솔루션',
    description: '신선식품 저온유통 모니터링 시스템 전시.',
    tags: ['콜드체인', '신선식품'],
    posX: 26,
    posY: 15,
    floor: 1,
  },
  {
    id: 15,
    exhibitionId: 3,
    exhibitorId: 9,
    categoryId: null,
    name: '대체식품랩 · 플랜트베이스 테이스팅',
    description: '식물성 대체육 시식 및 조리법 시연.',
    tags: ['대체식품', '시식'],
    posX: 42,
    posY: 15,
    floor: 1,
  },
  {
    id: 16,
    exhibitionId: 3,
    exhibitorId: 10,
    categoryId: null,
    name: '스마트키친웍스 · IoT 키친 쇼룸',
    description: 'IoT 연동 스마트 주방기기 쇼룸.',
    tags: ['IoT', '스마트키친'],
    posX: 10,
    posY: 30,
    floor: 2,
  },
  {
    id: 17,
    exhibitionId: 3,
    exhibitorId: 11,
    categoryId: null,
    name: '푸드테크AI · 메뉴 추천 데모',
    description: 'AI 기반 개인 맞춤 메뉴 추천 체험.',
    tags: ['AI', '메뉴추천'],
    posX: 26,
    posY: 30,
    floor: 2,
  },
  {
    id: 18,
    exhibitionId: 3,
    exhibitorId: 12,
    categoryId: null,
    name: '그린패키징 · 친환경 포장재 존',
    description: '생분해 식품 포장재 및 라벨 샘플 전시.',
    tags: ['친환경', '포장재'],
    posX: 42,
    posY: 30,
    floor: 2,
  },
  {
    id: 19,
    exhibitionId: 3,
    exhibitorId: 7,
    categoryId: null,
    name: '쿡로보 · B2B 상담존',
    description: '외식업 자동화 도입 상담 및 견적 안내.',
    tags: ['상담', '자동화'],
    posX: 18,
    posY: 45,
    floor: 3,
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

let nextBoothId = 20
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
