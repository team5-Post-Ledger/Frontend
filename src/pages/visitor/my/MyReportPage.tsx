import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '../../../components/Panel'
import { useMyReservation } from '../../../features/myReservation/hooks'
import { useMyReport } from '../../../features/myReport/hooks'
import { isReportAvailable } from '../../../features/myReport/reportEligibility'
import type { MyReportVisitedBooth } from '../../../lib/api/myReport'

const CHART_PALETTE = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-muted)']
const TAG_CHART_LIMIT = 8
const EMPTY_VISITED_BOOTHS: MyReportVisitedBooth[] = []

function formatDwell(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours === 0 ? `${minutes}분` : `${hours}시간 ${minutes}분`
}

function useDwellByCategory(visitedBooths: MyReportVisitedBooth[]) {
  return useMemo(() => {
    const totals = new Map<string, number>()
    visitedBooths.forEach((visit) => {
      const key = visit.categoryName ?? '미분류'
      totals.set(key, (totals.get(key) ?? 0) + visit.dwellSeconds)
    })
    return Array.from(totals.entries())
      .map(([name, dwellSeconds]) => ({ name, minutes: Math.round(dwellSeconds / 60) }))
      .sort((a, b) => b.minutes - a.minutes)
  }, [visitedBooths])
}

function useTagFrequency(visitedBooths: MyReportVisitedBooth[]) {
  return useMemo(() => {
    const counts = new Map<string, number>()
    visitedBooths.forEach((visit) => visit.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)))
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TAG_CHART_LIMIT)
  }, [visitedBooths])
}

