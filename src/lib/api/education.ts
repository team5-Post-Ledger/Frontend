import type { EducationGuide, EducationGuidePublic, EducationTargetRole } from '../../types'
import { mockDelay } from './mockClient'

// 어드민 함수에는 answer 포함 EducationGuide를 그대로 반환한다.
// STAFF·EXHIBITOR 화면에는 아래 두 함수(정답 제거)만 사용한다(§6.7).
function stripAnswer(guide: EducationGuide): EducationGuidePublic {
  return {
    ...guide,
    quizQuestions: guide.quizQuestions
      ? guide.quizQuestions.map(({ answer: _answer, ...rest }) => rest)
      : null,
  }
}

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

// ── 어드민 CRUD (answer 포함 EducationGuide 반환 — 편집 경로 전용) ────────────────

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

// GET /api/education/guides?targetRole= (§6.7) — 역할별 필터 + 정답 제거.
export async function getEducationGuidesByRole(targetRole: EducationTargetRole): Promise<EducationGuidePublic[]> {
  const guides = MOCK_EDUCATION_GUIDES.filter((g) => g.targetRole === targetRole && g.status === 'ACTIVE')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(stripAnswer)
  return mockDelay(guides)
}

// GET /api/education/guides/{id} (§6.7) — 단건 조회, 정답 제거.
export async function getEducationGuidePublic(id: number): Promise<EducationGuidePublic | null> {
  const guide = MOCK_EDUCATION_GUIDES.find((g) => g.id === id) ?? null
  return mockDelay(guide ? stripAnswer(guide) : null)
}

// ── education_completion 인메모리 저장소 (§5.7, §6.7) ────────────────────────────
// guide_id × user_id UNIQUE — 목에서는 단일 STAFF 사용자로 단순화.
// getMyProgress(staffExhibitions.ts)는 이 저장소를 직접 읽어 qualified 재계산한다(별도 진실원 금지).

export interface CompletionRecord {
  guideId: number
  videoCompleted: boolean
  quizScore: number | null
  quizPassed: boolean | null
  passed: boolean
}

// 초기 시드: guide 1(텍스트, 필수) 수료 완료 / guide 3(영상+퀴즈, 필수) 미수료.
// → STAFF가 처음 로그인하면 qualified=false → 체크인 허브 차단 → 교육 완료 후 차단 해제.
const MOCK_COMPLETIONS = new Map<number, CompletionRecord>([
  [1, { guideId: 1, videoCompleted: false, quizScore: null, quizPassed: null, passed: true }],
  [3, { guideId: 3, videoCompleted: false, quizScore: null, quizPassed: null, passed: false }],
])

// staffExhibitions.ts가 qualified를 동적으로 계산할 때 사용하는 두 헬퍼.
export function getCompletionRecord(guideId: number): CompletionRecord | undefined {
  return MOCK_COMPLETIONS.get(guideId)
}

export function getRequiredGuidesByRole(targetRole: EducationTargetRole): EducationGuide[] {
  return MOCK_EDUCATION_GUIDES.filter((g) => g.targetRole === targetRole && g.isRequired && g.status === 'ACTIVE')
}

// ── 이수 판정 헬퍼 (§3.8, §6.7) ────────────────────────────────────────────────

function evaluatePassed(guide: EducationGuide, record: CompletionRecord): boolean {
  const hasVideo = !!guide.videoUrl
  const hasQuiz = !!(guide.quizQuestions?.length && guide.quizPassScore !== null)
  if (!hasVideo && !hasQuiz) return record.passed           // 텍스트: confirm이 직접 설정
  if (hasVideo && !hasQuiz) return record.videoCompleted   // 영상만: 시청 완료 = 이수
  if (!hasVideo && hasQuiz) return record.quizPassed === true  // 퀴즈만: 통과 = 이수
  return record.videoCompleted && record.quizPassed === true   // 영상+퀴즈: 둘 다 필요
}

function computeQualified(targetRole: EducationTargetRole): boolean {
  return getRequiredGuidesByRole(targetRole).every((g) => MOCK_COMPLETIONS.get(g.id)?.passed === true)
}

// ── 이수 처리 목 함수 (§6.7) ───────────────────────────────────────────────────

export interface QuizAnswer {
  questionIndex: number
  selectedOptionIndex: number
}

export interface QuizSubmitResult {
  score: number
  quizPassed: boolean
  videoRequired: boolean
  videoCompleted: boolean
  completed: boolean
  qualified: boolean
  message?: string
}

