import { hasMockReport } from '../../lib/api/myReport'
import type { MyReservation } from '../../lib/api/myReservations'

// 리포트 진입 조건을 한 곳에 모은다 — 예약 상세의 "방문 리포트 보기" 버튼과
// /my/reservations/:id/report 라우트 가드가 반드시 같은 기준을 써야 끊김이 없다.
// "체크인 상태"가 아니라 "리포트 존재 여부"로 판단한다 — 나중에 예약 상태가 CHECKED_IN을
// 지나 다른 상태로 바뀌어도 이미 생성된 리포트는 계속 노출돼야 하기 때문이다.
export function isReportAvailable(reservation: Pick<MyReservation, 'id' | 'status'>): boolean {
  return reservation.status === 'CHECKED_IN' || hasMockReport(reservation.id)
}