export default function MyReportPage() {
  const { id } = useParams<{ id: string }>()
  const reservationId = id ? Number(id) : null

  const reservation = useMyReservation(reservationId)
  const report = useMyReport(reservationId)
  const attendee = report.data?.attendees[0] ?? null
  const visitedBooths = attendee?.visitedBooths ?? EMPTY_VISITED_BOOTHS

  const visitChartData = useMemo(
    () => visitedBooths.map((visit) => ({ ...visit, minutes: Math.round(visit.dwellSeconds / 60) })),
    [visitedBooths],
  )
  const categoryBreakdown = useDwellByCategory(visitedBooths)
  const tagFrequency = useTagFrequency(visitedBooths)
  const totalCategoryMinutes = categoryBreakdown.reduce((sum, item) => sum + item.minutes, 0)

  const longestBooth = useMemo(() => {
    if (visitedBooths.length === 0) return null
    return visitedBooths.reduce((max, visit) => (visit.dwellSeconds > max.dwellSeconds ? visit : max), visitedBooths[0])
  }, [visitedBooths])

  if (reservationId === null) {
    return <p className="p-6 text-sm text-danger">잘못된 예약 경로입니다.</p>
  }

  if (reservation.isLoading || report.isLoading) {
    return <p className="p-6 text-sm text-muted">불러오는 중...</p>
  }

  if (reservation.isError || !reservation.data) {
    return (
      <div className="p-6">
        <p className="text-sm text-danger">예약을 찾을 수 없습니다.</p>
        <Link to="/my/reservations" className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
          내 예약 목록으로 →
        </Link>
      </div>
    )
  }

  if (!isReportAvailable(reservation.data)) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted">아직 확인할 수 있는 방문 리포트가 없습니다.</p>
        <Link
          to={`/my/reservations/${reservation.data.id}`}
          className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← 예약 상세로
        </Link>
      </div>
    )
  }

  if (report.isError) {
    return <p className="p-6 text-sm text-danger">리포트를 불러오지 못했습니다.</p>
  }

  if (!attendee) {
    return <p className="p-6 text-sm text-muted">아직 집계된 리포트가 없습니다.</p>
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mx-auto w-full lg:max-w-4xl">
        <Link
          to={`/my/reservations/${reservation.data.id}`}
          className="mb-4 inline-block text-xs font-semibold text-muted transition-colors hover:text-primary"
        >
          ← 예약 상세로
        </Link>

        <div className="mb-5">
          <div className="text-xs text-muted">
            {reservation.data.exhibitionTitle} · {reservation.data.exhibitionVenue}
          </div>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-ink lg:text-2xl">내 관람 리포트</h1>
        </div>

        <div className="bg-shell p-5 text-white">
          <div className="text-base font-extrabold tracking-tight">{attendee.name}님의 관람 요약</div>

          {attendee.movementMode === 'GROUP' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border border-white/20 bg-white/10 px-3 py-2">
              <span className="shrink-0 bg-white px-2 py-0.5 text-[10px] font-bold text-ink">단체 리포트</span>
              <span className="text-xs text-white/80">
                대표 참석자 동선 기준 · head_count = {attendee.groupSize}명(개별 구성원 동선은 제공되지 않습니다)
              </span>
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-4">
            <div className="text-center">
              <div className="text-2xl font-extrabold leading-none">{attendee.visitedCount}</div>
              <div className="mt-1.5 text-[11px] text-white/55">방문 부스</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold leading-none">{formatDwell(attendee.totalDwellSeconds)}</div>
              <div className="mt-1.5 text-[11px] text-white/55">총 체류시간</div>
            </div>
            <div className="text-center">
              <div className="line-clamp-1 px-1 text-sm font-extrabold leading-tight">{longestBooth?.name ?? '-'}</div>
              <div className="mt-1.5 text-[11px] text-white/55">최장 체류 부스</div>
            </div>
          </div>
        </div>

        {visitedBooths.length === 0 ? (
          <p className="mt-5 flex h-[200px] items-center justify-center text-sm text-muted">아직 방문한 부스가 없습니다.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Panel title="방문 순서·체류시간" subtitle="방문한 순서대로, 막대가 길수록 오래 머물렀어요">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={visitChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                    <XAxis dataKey="visitOrder" tickFormatter={(value: number) => `${value}번째`} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted)' }} allowDecimals={false} unit="분" />
                    <Tooltip
                      formatter={(value) => [`${Number(value ?? 0)}분`, '체류시간']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.name ?? `${label}번째`}
                    />
                    <Bar dataKey="minutes" name="체류시간" radius={[6, 6, 0, 0]}>
                      {visitChartData.map((entry) => (
                        <Cell key={entry.visitOrder} fill={entry.isEstimated ? 'var(--color-muted)' : 'var(--color-primary)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 bg-primary" />
                    실측 체류
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 bg-muted" />
                    예상 체류(자동 종료)
                  </span>
                </div>

                <div className="mt-5 flex flex-col">
                  {visitedBooths.map((visit, index) => (
                    <div key={visit.visitOrder} className="flex gap-3">
                      <div className="flex shrink-0 flex-col items-center">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary text-xs font-bold text-white">
                          {visit.visitOrder}
                        </span>
                        {index < visitedBooths.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
                      </div>
                      <div className="mb-3 flex-1 border border-line p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-ink">{visit.name}</span>
                          <span className="shrink-0 bg-surface px-2 py-0.5 text-[11px] font-bold text-primary">
                            {Math.round(visit.dwellSeconds / 60)}분{visit.isEstimated ? ' · 예상' : ''}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          {visit.categoryName ?? '미분류'}
                          {visit.tags.length > 0 ? ` · ${visit.tags.join(', ')}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel title="카테고리별 체류시간 비중" subtitle="접한 부스 카테고리 기준">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="minutes" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={2}>
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value ?? 0)}분`, '체류시간']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-col gap-1.5">
                {categoryBreakdown.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }} />
                    <span className="flex-1 text-ink">{entry.name}</span>
                    <span className="text-muted">
                      {entry.minutes}분 · {totalCategoryMinutes > 0 ? Math.round((entry.minutes / totalCategoryMinutes) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="많이 접한 태그" subtitle="방문한 부스가 가진 태그 기준">
              <ResponsiveContainer width="100%" height={Math.max(180, tagFrequency.length * 32)}>
                <BarChart data={tagFrequency} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                  <YAxis type="category" dataKey="tag" width={88} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                  <Tooltip formatter={(value) => [`${Number(value ?? 0)}곳`, '방문 부스 수']} />
                  <Bar dataKey="count" name="방문 부스 수" fill="var(--color-accent)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        )}
      </div>
    </div>
  )
}
