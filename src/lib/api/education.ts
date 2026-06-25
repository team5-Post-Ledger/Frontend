import type { EducationGuide } from '../../types'
import { mockDelay } from './mockClient'

// §5.7 education_guide 컬럼 그대로(목적/유형 판정에 쓰는 content·video_url·is_required·
// quiz_questions·quiz_pass_score 포함). 텍스트만/영상/영상+퀴즈 3가지 유형과 필수·선택을
// 섞어 시드한다.
let MOCK_EDUCATION_GUIDES: EducationGuide[] = [
  {
    id: 1,
    exhibitionId: null,
    targetRole: 'STAFF',
    category: '안전수칙',
    title: '행사장 출입 및 안전 수칙',
    content: '행사장 출입 절차, 비상 대피로, 금지 행위를 안내합니다.',
    videoUrl: null,
    isRequired: true,
    sortOrder: 1,
    quizQuestions: null,
    quizPassScore: null,
    status: 'ACTIVE',
  },
  {
    id: 2,
    exhibitionId: null,
    targetRole: 'EXHIBITOR',
    category: '부스설치',
    title: '부스 설치 가이드',
    content: '부스 반입·설치·철수 일정과 시공 시 유의사항을 설명합니다.',
    videoUrl: 'https://cdn.fairpilot.io/lms/booth-setup.mp4',
    isRequired: false,
    sortOrder: 2,
    quizQuestions: null,
    quizPassScore: null,
    status: 'ACTIVE',
  },
  {
    id: 3,
    exhibitionId: null,
    targetRole: 'STAFF',
    category: '전기네트워크',
    title: '전기·네트워크 안전교육',
    content: '현장 전기 배선·네트워크 장비 취급 시 안전 수칙을 다룹니다.',
    videoUrl: 'https://cdn.fairpilot.io/lms/electric-safety.mp4',
    isRequired: true,
    sortOrder: 3,
    quizQuestions: [
      { q: '정전 시 가장 먼저 해야 할 조치는?', options: ['고객 안내 방송', '메인 차단기 확인', '데스크 이탈'], answer: 1 },
      { q: '부스 전기 배선 점검은 누가 하나요?', options: ['지정 전기 담당자', '아무 직원', '점검 안 함'], answer: 0 },
    ],
    quizPassScore: 80,
    status: 'ACTIVE',
  },
  {
    id: 4,
    exhibitionId: null,
    targetRole: 'EXHIBITOR',
    category: '행사안내',
    title: '참가기업 행사 안내 매뉴얼',
    content: '행사 일정, 담당자 연락처, 현장 데스크 위치를 안내합니다.',
    videoUrl: null,
    isRequired: false,
    sortOrder: 4,
    quizQuestions: null,
    quizPassScore: null,
    status: 'ACTIVE',
  },
]

let nextEducationGuideId = 5

export async function getEducationGuides(): Promise<EducationGuide[]> {
  return mockDelay(MOCK_EDUCATION_GUIDES)
}

export async function getEducationGuide(id: number): Promise<EducationGuide | null> {
  return mockDelay(MOCK_EDUCATION_GUIDES.find((guide) => guide.id === id) ?? null)
}

export type EducationGuideInput = Omit<EducationGuide, 'id'>

export async function createEducationGuide(input: EducationGuideInput): Promise<EducationGuide> {
  const guide: EducationGuide = { id: nextEducationGuideId++, ...input }
  MOCK_EDUCATION_GUIDES = [...MOCK_EDUCATION_GUIDES, guide]
  return mockDelay(guide)
}

export async function updateEducationGuide(id: number, input: EducationGuideInput): Promise<EducationGuide> {
  const guide: EducationGuide = { id, ...input }
  MOCK_EDUCATION_GUIDES = MOCK_EDUCATION_GUIDES.map((existing) => (existing.id === id ? guide : existing))
  return mockDelay(guide)
}

export async function deleteEducationGuide(id: number): Promise<void> {
  MOCK_EDUCATION_GUIDES = MOCK_EDUCATION_GUIDES.filter((guide) => guide.id !== id)
  await mockDelay(undefined)
}
