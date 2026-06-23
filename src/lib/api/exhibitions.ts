import type { Exhibition } from '../../types'
import { mockDelay } from './mockClient'

const MOCK_EXHIBITIONS: Exhibition[] = [
  {
    id: 1,
    title: '2026 서울 스마트팩토리 박람회',
    slug: 'smart-factory-2026',
    venue: '코엑스 1전시장',
    address: '서울특별시 강남구 영동대로 513',
    floorMapMeta: null,
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    status: 'OPEN',
    enforceStaffQualification: true,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 2,
    title: '2026 친환경 포장재 엑스포',
    slug: 'eco-packaging-2026',
    venue: '킨텍스 제2전시장',
    address: '경기도 고양시 일산서구 한류월드로 408',
    floorMapMeta: null,
    startDate: '2026-10-14',
    endDate: '2026-10-16',
    status: 'OPEN',
    enforceStaffQualification: false,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 3,
    title: '2026 부산 푸드테크 박람회',
    slug: 'busan-foodtech-2026',
    venue: 'BEXCO 제1전시장',
    address: '부산광역시 해운대구 APEC로 55',
    floorMapMeta: null,
    startDate: '2026-06-20',
    endDate: '2026-06-26',
    status: 'OPEN',
    enforceStaffQualification: false,
    createdBy: 1,
    deletedAt: null,
  },
]

export async function getExhibitions(): Promise<Exhibition[]> {
  return mockDelay(MOCK_EXHIBITIONS)
}

export async function getExhibition(id: number): Promise<Exhibition | null> {
  return mockDelay(MOCK_EXHIBITIONS.find((exhibition) => exhibition.id === id) ?? null)
}

export async function getRecommendedExhibitions(): Promise<Exhibition[]> {
  return mockDelay(MOCK_EXHIBITIONS.filter((exhibition) => exhibition.status === 'OPEN'))
}