export interface LmsActionResult {
  completed: boolean
  qualified: boolean
  message?: string
}

// POST /api/education/guides/{id}/quiz/submit — 채점은 서버(여기)에서만 수행, 정답 미노출.
export async function submitQuiz(guideId: number, answers: QuizAnswer[]): Promise<QuizSubmitResult> {
  const guide = MOCK_EDUCATION_GUIDES.find((g) => g.id === guideId)
  if (!guide?.quizQuestions?.length) throw new Error('퀴즈가 없는 가이드입니다.')

  const questions = guide.quizQuestions
  let correct = 0
  for (const { questionIndex, selectedOptionIndex } of answers) {
    if (questions[questionIndex]?.answer === selectedOptionIndex) correct++
  }
  const score = Math.round((correct / questions.length) * 100)
  const quizPassed = guide.quizPassScore !== null && score >= guide.quizPassScore

  const existing = MOCK_COMPLETIONS.get(guideId) ?? {
    guideId, videoCompleted: false, quizScore: null, quizPassed: null, passed: false,
  }
  const updated: CompletionRecord = { ...existing, quizScore: score, quizPassed }
  updated.passed = evaluatePassed(guide, updated)
  MOCK_COMPLETIONS.set(guideId, updated)

  const videoRequired = !!guide.videoUrl
  const completed = updated.passed
  const qualified = computeQualified(guide.targetRole)

  let message: string | undefined
  if (!quizPassed) {
    message = `${score}점으로 합격 기준(${guide.quizPassScore}점)에 미달했습니다. 다시 응시해주세요.`
  } else if (quizPassed && videoRequired && !updated.videoCompleted) {
    message = '퀴즈는 통과했지만 안전 영상 시청을 완료해야 이수로 인정됩니다.'
  } else if (completed) {
    message = '이수가 완료되었습니다.'
  }

  return mockDelay({ score, quizPassed, videoRequired, videoCompleted: updated.videoCompleted, completed, qualified, message })
}

// POST /api/education/guides/{id}/video-complete — video_completed=true upsert 후 이수 재평가.
export async function recordVideoComplete(guideId: number): Promise<LmsActionResult> {
  const guide = MOCK_EDUCATION_GUIDES.find((g) => g.id === guideId)
  if (!guide?.videoUrl) throw new Error('영상이 없는 가이드입니다.')

  const existing = MOCK_COMPLETIONS.get(guideId) ?? {
    guideId, videoCompleted: false, quizScore: null, quizPassed: null, passed: false,
  }
  const updated: CompletionRecord = { ...existing, videoCompleted: true }
  updated.passed = evaluatePassed(guide, updated)
  MOCK_COMPLETIONS.set(guideId, updated)

  const qualified = computeQualified(guide.targetRole)
  const hasQuiz = !!(guide.quizQuestions?.length && guide.quizPassScore !== null)
  const message = updated.passed
    ? '이수가 완료되었습니다.'
    : hasQuiz
      ? '영상 시청이 기록되었습니다. 퀴즈를 응시해주세요.'
      : undefined

  return mockDelay({ completed: updated.passed, qualified, message })
}

// POST /api/education/guides/{id}/confirm — 텍스트 전용만 허용(§6.7). 영상/퀴즈 가이드 거부.
export async function confirmTextGuide(guideId: number): Promise<LmsActionResult> {
  const guide = MOCK_EDUCATION_GUIDES.find((g) => g.id === guideId)
  if (!guide) throw new Error('가이드를 찾을 수 없습니다.')
  const hasVideo = !!guide.videoUrl
  const hasQuiz = !!(guide.quizQuestions?.length && guide.quizPassScore !== null)
  if (hasVideo || hasQuiz) throw new Error('영상 또는 퀴즈가 있는 가이드에는 확인 완료를 사용할 수 없습니다.')

  const existing = MOCK_COMPLETIONS.get(guideId) ?? {
    guideId, videoCompleted: false, quizScore: null, quizPassed: null, passed: false,
  }
  const updated: CompletionRecord = { ...existing, passed: true }
  MOCK_COMPLETIONS.set(guideId, updated)

  const qualified = computeQualified(guide.targetRole)
  return mockDelay({ completed: true, qualified, message: '확인이 완료되었습니다.' })
}

// GET /api/education/guides/{id}/completion — 내 단건 이수 현황 (상세 화면용).
export async function getGuideCompletion(guideId: number): Promise<CompletionRecord | null> {
  return mockDelay(MOCK_COMPLETIONS.get(guideId) ?? null)
}
