import type { ExhibitionStatus } from '../../types'
import { getCompletionRecord, getRequiredGuidesByRole } from './education'
import { mockDelay } from './mockClient'

// GET /api/staff/my-exhibitions — exhibition_staff 매핑된 행사 목록(§2.5).
// 반환 필드에 enforce_staff_qualification을 포함해 클라이언트가 소프트/하드 게이트를 판정한다(§2.6).
export interface StaffExhibitionSummary {
  id: number
  title: string
  status: ExhibitionStatus
  enforceStaffQualification: boolean
  startDate: string
  endDate: string
  venue: string
}

// 현재 로그인 STAFF(userId=5, 최스태프)의 담당 행사.
// 복수 선택 UI가 검증되도록 2건. 하나는 하드 게이트(id=1), 하나는 소프트 게이트(id=2).
const MOCK_MY_EXHIBITIONS: StaffExhibitionSummary[] = [
  {
    id: 1,
    title: '2026 서울 스마트팩토리 박람회',
    status: 'OPEN',
    enforceStaffQualification: true,
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    venue: '코엑스 1전시장',
  },
  {
    id: 2,
    title: '2026 친환경 포장재 엑스포',
    status: 'OPEN',
    enforceStaffQualification: false,
    startDate: '2026-10-14',
    endDate: '2026-10-16',
    venue: '킨텍스 제2전시장',
  },
]

export async function getMyStaffExhibitions(): Promise<StaffExhibitionSummary[]> {
  return mockDelay(MOCK_MY_EXHIBITIONS)
}

// GET /api/education/my-progress?exhibitionId= — 내 LMS 이수 현황 + qualified 여부(§6.7).
// qualified = 해당 행사의 필수 가이드(isRequired=true) 중 passed=true인 것이 전부 충족된 상태(§5.7).
// MOCK_COMPLETIONS(education.ts)를 직접 읽어 재계산 — 별도 진실원 없음.
export interface GuideProgressItem {
  guideId: number
  title: string
  category: string
  isRequired: boolean
  passed: boolean
  videoCompleted: boolean | null
  quizScore: number | null
}

export interface MyProgressResult {
  exhibitionId: number
  qualified: boolean
  requiredTotal: number
  requiredPassed: number
  guides: GuideProgressItem[]
}

export async function getMyProgress(exhibitionId: number): Promise<MyProgressResult> {
  // 플랫폼 공통(exhibitionId=null) STAFF 필수 가이드를 기준으로 qualified 판정.
  // 행사별 전용 가이드 스코핑은 실 API 연결 시 서버가 처리한다.
  const requiredGuides = getRequiredGuidesByRole('STAFF')
  const guides: GuideProgressItem[] = requiredGuides.map((g) => {
    const c = getCompletionRecord(g.id)
    return {
      guideId: g.id,
      title: g.title,
      category: g.category,
      isRequired: g.isRequired,
      passed: c?.passed ?? false,
      videoCompleted: c?.videoCompleted ?? false,
      quizScore: c?.quizScore ?? null,
    }
  })
  const requiredPassed = guides.filter((g) => g.passed).length
  return mockDelay({
    exhibitionId,
    qualified: requiredPassed === requiredGuides.length,
    requiredTotal: requiredGuides.length,
    requiredPassed,
    guides,
  })
}
