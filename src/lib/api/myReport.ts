import type { MovementMode } from '../../types'
import { getBoothCategories, getBoothsByExhibition } from './booths'
import { getMyReservation } from './myReservations'
import { mockDelay } from './mockClient'

export interface MyReportVisitedBooth {
  visitOrder: number
  boothId: number
  name: string
  dwellSeconds: number
  isEstimated: boolean
  categoryName: string | null
  tags: string[]
}

export interface MyReportAttendee {
  attendeeId: number
  name: string
  movementMode: MovementMode
  // GROUP일 때만 의미 있다. §6.13 규칙 3: "대표 attendee만 스캔 기록을 가지므로 단체 리포트 1건으로
  // 표시하고 head_count=group_size임을 명시한다(개별 구성원 동선은 제공하지 않음)."
  groupSize: number
  visitedBooths: MyReportVisitedBooth[]
  visitedCount: number
  totalDwellSeconds: number
  touchedCategories: string[]
  touchedTags: string[]
}

export interface MyReportResponse {
  reservationId: number
  attendees: MyReportAttendee[]
}

// 이 시드는 예약 502(체크인 완료) 시나리오 전용이다. 다른 reservationId는 아직 방문 기록이 없으므로
// 빈 리포트를 반환한다. attendeeId·name·movementMode·groupSize는 항상 myReservations.ts의 예약
// 502 데이터에서 그대로 가져온다 — 예약 상세 화면과 리포트가 서로 다른 인물/이동방식을 보여주는
// 불일치를 만들지 않기 위해서다.
const SEED_RESERVATION_ID = 502

// 이 reservationId에 대해 §6.13 GET /api/reservations/{id}/report가 실제로 데이터를 줄지 동기적으로
// 판정한다. 버튼 노출·라우트 가드 같은 UI 분기는 비동기 조회 없이 이 값만으로 결정할 수 있어야 한다.
export function hasMockReport(reservationId: number): boolean {
  return reservationId === SEED_RESERVATION_ID
}

// 시드 dwell 데이터(부스별 체류시간 순서). name·categoryName·tags는 실제 booth 데이터와 조인해서 채운다.
const SEED_VISITS: Array<{ visitOrder: number; boothId: number; dwellSeconds: number; isEstimated: boolean }> = [
  { visitOrder: 1, boothId: 1, dwellSeconds: 1080, isEstimated: false },
  { visitOrder: 2, boothId: 2, dwellSeconds: 1920, isEstimated: false },
  { visitOrder: 3, boothId: 5, dwellSeconds: 600, isEstimated: false },
  { visitOrder: 4, boothId: 6, dwellSeconds: 1500, isEstimated: false },
  { visitOrder: 5, boothId: 3, dwellSeconds: 2880, isEstimated: false },
  { visitOrder: 6, boothId: 7, dwellSeconds: 900, isEstimated: false },
  // 자동 EXIT 구간(§6.13 규칙 4: close_reason in (NEXT_ENTRY_AUTO, TIMEOUT_AUTO))은 "예상 체류"로 표시한다.
  { visitOrder: 7, boothId: 9, dwellSeconds: 720, isEstimated: true },
  { visitOrder: 8, boothId: 4, dwellSeconds: 1080, isEstimated: false },
  { visitOrder: 9, boothId: 12, dwellSeconds: 420, isEstimated: true },
]

/**
 * GET /api/reservations/{id}/report 목 구현(§6.13). 실제로는 visit_log/visit_dwell을 해당 예약의
 * attendee 단위로 재집계한다(stat_*가 아니라 원천 테이블, §3.4). GROUP 이동은 대표 attendee만 스캔
 * 기록을 가지므로 단체 리포트 1건으로 표시하고 head_count=group_size임을 명시한다(규칙 3).
 * 지금은 백엔드가 없어 예약 502(시드 시나리오)에 한해 실제 부스(name·categoryId·tags)와 시드 dwell
 * 데이터를 조인해 흉내낸다. 대표 attendee 식별(이름·movementMode·groupSize)은 myReservations.ts의
 * 예약 데이터에서 가져온다 — 리포트가 자체적으로 별도 인물을 지어내지 않는다.
 */
export async function getMyReport(reservationId: number): Promise<MyReportResponse> {
  if (reservationId !== SEED_RESERVATION_ID) {
    return mockDelay({ reservationId, attendees: [] })
  }

  const reservation = await getMyReservation(reservationId)
  const representative = reservation?.attendees.find((attendee) => attendee.isGroupLeader) ?? reservation?.attendees[0]

  if (!reservation || !representative) {
    return mockDelay({ reservationId, attendees: [] })
  }

  const [booths, categories] = await Promise.all([getBoothsByExhibition(reservation.exhibitionId), getBoothCategories()])
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))

  const visitedBooths: MyReportVisitedBooth[] = SEED_VISITS.map((visit) => {
    const booth = booths.find((item) => item.id === visit.boothId)
    return {
      visitOrder: visit.visitOrder,
      boothId: visit.boothId,
      name: booth?.name ?? `부스 #${visit.boothId}`,
      dwellSeconds: visit.dwellSeconds,
      isEstimated: visit.isEstimated,
      categoryName: booth?.categoryId != null ? categoryNameById.get(booth.categoryId) ?? null : null,
      tags: booth?.tags ?? [],
    }
  })

  const touchedCategories = Array.from(
    new Set(visitedBooths.map((visit) => visit.categoryName).filter((name): name is string => Boolean(name))),
  )
  const touchedTags = Array.from(new Set(visitedBooths.flatMap((visit) => visit.tags)))

  const attendee: MyReportAttendee = {
    attendeeId: representative.id,
    name: representative.name,
    movementMode: reservation.movementMode,
    groupSize: reservation.groupSize,
    visitedBooths,
    visitedCount: visitedBooths.length,
    totalDwellSeconds: visitedBooths.reduce((sum, visit) => sum + visit.dwellSeconds, 0),
    touchedCategories,
    touchedTags,
  }

  return mockDelay({ reservationId, attendees: [attendee] })
}
