import { todayDateKey } from '../../lib/calendarGrid'
import { formatMonthDay } from '../../lib/format'
import type { Exhibition } from '../../types'

/**
 * 실시간 혼잡도는 "오늘 실제로 진행중인 행사"에만 존재한다. 시작 전/종료 행사는 화면이 이
 * 판정으로 혼잡도 쿼리를 끄고(폴링 낭비 방지) 안내 문구를 대신 보여준다.
 * 판정 기준은 getExhibitionDisplayStatus(displayStatus.ts)와 동일하게 status + 날짜 조합.
 */
export type CongestionAvailability = 'LIVE' | 'BEFORE_START' | 'ENDED'

export function getCongestionAvailability(
  exhibition: Pick<Exhibition, 'status' | 'startDate' | 'endDate'>,
): CongestionAvailability {
  if (exhibition.status === 'CLOSED') return 'ENDED'

  const today = todayDateKey()
  if (today > exhibition.endDate) return 'ENDED'
  if (exhibition.status === 'OPEN' && today >= exhibition.startDate) return 'LIVE'
  // 시작 전 또는 DRAFT(미게시) — 방문자에겐 보이지 않지만 admin 대시보드에서는 올 수 있다.
  return 'BEFORE_START'
}

export function congestionUnavailableMessage(
  availability: Exclude<CongestionAvailability, 'LIVE'>,
  startDate: string,
): string {
  return availability === 'BEFORE_START'
    ? `행사 시작 후에 실시간 혼잡도를 확인할 수 있어요 (${formatMonthDay(startDate)} 시작)`
    : '종료된 행사라 실시간 혼잡도를 제공하지 않아요'
}

/** 진행중인데 아직 집계된 포인트가 없는 경우(snapshot.level === null)의 문구. */
export const CONGESTION_EMPTY_MESSAGE = '아직 집계된 혼잡도가 없어요'
