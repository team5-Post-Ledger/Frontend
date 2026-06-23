import type { CheckinMethod } from '../../types'

export const CHECKIN_METHOD_LABEL: Record<CheckinMethod, string> = {
  QR_SELF: 'QR 입장 체크인',
  MANUAL_SEARCH: '수기 체크인',
  ONSITE_MANUAL: '현장 처리',
  WALK_IN: '워크인 등록',
  REISSUE: '재발급',
}

export function formatMinutesAgo(minutes: number): string {
  if (minutes <= 0) return '방금'
  return `${minutes}분 전`
}
