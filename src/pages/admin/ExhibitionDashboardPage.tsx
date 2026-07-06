import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link, useParams } from 'react-router'
import { CongestionGauge } from '../../components/CongestionGauge'
import { CongestionLivePanel } from '../../components/CongestionLivePanel'
import { HubNavGrid } from '../../components/HubNavGrid'
import { Panel } from '../../components/Panel'
import { QueryState } from '../../components/QueryState'
import { StatCard } from '../../components/StatCard'
import {
  CONGESTION_EMPTY_MESSAGE,
  congestionUnavailableMessage,
  getCongestionAvailability,
} from '../../features/congestion/availability'
import { useCongestionLive } from '../../features/congestion/hooks'
import { useExhibitionCheckinTrend, useExhibitionOperationsSummary } from '../../features/exhibitionDashboard/hooks'
import { useExhibition } from '../../features/exhibition/hooks'
import { getAdminHubGroups } from '../../app/layouts/adminNav'
import { formatCurrency, formatDateRange } from '../../lib/format'
import type { ExhibitionStatus } from '../../types'

const STATUS_LABEL: Record<ExhibitionStatus, string> = {
  DRAFT: '준비중',
  OPEN: '진행중',
  CLOSED: '종료',
}

const STATUS_BADGE_CLASS: Record<ExhibitionStatus, string> = {
  DRAFT: 'bg-warning text-white',
  OPEN: 'bg-live text-ink',
  CLOSED: 'bg-line text-muted',
}

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CheckinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function RevenueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

