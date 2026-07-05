import type { DatePresetMode } from './dateRange'
import type { StatusFilter } from './displayStatus'

// 상세필터 패널의 관람일 프리셋(오늘 포함)
export const DATE_PRESET_OPTIONS: Array<{ mode: Exclude<DatePresetMode, 'custom'>; label: string }> = [
  { mode: 'today', label: '오늘' },
  { mode: 'weekend', label: '이번 주말' },
  { mode: 'nextWeek', label: '다음 주' },
]

// 검색바 아래 바로가기 pill — 패널보다 축소된 구성(spec.md 결정 로그 #15)
export const QUICK_DATE_PRESETS: Array<{ mode: Exclude<DatePresetMode, 'custom'>; label: string }> = [
  { mode: 'weekend', label: '이번 주말' },
  { mode: 'nextWeek', label: '다음 주' },
]

// 실제 mock 데이터(lib/mock/platformSeed.ts)에 존재하는 venue/address 값 — 새 시드 없이 그대로 매칭된다.
export const QUICK_VENUE_PRESETS: string[] = ['코엑스', '킨텍스']

export const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'ONGOING', label: '진행중' },
  { value: 'UPCOMING', label: '예약중' },
]
