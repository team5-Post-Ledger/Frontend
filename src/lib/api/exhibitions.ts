import type { Exhibition, ExhibitionAdmin, ExhibitionStatus } from '../../types'
import { platformExhibitionAdminSeed, platformExhibitionSeed } from '../mock/platformSeed'
import { USE_MOCK } from './config'
import { ApiError, apiGet } from './httpClient'
import { mockDelay } from './mockClient'

let MOCK_EXHIBITIONS: Exhibition[] = platformExhibitionSeed.map((exhibition) => ({ ...exhibition }))

// 실 백엔드 GET /api/exhibitions 응답(엔티티). 프론트 Exhibition에 없는 createdAt/updatedAt/deleted는 버리고,
// 응답에 없는 floorMapMeta·deletedAt·bannerImageUrl은 null로 폴백한다(2026-07-06 실측).
interface ExhibitionDto {
  id: number
  title: string
  slug: string
  venue: string
  address: string
  startDate: string
  endDate: string
  status: ExhibitionStatus
  enforceStaffQualification: boolean
  createdBy: number
  deleted?: boolean
  floorMapMeta?: Record<string, unknown> | null
  bannerImageUrl?: string | null
}

function adaptExhibition(dto: ExhibitionDto): Exhibition {
  return {
    id: dto.id,
    title: dto.title,
    slug: dto.slug,
    venue: dto.venue,
    address: dto.address,
    floorMapMeta: dto.floorMapMeta ?? null,
    startDate: dto.startDate,
    endDate: dto.endDate,
    status: dto.status,
    enforceStaffQualification: dto.enforceStaffQualification,
    createdBy: dto.createdBy,
    deletedAt: null,
    bannerImageUrl: dto.bannerImageUrl ?? null,
  }
}

// GET /api/exhibitions는 전체(findAll)를 반환하므로 공개 목록용으로 OPEN만 남긴다(§6.1).
// DRAFT(미게시)·CLOSED(종료)는 이 목록에서 제외된다.
export async function getExhibitions(): Promise<Exhibition[]> {
  if (USE_MOCK) return mockDelay(MOCK_EXHIBITIONS.filter((exhibition) => exhibition.status === 'OPEN'))
  const dtos = await apiGet<ExhibitionDto[]>('visitor', '/api/exhibitions')
  return dtos.map(adaptExhibition).filter((exhibition) => exhibition.status === 'OPEN')
}

// §5.1 exhibition_admin — EXPO_ADMIN의 행사 배정 매핑(N:M, 한 admin이 여러 행사를 담당할 수 있다).
// 시드: admin@fairpilot.io(user_id=2, lib/api/auth.ts)가 상태가 다른 행사 3건을 담당.
const MOCK_EXHIBITION_ADMINS: ExhibitionAdmin[] = platformExhibitionAdminSeed.map((admin) => ({ ...admin }))

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
  if (USE_MOCK) return mockDelay(MOCK_EXHIBITIONS.find((exhibition) => exhibition.id === id) ?? null)
  try {
    return adaptExhibition(await apiGet<ExhibitionDto>('visitor', `/api/exhibitions/${id}`))
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

// 백엔드에 추천 전용 엔드포인트가 아직 없어 공개 목록(OPEN)으로 대체한다 — 별도 계약 생기면 교체.
export async function getRecommendedExhibitions(): Promise<Exhibition[]> {
  if (USE_MOCK) return mockDelay(MOCK_EXHIBITIONS.filter((exhibition) => exhibition.status === 'OPEN'))
  return getExhibitions()
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
