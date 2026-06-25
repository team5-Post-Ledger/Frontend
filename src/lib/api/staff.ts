import { mockDelay } from './mockClient'

// exhibition_staff(§5.1) 매핑 + user(role=STAFF) 표시용 조인 뷰. qualified(§2.6)는 실제로는
// education_completion(필수 가이드 전부 passed=true) COUNT 집계로 산출되지만, LMS 모듈이 아직 없어
// 지금은 목 값으로 직접 둔다.
export interface StaffAssignmentView {
  id: number
  userId: number
  name: string
  email: string
  assignedAt: string
  qualified: boolean
}

let mockStaffAssignments: Record<number, StaffAssignmentView[]> = {
  1: [
    { id: 1, userId: 5, name: '최스태프', email: 'staff@fairpilot.io', assignedAt: '2026-06-01T09:00:00', qualified: true },
    { id: 2, userId: 10, name: '한도윤', email: 'dyhan@fairpilot.io', assignedAt: '2026-06-03T10:30:00', qualified: true },
    { id: 3, userId: 11, name: '오서아', email: 'seoa.oh@fairpilot.io', assignedAt: '2026-06-10T14:00:00', qualified: false },
    { id: 4, userId: 12, name: '백지호', email: 'jiho.baek@fairpilot.io', assignedAt: '2026-06-18T11:15:00', qualified: false },
    { id: 5, userId: 13, name: '신유나', email: 'yuna.shin@fairpilot.io', assignedAt: '2026-07-01T09:45:00', qualified: true },
  ],
}

let nextAssignmentId = 6
let nextStaffUserId = 14

export async function getStaffAssignments(exhibitionId: number): Promise<StaffAssignmentView[]> {
  return mockDelay(mockStaffAssignments[exhibitionId] ?? [])
}

export interface StaffAssignInput {
  name: string
  email: string
}

// §2.2 "EXPO_ADMIN → 담당 박람회의 STAFF 발급"의 목 구현. 이메일이 이 행사에 이미 배정된 계정과
// 같으면 그 user_id를 그대로 두고(기존 계정 재배정 데모), 아니면 새 STAFF 계정을 발급해 배정한다.
// 신규 배정은 LMS 미수료 상태(qualified=false)로 시작한다.
export async function assignStaff(exhibitionId: number, input: StaffAssignInput): Promise<StaffAssignmentView> {
  const list = mockStaffAssignments[exhibitionId] ?? []
  const existing = list.find((assignment) => assignment.email.toLowerCase() === input.email.trim().toLowerCase())

  const assignment: StaffAssignmentView = {
    id: nextAssignmentId++,
    userId: existing?.userId ?? nextStaffUserId++,
    name: input.name.trim(),
    email: input.email.trim(),
    assignedAt: new Date().toISOString(),
    qualified: false,
  }

  mockStaffAssignments = { ...mockStaffAssignments, [exhibitionId]: [...list, assignment] }
  return mockDelay(assignment)
}

// 배정 해제(§5.1 exhibition_staff 매핑 제거) — user 계정 자체는 남고 이 행사와의 매핑만 사라진다.
export async function unassignStaff(exhibitionId: number, assignmentId: number): Promise<void> {
  const list = mockStaffAssignments[exhibitionId] ?? []
  mockStaffAssignments = { ...mockStaffAssignments, [exhibitionId]: list.filter((assignment) => assignment.id !== assignmentId) }
  await mockDelay(undefined)
}
