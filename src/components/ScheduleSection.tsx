import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { isExhibitionOnDate } from '../features/exhibition/dateRange'
import { isOngoingToday } from '../features/exhibition/displayStatus'
import { useExhibitions } from '../features/exhibition/hooks'
import { compareForCalendarList } from '../features/exhibition/sortForCalendar'
import { todayDateKey } from '../lib/calendarGrid'
import { formatDateRange } from '../lib/format'
import { MonthCalendar } from './MonthCalendar'
import { QueryState } from './QueryState'

export function ScheduleSection() {
  const exhibitions = useExhibitions()
  const [selectedDate, setSelectedDate] = useState(todayDateKey)

  const exhibitionsOnSelectedDate = useMemo(() => {
    const data = exhibitions.data ?? []
    return data.filter((exhibition) => isExhibitionOnDate(exhibition, selectedDate)).sort(compareForCalendarList)
  }, [exhibitions.data, selectedDate])

  const isToday = selectedDate === todayDateKey()

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[7fr_3fr]">
      <QueryState isLoading={exhibitions.isLoading} isError={exhibitions.isError} height={360}>
        <MonthCalendar exhibitions={exhibitions.data ?? []} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </QueryState>

      <div className="border border-line bg-white p-4">
        <div className="mb-3 text-sm font-bold text-ink">
          {isToday ? '오늘 진행 중인 박람회' : `${selectedDate} 진행 중인 박람회`}
        </div>

        {exhibitionsOnSelectedDate.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            {isToday ? '오늘 진행 중인 박람회가 없습니다.' : '이 날짜에 진행 중인 박람회가 없습니다.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {exhibitionsOnSelectedDate.map((exhibition) => (
              <Link
                key={exhibition.id}
                to={`/exhibitions/${exhibition.id}`}
                className="block border border-line bg-white p-3 transition-colors hover:border-primary active:bg-surface"
              >
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface px-2.5 py-1">
                  <span className="line-clamp-1 text-xs font-bold text-ink">{exhibition.title}</span>
                  {isOngoingToday(exhibition) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-live" />}
                </span>
                <div className="mt-2 text-xs text-muted">
                  {formatDateRange(exhibition.startDate, exhibition.endDate)} · {exhibition.venue}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
