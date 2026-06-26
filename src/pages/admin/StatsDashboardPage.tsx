import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CongestionGauge } from '../../components/CongestionGauge'
import { CongestionLivePanel } from '../../components/CongestionLivePanel'
import { Panel } from '../../components/Panel'
import { QueryState } from '../../components/QueryState'
import { StatCard } from '../../components/StatCard'
import { useCongestionLive } from '../../features/congestion/hooks'
import { useStatsSummary, useTopBooths, useVisitTrend } from '../../features/stats/hooks'
import { useCurrentExhibitionStore } from '../../stores/currentExhibitionStore'

function formatDwell(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  return `${minutes}분 ${remain}초`
}

function VisitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function DwellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export default function StatsDashboardPage() {
  const exhibitionId = useCurrentExhibitionStore((state) => state.exhibitionId)
  const summary = useStatsSummary(exhibitionId)
  const visitTrend = useVisitTrend(exhibitionId)
  const topBooths = useTopBooths(exhibitionId)
  const congestion = useCongestionLive(exhibitionId)

  const conversionRate = summary.data && summary.data.paidHeadcount > 0
    ? Math.round((summary.data.checkedInHeadcount / summary.data.paidHeadcount) * 100)
    : null

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">통계 대시보드</h1>
        <p className="mt-1 text-sm text-muted">방문수·체류시간·전환율·혼잡도를 한눈에 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="총 방문수"
          icon={<span className="text-primary"><VisitIcon /></span>}
          isLoading={summary.isLoading}
          isError={summary.isError}
        >
          {summary.data && (
            <>
              <div className="flex items-baseline gap-1 text-[28px] font-extrabold leading-none tracking-tight text-ink">
                {summary.data.visitCount.toLocaleString()}
                <span className="text-sm font-semibold text-muted">명</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-success">
                ▲ {summary.data.visitCountDeltaPct}% · 전일 대비
              </div>
            </>
          )}
        </StatCard>

        <StatCard
          label="평균 체류시간"
          icon={<span className="text-primary"><DwellIcon /></span>}
          isLoading={summary.isLoading}
          isError={summary.isError}
        >
          {summary.data && (
            <div className="flex items-baseline gap-1 text-[28px] font-extrabold leading-none tracking-tight text-ink">
              {formatDwell(summary.data.avgDwellSeconds)}
            </div>
          )}
        </StatCard>

        <StatCard
          label="예약 → 방문 전환율"
          icon={
            summary.data && (
              <span className="text-xs text-muted">
                {summary.data.checkedInHeadcount.toLocaleString()} / {summary.data.paidHeadcount.toLocaleString()}
              </span>
            )
          }
          isLoading={summary.isLoading}
          isError={summary.isError}
        >
          {summary.data && conversionRate !== null && (
            <>
              <div className="flex items-baseline gap-1 text-[28px] font-extrabold leading-none tracking-tight text-ink">
                {conversionRate}
                <span className="text-base font-bold">%</span>
              </div>
              <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-accent" style={{ width: `${conversionRate}%` }} />
              </div>
            </>
          )}
        </StatCard>

        <StatCard label="현재 혼잡도" isLoading={congestion.isLoading} isError={congestion.isError}>
          {congestion.data && <CongestionGauge level={congestion.data.level} />}
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="시간대별 방문 추이" subtitle="09:00 – 18:00 · 1시간 단위">
          <QueryState
            isLoading={visitTrend.isLoading}
            isError={visitTrend.isError}
            isEmpty={visitTrend.data?.length === 0}
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={visitTrend.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted)' }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="visitCount" name="방문수" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </QueryState>
        </Panel>

        <Panel title="부스별 방문 Top 5" subtitle="누적 방문 기준">
          <QueryState
            isLoading={topBooths.isLoading}
            isError={topBooths.isError}
            isEmpty={topBooths.data?.length === 0}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topBooths.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted)' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="visitCount" name="방문수" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </QueryState>
        </Panel>
      </div>

      <CongestionLivePanel isLoading={congestion.isLoading} isError={congestion.isError} data={congestion.data} />
    </div>
  )
}
