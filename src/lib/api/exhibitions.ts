import type { Exhibition, ExhibitionAdmin } from '../../types'
import { platformExhibitionAdminSeed, platformExhibitionSeed } from '../mock/platformSeed'
import { mockDelay } from './mockClient'

let MOCK_EXHIBITIONS: Exhibition[] = platformExhibitionSeed.map((exhibition) => ({ ...exhibition }))

// GET /api/exhibitions는 ALL 역할에 공개되는 대신 OPEN 박람회만 반환한다(§6.1).
// DRAFT(미게시)·CLOSED(종료)는 이 목록에서 제외된다.
export async function getExhibitions(): Promise<Exhibition[]> {
  return mockDelay(MOCK_EXHIBITIONS.filter((exhibition) => exhibition.status === 'OPEN'))
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
