import type { Exhibition, ExhibitionAdmin } from '../../types'
import { mockDelay } from './mockClient'

let MOCK_EXHIBITIONS: Exhibition[] = [
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
  {
    id: 4,
    title: '2026 서울 게임·콘텐츠 페스타',
    slug: 'game-contents-2026',
    venue: '코엑스 3전시장',
    address: '서울특별시 강남구 영동대로 521',
    floorMapMeta: null,
    startDate: '2026-08-07',
    endDate: '2026-08-09',
    status: 'OPEN',
    enforceStaffQualification: false,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 5,
    title: '2026 대구 뷰티·헬스케어 박람회',
    slug: 'beauty-health-2026',
    venue: '대구 엑스코',
    address: '대구광역시 북구 엑스코로 10',
    floorMapMeta: null,
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    status: 'OPEN',
    enforceStaffQualification: true,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 6,
    title: '2026 글로벌 교육박람회',
    slug: 'global-education-2026',
    venue: '서울 aT센터',
    address: '서울특별시 강남구 학동로 401',
    floorMapMeta: null,
    startDate: '2026-11-05',
    endDate: '2026-11-07',
    status: 'OPEN',
    enforceStaffQualification: false,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 7,
    title: '2026 친환경 농수산식품 박람회',
    slug: 'agro-food-2026',
    venue: '대전컨벤션센터',
    address: '대전광역시 유성구 엑스포로 107',
    floorMapMeta: null,
    startDate: '2026-09-18',
    endDate: '2026-09-20',
    status: 'OPEN',
    enforceStaffQualification: false,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 8,
    title: '2026 반려동물 산업전',
    slug: 'pet-industry-2026',
    venue: '킨텍스 제1전시장',
    address: '경기도 고양시 일산서구 한류월드로 300',
    floorMapMeta: null,
    startDate: '2026-10-02',
    endDate: '2026-10-04',
    status: 'OPEN',
    enforceStaffQualification: false,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 9,
    title: '2026 웨딩·라이프스타일 박람회',
    slug: 'wedding-lifestyle-2026',
    venue: '서울 SETEC',
    address: '서울특별시 강남구 남부순환로 2734',
    floorMapMeta: null,
    startDate: '2026-12-04',
    endDate: '2026-12-06',
    status: 'OPEN',
    enforceStaffQualification: false,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 10,
    title: '2027 전기차·배터리 테크쇼',
    slug: 'ev-battery-2027',
    venue: 'BEXCO 제2전시장',
    address: '부산광역시 해운대구 APEC로 55',
    floorMapMeta: null,
    startDate: '2027-01-15',
    endDate: '2027-01-17',
    status: 'OPEN',
    enforceStaffQualification: true,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 11,
    title: '2026 유아·키즈페어',
    slug: 'kids-fair-2026',
    venue: '킨텍스 제2전시장',
    address: '경기도 고양시 일산서구 한류월드로 408',
    floorMapMeta: null,
    startDate: '2026-08-21',
    endDate: '2026-08-23',
    status: 'OPEN',
    enforceStaffQualification: false,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 12,
    title: '2026 부산 국제수산엑스포',
    slug: 'busan-seafood-2026',
    venue: 'BEXCO 제1전시장',
    address: '부산광역시 해운대구 APEC로 55',
    floorMapMeta: null,
    startDate: '2026-03-10',
    endDate: '2026-03-12',
    status: 'CLOSED',
    enforceStaffQualification: false,
    createdBy: 1,
    deletedAt: null,
  },
  {
    id: 13,
    title: '2027 스마트시티 박람회',
    slug: 'smart-city-2027',
    venue: '코엑스 1전시장',
    address: '서울특별시 강남구 영동대로 513',
    floorMapMeta: null,
    startDate: '2027-03-03',
    endDate: '2027-03-05',
    status: 'DRAFT',
    enforceStaffQualification: true,
    createdBy: 1,
    deletedAt: null,
  },
]

// GET /api/exhibitions는 ALL 역할에 공개되는 대신 OPEN 박람회만 반환한다(§6.1).
// DRAFT(미게시)·CLOSED(종료)는 이 목록에서 제외된다.
export async function getExhibitions(): Promise<Exhibition[]> {
  return mockDelay(MOCK_EXHIBITIONS.filter((exhibition) => exhibition.status === 'OPEN'))
}

// §5.1 exhibition_admin — EXPO_ADMIN의 행사 배정 매핑(N:M, 한 admin이 여러 행사를 담당할 수 있다).
// 시드: admin@fairpilot.io(user_id=2, lib/api/auth.ts)가 상태가 다른 행사 3건을 담당.
const MOCK_EXHIBITION_ADMINS: ExhibitionAdmin[] = [
  { id: 1, exhibitionId: 1, userId: 2, createdAt: '2026-01-05T09:00:00', updatedAt: '2026-01-05T09:00:00' },
  { id: 2, exhibitionId: 12, userId: 2, createdAt: '2026-01-05T09:00:00', updatedAt: '2026-01-05T09:00:00' },
  { id: 3, exhibitionId: 13, userId: 2, createdAt: '2026-01-05T09:00:00', updatedAt: '2026-01-05T09:00:00' },
]

// "내 담당 행사" 목록(모델 B admin 홈). exhibition_admin 매핑을 거치므로 getExhibitions()(공개 목록,
// OPEN만)와 달리 DRAFT·CLOSED도 포함한다 — 담당자라면 미게시/종료 행사도 봐야 한다. PLATFORM_ADMIN의
// 전체 행사 관리(/platform 영역, 이 함수와 무관)와 스코프가 다르다.
export async function getMyExhibitions(userId: number): Promise<Exhibition[]> {
  const myExhibitionIds = new Set(
    MOCK_EXHIBITION_ADMINS.filter((admin) => admin.userId === userId).map((admin) => admin.exhibitionId),
  )
  return mockDelay(MOCK_EXHIBITIONS.filter((exhibition) => myExhibitionIds.has(exhibition.id)))
}

export async function getExhibition(id: number): Promise<Exhibition | null> {
  return mockDelay(MOCK_EXHIBITIONS.find((exhibition) => exhibition.id === id) ?? null)
}

export async function getRecommendedExhibitions(): Promise<Exhibition[]> {
  return mockDelay(MOCK_EXHIBITIONS.filter((exhibition) => exhibition.status === 'OPEN'))
}

// §5.1 exhibition 컬럼 중 폼으로 수정 가능한 항목만. slug(unique)·floor_map_meta(별도 화면)·
// id·created_by·deleted_at은 이 입력에서 제외한다.
export type ExhibitionEditInput = Pick<
  Exhibition,
  'title' | 'venue' | 'address' | 'startDate' | 'endDate' | 'status' | 'enforceStaffQualification'
>

export async function updateExhibition(id: number, input: ExhibitionEditInput): Promise<Exhibition> {
  const existing = MOCK_EXHIBITIONS.find((exhibition) => exhibition.id === id)
  if (!existing) throw new Error('Exhibition not found')

  const updated: Exhibition = { ...existing, ...input }
  MOCK_EXHIBITIONS = MOCK_EXHIBITIONS.map((exhibition) => (exhibition.id === id ? updated : exhibition))
  return mockDelay(updated)
}
