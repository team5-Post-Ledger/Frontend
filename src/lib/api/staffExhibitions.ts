import type { ExhibitionStatus } from '../../types'
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

// 시드 전략: 행사 1(하드 게이트)에서 qualified=true, 행사 2(소프트 게이트)에서 qualified=false.
// → 하드 게이트 행사에서는 정상 진입, 소프트 게이트 행사에서는 경고 배너를 모두 테스트할 수 있다.
const MOCK_PROGRESS: Record<number, MyProgressResult> = {
  1: {
    exhibitionId: 1,
    qualified: true,
    requiredTotal: 2,
    requiredPassed: 2,
    guides: [
      {
        guideId: 1,
        title: '행사장 출입 및 안전 수칙',
        category: '안전수칙',
        isRequired: true,
        passed: true,
        videoCompleted: null,
        quizScore: null,
      },
      {
        guideId: 3,
        title: '전기·네트워크 안전교육',
        category: '전기네트워크',
        isRequired: true,
        passed: true,
        videoCompleted: true,
        quizScore: 100,
      },
    ],
  },
  2: {
    exhibitionId: 2,
    qualified: false,
    requiredTotal: 2,
    requiredPassed: 0,
    guides: [
      {
        guideId: 1,
        title: '행사장 출입 및 안전 수칙',
        category: '안전수칙',
        isRequired: true,
        passed: false,
        videoCompleted: null,
        quizScore: null,
      },
      {
        guideId: 3,
        title: '전기·네트워크 안전교육',
        category: '전기네트워크',
        isRequired: true,
        passed: false,
        videoCompleted: false,
        quizScore: null,
      },
    ],
  },
}

export async function getMyProgress(exhibitionId: number): Promise<MyProgressResult> {
  const result = MOCK_PROGRESS[exhibitionId]
  if (!result) {
    return mockDelay({
      exhibitionId,
      qualified: false,
      requiredTotal: 0,
      requiredPassed: 0,
      guides: [],
    })
  }
  return mockDelay(result)
}
