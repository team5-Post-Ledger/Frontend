import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { QueryState } from '../../components/QueryState'
import {
  usePlatformAccountants,
  usePlatformAdmins,
  usePlatformAds,
  usePlatformExhibition,
  usePlatformExhibitions,
  usePlatformStatsOverview,
} from '../../features/platform/hooks'

type PlatformStubKind = 'exhibitions' | 'exhibitionDetail' | 'admins' | 'accountants' | 'ads' | 'stats'

interface PlatformStubPageProps {
  kind: PlatformStubKind
}

const STUB_META: Record<PlatformStubKind, { title: string; description: string; featureText: string }> = {
  exhibitions: {
    title: '전체 행사 관리',
    description: '플랫폼 관리자가 여러 행사를 생성, 삭제하고 상태를 관리합니다.',
    featureText: '행사 생성/삭제/상태 관리',
  },
  exhibitionDetail: {
    title: '행사 상세 관리',
    description: '행사별 관리자 배정과 통합 상태를 확인합니다.',
    featureText: '관리자 배정, 통합 상태 확인',
  },
  admins: {
    title: 'EXPO_ADMIN 관리',
    description: '행사 관리자 계정을 발급하고 행사에 배정합니다.',
    featureText: '계정 발급, 행사 배정',
  },
  accountants: {
    title: 'ACCOUNTANT 관리',
    description: '회계 계정을 발급하고 비활성화합니다.',
    featureText: '회계 계정 발급/비활성화',
  },
  ads: {
    title: '광고 관리',
    description: '광고 슬롯과 광고 등록, 노출과 클릭 지표를 관리합니다.',
    featureText: '슬롯/광고 등록, 노출/클릭',
  },
  stats: {
    title: '통합 통계',
    description: '전체 행사 매출, 방문, 광고 요약을 확인합니다.',
    featureText: '전체 행사 매출/방문/광고 요약',
  },
}

function StubShell({
  title,
  description,
  featureText,
  children,
}: {
  title: string
  description: string
  featureText: string
  children: ReactNode
}) {
  return (
    <section>
      <div className="flex flex-col gap-2 border-b border-line pb-5">
        <div className="text-xs font-bold uppercase tracking-wider text-primary">PLATFORM_ADMIN</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="border border-line bg-white p-5">
          <div className="text-sm font-bold text-ink">master-plan 핵심 기능</div>
          <p className="mt-2 text-sm text-muted">{featureText}</p>
          <div className="mt-5">{children}</div>
        </div>

        <aside className="border border-line bg-surface p-5">
          <div className="text-sm font-bold text-ink">구현 상태</div>
          <p className="mt-2 text-sm text-muted">다음 PR에서 실제 CRUD, 테이블, 폼을 구현할 예정입니다.</p>
        </aside>
      </div>
    </section>
  )
}

function ExhibitionsStub() {
  const query = usePlatformExhibitions()
  const data = query.data ?? []
  const meta = STUB_META.exhibitions

  return (
    <StubShell {...meta}>
      <QueryState isLoading={query.isLoading} isError={query.isError} isEmpty={data.length === 0}>
        <div className="space-y-2">
          {data.map((exhibition) => (
            <Link
              key={exhibition.id}
              to={`/platform/exhibitions/${exhibition.id}`}
              className="block border border-line p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-ink">{exhibition.title}</div>
                  <div className="mt-1 text-xs text-muted">{exhibition.venue}</div>
                </div>
                <span className="shrink-0 text-xs font-bold text-primary">{exhibition.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </QueryState>
    </StubShell>
  )
}

function ExhibitionDetailStub() {
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const query = usePlatformExhibition(Number.isFinite(id) ? id : null)
  const data = query.data
  const meta = STUB_META.exhibitionDetail

  return (
    <StubShell {...meta}>
      <QueryState isLoading={query.isLoading} isError={query.isError} isEmpty={!data} emptyMessage="행사를 찾을 수 없습니다.">
        {data && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">행사명</dt>
              <dd className="mt-1 font-bold text-ink">{data.title}</dd>
            </div>
            <div>
              <dt className="text-muted">상태</dt>
              <dd className="mt-1 font-bold text-ink">{data.status}</dd>
            </div>
            <div>
              <dt className="text-muted">EXPO_ADMIN</dt>
              <dd className="mt-1 font-bold text-ink">{data.adminCount}명</dd>
            </div>
            <div>
              <dt className="text-muted">ACCOUNTANT</dt>
              <dd className="mt-1 font-bold text-ink">{data.accountantCount}명</dd>
            </div>
          </dl>
        )}
      </QueryState>
    </StubShell>
  )
}

function AdminsStub() {
  const query = usePlatformAdmins()
  const data = query.data ?? []
  const meta = STUB_META.admins

  return (
    <StubShell {...meta}>
      <QueryState isLoading={query.isLoading} isError={query.isError} isEmpty={data.length === 0}>
        <p className="text-sm text-muted">Mock 경계에서 {data.length}개 EXPO_ADMIN 계정을 받았습니다.</p>
      </QueryState>
    </StubShell>
  )
}

function AccountantsStub() {
  const query = usePlatformAccountants()
  const data = query.data ?? []
  const meta = STUB_META.accountants

  return (
    <StubShell {...meta}>
      <QueryState isLoading={query.isLoading} isError={query.isError} isEmpty={data.length === 0}>
        <p className="text-sm text-muted">Mock 경계에서 {data.length}개 ACCOUNTANT 계정을 받았습니다.</p>
      </QueryState>
    </StubShell>
  )
}

function AdsStub() {
  const query = usePlatformAds()
  const data = query.data ?? []
  const meta = STUB_META.ads

  return (
    <StubShell {...meta}>
      <QueryState isLoading={query.isLoading} isError={query.isError} isEmpty={data.length === 0}>
        <p className="text-sm text-muted">Mock 경계에서 {data.length}개 광고를 받았습니다.</p>
      </QueryState>
    </StubShell>
  )
}

function StatsStub() {
  const query = usePlatformStatsOverview()
  const data = query.data
  const meta = STUB_META.stats

  return (
    <StubShell {...meta}>
      <QueryState isLoading={query.isLoading} isError={query.isError} isEmpty={!data}>
        {data && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">전체 행사</dt>
              <dd className="mt-1 font-bold text-ink">{data.exhibitionCount}개</dd>
            </div>
            <div>
              <dt className="text-muted">진행중 행사</dt>
              <dd className="mt-1 font-bold text-ink">{data.openExhibitionCount}개</dd>
            </div>
            <div>
              <dt className="text-muted">방문 인원</dt>
              <dd className="mt-1 font-bold text-ink">{data.visitorCount.toLocaleString()}명</dd>
            </div>
            <div>
              <dt className="text-muted">광고 수익</dt>
              <dd className="mt-1 font-bold text-ink">{data.adRevenue.toLocaleString()}원</dd>
            </div>
          </dl>
        )}
      </QueryState>
    </StubShell>
  )
}

export default function PlatformStubPage({ kind }: PlatformStubPageProps) {
  if (kind === 'exhibitions') return <ExhibitionsStub />
  if (kind === 'exhibitionDetail') return <ExhibitionDetailStub />
  if (kind === 'admins') return <AdminsStub />
  if (kind === 'accountants') return <AccountantsStub />
  if (kind === 'ads') return <AdsStub />
  return <StatsStub />
}
