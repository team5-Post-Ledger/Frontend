import { useState } from 'react'
import type { DatePresetMode } from './dateRange'
import type { StatusFilter } from './displayStatus'

export interface ExhibitionFilterState {
  keyword: string
  dateMode: DatePresetMode | ''
  dateFrom: string
  dateTo: string
  venue: string
  status: StatusFilter
}

export const EMPTY_FILTER_STATE: ExhibitionFilterState = {
  keyword: '',
  dateMode: '',
  dateFrom: '',
  dateTo: '',
  venue: '',
  status: 'ALL',
}

/** 상세필터 패널의 draft 상태 관리. 패널이 열릴 때마다 새로 mount되므로 초기값 재동기화는 불필요하다. */
export function useExhibitionFilterState(initial: ExhibitionFilterState) {
  const [draft, setDraft] = useState<ExhibitionFilterState>(initial)

  function reset() {
    setDraft({ ...EMPTY_FILTER_STATE, keyword: draft.keyword })
  }

  return { draft, setDraft, reset }
}