export default function ExhibitionDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const exhibitionId = id ? Number(id) : null

  const exhibition = useExhibition(exhibitionId)
  const summary = useExhibitionOperationsSummary(exhibitionId)
  const trend = useExhibitionCheckinTrend(exhibitionId)
  // 진행중 행사에만 실시간 혼잡도가 존재한다 — 준비중/기간 외/종료면 폴링을 켜지 않는다.
  const congestionEnabled = exhibition.data ? getCongestionAvailability(exhibition.data) === 'LIVE' : false
  const congestion = useCongestionLive(exhibitionId, { enabled: congestionEnabled })

  if (exhibitionId === null) {
    return <p className="text-sm text-danger">잘못된 행사 경로입니다.</p>
  }

  if (exhibition.isLoading) {
    return <p className="text-sm text-muted">불러오는 중...</p>
  }

  if (exhibition.isError) {
    return <p className="text-sm text-danger">행사 정보를 불러오지 못했습니다.</p>
  }

  if (!exhibition.data) {
    return <p className="text-sm text-muted">해당 행사를 찾을 수 없습니다.</p>
  }

  const data = exhibition.data
  const congestionAvailability = getCongestionAvailability(data)
  const conversionRate =
    summary.data && summary.data.paidHeadcount > 0
      ? Math.round((summary.data.checkedInHeadcount / summary.data.paidHeadcount) * 100)
      : null
  const onlinePct = summary.data && summary.data.grossRevenue > 0 ? Math.round((summary.data.onlineRevenue / summary.data.grossRevenue) * 100) : 0
  const onsitePct = summary.data && summary.data.grossRevenue > 0 ? 100 - onlinePct : 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-ink">{data.title}</h1>
            <span className={`px-2.5 py-1 text-xs font-bold ${STATUS_BADGE_CLASS[data.status]}`}>{STATUS_LABEL[data.status]}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {data.venue} · {formatDateRange(data.startDate, data.endDate)}
          </p>
          <p className="mt-1 text-xs text-muted">
            행사 운영 요약입니다. 부스별 방문·동선 분석 등 상세 통계는{' '}
            <Link to="/admin/stats" className="font-semibold text-primary hover:text-primary-hover">
              전체 통계
            </Link>
            에서 확인하세요.
          </p>
        </div>
        <Link
          to={`/admin/exhibitions/${exhibitionId}/edit`}
          className="flex h-10 items-center gap-2 border border-line px-4 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
        >
          행사 정보 수정
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="예약 인원" icon={<span className="text-primary"><PeopleIcon /></span>} isLoading={summary.isLoading} isError={summary.isError}>
          {summary.data && (
            <>
              <div className="flex items-baseline gap-1 text-[28px] font-extrabold leading-none tracking-tight text-ink">
                {summary.data.reservedHeadcount.toLocaleString()}
                <span className="text-sm font-semibold text-muted">명</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-muted">결제완료 {summary.data.paidHeadcount.toLocaleString()}명 포함</div>
            </>
          )}
        </StatCard>

        <StatCard label="체크인(입장)" icon={<span className="text-primary"><CheckinIcon /></span>} isLoading={summary.isLoading} isError={summary.isError}>
          {summary.data && (
            <>
              <div className="flex items-baseline gap-1 text-[28px] font-extrabold leading-none tracking-tight text-ink">
                {summary.data.checkedInHeadcount.toLocaleString()}
                <span className="text-sm font-semibold text-muted">명</span>
              </div>
              {conversionRate !== null && (
                <>
                  <div className="mt-2 text-xs font-semibold text-muted">결제 인원 대비 {conversionRate}%</div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${conversionRate}%` }} />
                  </div>
                </>
              )}
            </>
          )}
        </StatCard>

        <StatCard label="현재 혼잡도" isLoading={congestion.isLoading} isError={congestion.isError}>
          {congestionAvailability === 'LIVE' ? (
            congestion.data &&
            (congestion.data.level !== null ? (
              <CongestionGauge level={congestion.data.level} />
            ) : (
              <p className="text-xs leading-relaxed text-muted">{CONGESTION_EMPTY_MESSAGE}</p>
            ))
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              {congestionUnavailableMessage(congestionAvailability, data.startDate)}
            </p>
          )}
        </StatCard>

        <StatCard label="매출 요약" icon={<span className="text-primary"><RevenueIcon /></span>} isLoading={summary.isLoading} isError={summary.isError}>
          {summary.data && (
            <>
              <div className="text-[28px] font-extrabold leading-none tracking-tight text-ink">{formatCurrency(summary.data.grossRevenue)}</div>
              <div className="mt-2 text-xs font-semibold text-muted">
                온라인 {formatCurrency(summary.data.onlineRevenue)} · 현장 {formatCurrency(summary.data.onsiteRevenue)}
              </div>
            </>
          )}
        </StatCard>
      </div>

      <Panel title="바로가기" subtitle="운영 화면으로 바로 이동합니다.">
        <HubNavGrid groups={getAdminHubGroups(exhibitionId)} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="시간대별 입장" subtitle="체크인(GATE ENTRY) 기준 · 1시간 단위">
          <QueryState isLoading={trend.isLoading} isError={trend.isError} isEmpty={trend.data?.length === 0}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trend.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted)' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="checkedInCount" name="입장 인원" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </QueryState>
        </Panel>

        <Panel title="매출 요약" subtitle="결제완료(PAID) 기준">
          <QueryState isLoading={summary.isLoading} isError={summary.isError} isEmpty={summary.data?.grossRevenue === 0}>
            {summary.data && (
              <div className="flex flex-col gap-4">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full bg-primary" style={{ width: `${onlinePct}%` }} />
                  <div className="h-full bg-accent" style={{ width: `${onsitePct}%` }} />
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                  <dt className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    온라인 매출
                  </dt>
                  <dd className="text-right font-semibold text-ink">{formatCurrency(summary.data.onlineRevenue)}</dd>
                  <dt className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                    현장 매출
                  </dt>
                  <dd className="text-right font-semibold text-ink">{formatCurrency(summary.data.onsiteRevenue)}</dd>
                  <dt className="border-t border-dashed border-line pt-2.5 text-muted">총매출</dt>
                  <dd className="border-t border-dashed border-line pt-2.5 text-right font-bold text-ink">
                    {formatCurrency(summary.data.grossRevenue)}
                  </dd>
                  <dt className="text-muted">수수료</dt>
                  <dd className="text-right text-ink">{formatCurrency(summary.data.feeAmount)}</dd>
                </dl>
              </div>
            )}
          </QueryState>
        </Panel>
      </div>

      <CongestionLivePanel
        isLoading={congestion.isLoading}
        isError={congestion.isError}
        data={congestion.data}
        unavailableMessage={
          congestionAvailability !== 'LIVE'
            ? congestionUnavailableMessage(congestionAvailability, data.startDate)
            : undefined
        }
      />
    </div>
  )
}
