import type { ConsoleNavGroup, ConsoleNavItem } from '../../components/ConsoleTopBar'

// EXPO_ADMIN 네비의 단일 출처. 상단바(primary)·더보기(overflow)·운영 허브(hub)가
// 같은 항목 정의를 나눠 써 경로/라벨이 어긋나지 않게 한다.
//
// 운영 대시보드는 "현재 선택한 행사" id에 의존하므로 함수로 주입한다.
// 예약·체크인·통계 등 나머지는 RequireCurrentExhibition 가드가 감싼 경로라,
// 행사 미선택 상태에서 눌러도 가드가 /admin(행사 선택)으로 되돌린다.

const RESERVATIONS: ConsoleNavItem = { to: '/admin/reservations', label: '예약 관리' }
const CHECKIN: ConsoleNavItem = { to: '/admin/checkin', label: '체크인' }
// '/admin/stats'는 '/admin/stats/flow'와 접두사가 겹쳐 end로 정확 매칭한다.
const STATS: ConsoleNavItem = { to: '/admin/stats', label: '통계', end: true }
const FLOW: ConsoleNavItem = { to: '/admin/stats/flow', label: '동선 흐름' }

const MASTER_ITEMS: ConsoleNavItem[] = [
  { to: '/admin/booths', label: '부스' },
  { to: '/admin/sessions', label: '세션' },
  { to: '/admin/time-slots', label: '슬롯' },
  { to: '/admin/ticket-types', label: '티켓' },
  { to: '/admin/nametags', label: '네임태그' },
]

const HR_ITEMS: ConsoleNavItem[] = [
  { to: '/admin/staff', label: '스태프' },
  { to: '/admin/exhibitors', label: '참가기업' },
]

const EDUCATION: ConsoleNavItem = { to: '/admin/education', label: 'LMS 관리' }

function dashboardItem(exhibitionId: number): ConsoleNavItem {
  return { to: `/admin/exhibitions/${exhibitionId}`, label: '운영 대시보드', end: true }
}

// 상단바에 평면 노출하는 핵심 항목. 행사 선택 전에는 운영 대시보드를 뺀다.
export function getAdminPrimaryNav(exhibitionId: number | null): ConsoleNavItem[] {
  const items: ConsoleNavItem[] = []
  if (exhibitionId !== null) items.push(dashboardItem(exhibitionId))
  items.push(RESERVATIONS, CHECKIN, STATS)
  return items
}

// "더보기 ▾"에 그룹으로 수납하는 저빈도 항목.
export const ADMIN_OVERFLOW_GROUPS: ConsoleNavGroup[] = [
  { label: '마스터', items: MASTER_ITEMS },
  { label: '인력', items: HR_ITEMS },
  { label: '분석', items: [FLOW] },
  { label: '교육', items: [EDUCATION] },
]

// 운영 허브(대시보드) 바로가기 카드용 — 전체 그룹을 노출한다.
export function getAdminHubGroups(exhibitionId: number): ConsoleNavGroup[] {
  return [
    { label: '운영', items: [dashboardItem(exhibitionId), RESERVATIONS, CHECKIN] },
    { label: '마스터', items: MASTER_ITEMS },
    { label: '인력', items: HR_ITEMS },
    { label: '분석', items: [STATS, FLOW] },
    { label: '교육', items: [EDUCATION] },
  ]
}
