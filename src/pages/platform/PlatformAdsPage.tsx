import { useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import type { PlatformAdSummary } from '../../features/platform/api'
import {
  usePlatformAds,
  usePlatformAdSlots,
  usePlatformExhibitions,
  useUpdatePlatformAdSlot,
  useUpdatePlatformAdStatus,
} from '../../features/platform/hooks'
import { formatCurrency, formatDateTime } from '../../lib/format'
import type { AdSlot, AdSlotStatus, AdvertisementStatus } from '../../types'

type PendingAction =
  | { type: 'slot-status'; slotId: number; targetStatus: AdSlotStatus }
  | { type: 'ad-status'; adId: number; targetStatus: AdvertisementStatus; label: string }

const AD_SLOT_STATUS_BADGE: Record<AdSlotStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'ACTIVE', className: 'bg-success/10 text-success' },
  INACTIVE: { label: 'INACTIVE', className: 'bg-muted/10 text-muted' },
}

const AD_STATUS_BADGE: Record<AdvertisementStatus, { label: string; className: string }> = {
  DRAFT: { label: 'DRAFT', className: 'bg-warning/10 text-warning' },
  ACTIVE: { label: 'ACTIVE', className: 'bg-success/10 text-success' },
  PAUSED: { label: 'PAUSED', className: 'bg-muted/10 text-muted' },
  EXPIRED: { label: 'EXPIRED', className: 'bg-line text-muted' },
}

function StatusBadge<TStatus extends AdSlotStatus | AdvertisementStatus>({
  status,
  badges,
}: {
  status: TStatus
  badges: Record<TStatus, { label: string; className: string }>
}) {
  const badge = badges[status]

  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-bold ${badge.className}`}>
      {badge.label}
    </span>
  )
}

function DisabledActionButton({ children }: { children: string }) {
  return (
    <button
      type="button"
      disabled
      title="다음 PR에서 구현 예정"
      className="px-2.5 py-1.5 text-xs font-bold text-muted ring-1 ring-line disabled:cursor-not-allowed disabled:opacity-55"
    >
      {children}
    </button>
  )
}

function formatAdPeriod(startAt: string, endAt: string) {
  return `${formatDateTime(startAt)} - ${formatDateTime(endAt)}`
}

function getSlotScope(slot: AdSlot, exhibitionTitles: Map<number, string>) {
  if (slot.exhibitionId === null) {
    return '플랫폼 공통'
  }

  return exhibitionTitles.get(slot.exhibitionId) ?? `행사 #${slot.exhibitionId}`
}

function getNextAdSlotStatus(status: AdSlotStatus): AdSlotStatus {
  return status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
}

function getAdStatusAction(status: AdvertisementStatus): { label: string; targetStatus: AdvertisementStatus | null } {
  if (status === 'DRAFT') return { label: '집행 시작', targetStatus: 'ACTIVE' }
  if (status === 'ACTIVE') return { label: '일시중지', targetStatus: 'PAUSED' }
  if (status === 'PAUSED') return { label: '재개', targetStatus: 'ACTIVE' }
  return { label: '만료됨', targetStatus: null }
}

export default function PlatformAdsPage() {
  const adsQuery = usePlatformAds()
  const adSlotsQuery = usePlatformAdSlots()
  const exhibitionsQuery = usePlatformExhibitions()
  const updateAdSlot = useUpdatePlatformAdSlot()
  const updateAdStatus = useUpdatePlatformAdStatus()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const ads = adsQuery.data ?? []
  const adSlots = adSlotsQuery.data ?? []
  const exhibitionTitles = new Map(
    (exhibitionsQuery.data ?? []).map((exhibition) => [exhibition.id, exhibition.title]),
  )
  const slotById = new Map(adSlots.map((slot) => [slot.id, slot]))

  const activeAdCount = ads.filter((ad) => ad.status === 'ACTIVE').length
  const activeSlotCount = adSlots.filter((slot) => slot.status === 'ACTIVE').length
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0)
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0)
  const hasError = adsQuery.isError || adSlotsQuery.isError
  const isMutating = updateAdSlot.isPending || updateAdStatus.isPending

  function handleAdSlotStatusChange(slot: AdSlot) {
    const nextStatus = getNextAdSlotStatus(slot.status)
    setPendingAction({ type: 'slot-status', slotId: slot.id, targetStatus: nextStatus })
  }

  function handleAdStatusChange(ad: PlatformAdSummary, targetStatus: AdvertisementStatus | null, label: string) {
    if (targetStatus === null) {
      return
    }

    setPendingAction({ type: 'ad-status', adId: ad.id, targetStatus, label })
  }

  function handleConfirmAction() {
    if (!pendingAction) {
      return
    }

    if (pendingAction.type === 'slot-status') {
      updateAdSlot.mutate(
        {
          slotId: pendingAction.slotId,
          input: { status: pendingAction.targetStatus },
        },
        { onSuccess: () => setPendingAction(null) },
      )
      return
    }

    updateAdStatus.mutate(
      { adId: pendingAction.adId, status: pendingAction.targetStatus },
      { onSuccess: () => setPendingAction(null) },
    )
  }

  const confirmDialog =
    pendingAction?.type === 'slot-status'
      ? {
          title:
            pendingAction.targetStatus === 'INACTIVE'
              ? '광고 슬롯을 비활성화하시겠습니까?'
              : '광고 슬롯을 활성화하시겠습니까?',
          description:
            pendingAction.targetStatus === 'INACTIVE'
              ? '이 광고 슬롯을 비활성화하시겠습니까?'
              : '이 광고 슬롯을 활성화하시겠습니까?',
          confirmLabel: pendingAction.targetStatus === 'INACTIVE' ? '비활성화' : '활성화',
          variant: pendingAction.targetStatus === 'INACTIVE' ? ('destructive' as const) : ('default' as const),
        }
      : {
          title: '광고 상태를 변경하시겠습니까?',
          description: pendingAction ? `이 광고를 ${pendingAction.label} 상태로 변경하시겠습니까?` : '',
          confirmLabel: pendingAction?.label ?? '확인',
          variant: pendingAction?.targetStatus === 'PAUSED' ? ('destructive' as const) : ('default' as const),
        }

  const adSlotColumns: DataTableColumn<AdSlot>[] = [
    {
      key: 'placement',
      header: 'placement',
      sortable: true,
      render: (slot) => <span className="font-mono text-xs text-muted">{slot.placement}</span>,
    },
    {
      key: 'scope',
      header: '적용 범위',
      sortable: true,
      sortValue: (slot) => getSlotScope(slot, exhibitionTitles),
      render: (slot) => <span className="min-w-[180px] text-sm text-ink">{getSlotScope(slot, exhibitionTitles)}</span>,
    },
    {
      key: 'basePrice',
      header: '기본 가격',
      sortable: true,
      align: 'right',
      render: (slot) => <span className="font-semibold text-ink">{formatCurrency(slot.basePrice)}</span>,
    },
    {
      key: 'status',
      header: '상태',
      sortable: true,
      align: 'center',
      render: (slot) => <StatusBadge status={slot.status} badges={AD_SLOT_STATUS_BADGE} />,
    },
    {
      key: 'actions',
      header: '관리',
      align: 'right',
      render: (slot) => (
        <div className="flex min-w-[150px] flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={isMutating}
            onClick={() => handleAdSlotStatusChange(slot)}
            className="px-2.5 py-1.5 text-xs font-bold text-primary ring-1 ring-line transition-colors hover:text-primary-hover hover:ring-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            {slot.status === 'ACTIVE' ? '비활성화' : '활성화'}
          </button>
          <DisabledActionButton>수정</DisabledActionButton>
        </div>
      ),
    },
  ]

  const adColumns: DataTableColumn<PlatformAdSummary>[] = [
    {
      key: 'title',
      header: '광고 제목',
      sortable: true,
      render: (ad) => (
        <div className="min-w-[200px]">
          <div className="font-bold text-ink">{ad.title}</div>
          <div className="mt-1 text-xs text-muted">ID {ad.id}</div>
        </div>
      ),
    },
    {
      key: 'advertiserName',
      header: '광고주',
      sortable: true,
      render: (ad) => ad.advertiserName,
    },
    {
      key: 'slot',
      header: '연결 슬롯',
      sortable: true,
      sortValue: (ad) => slotById.get(ad.adSlotId)?.placement ?? ad.placement,
      render: (ad) => (
        <span className="font-mono text-xs text-muted">
          {slotById.get(ad.adSlotId)?.placement ?? ad.placement}
        </span>
      ),
    },
    {
      key: 'period',
      header: '집행 기간',
      sortable: true,
      sortValue: (ad) => ad.startAt,
      render: (ad) => <span className="min-w-[240px] text-sm text-ink">{formatAdPeriod(ad.startAt, ad.endAt)}</span>,
    },
    {
      key: 'price',
      header: '판매가',
      sortable: true,
      align: 'right',
      render: (ad) => <span className="font-semibold text-ink">{formatCurrency(ad.price)}</span>,
    },
    {
      key: 'status',
      header: '상태',
      sortable: true,
      align: 'center',
      render: (ad) => <StatusBadge status={ad.status} badges={AD_STATUS_BADGE} />,
    },
    {
      key: 'impressions',
      header: '노출',
      sortable: true,
      align: 'right',
      render: (ad) => ad.impressions.toLocaleString(),
    },
    {
      key: 'clicks',
      header: '클릭',
      sortable: true,
      align: 'right',
      render: (ad) => ad.clicks.toLocaleString(),
    },
    {
      key: 'actions',
      header: '관리',
      align: 'right',
      render: (ad) => {
        const action = getAdStatusAction(ad.status)

        return (
          <div className="flex min-w-[150px] flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={isMutating || action.targetStatus === null}
              onClick={() => handleAdStatusChange(ad, action.targetStatus, action.label)}
              className="px-2.5 py-1.5 text-xs font-bold text-primary ring-1 ring-line transition-colors hover:text-primary-hover hover:ring-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-muted disabled:opacity-55"
            >
              {action.label}
            </button>
            <DisabledActionButton>상세</DisabledActionButton>
          </div>
        )
      },
    },
  ]

  return (
    <section className="space-y-6">
      <ConfirmDialog
        open={pendingAction !== null}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel="취소"
        variant={confirmDialog.variant}
        isPending={isMutating}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />

      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">PLATFORM_ADMIN</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">광고 관리</h1>
          <p className="mt-2 text-sm text-muted">
            플랫폼 공통 광고와 박람회별 광고 슬롯을 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-2 lg:justify-end">
          <button
            type="button"
            disabled
            className="bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            광고 등록
          </button>
          <button
            type="button"
            disabled
            className="px-4 py-2 text-sm font-bold text-muted ring-1 ring-line disabled:cursor-not-allowed disabled:opacity-55"
          >
            슬롯 생성
          </button>
          <p className="basis-full text-xs text-muted lg:text-right">다음 PR에서 구현 예정</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <section className="border border-line bg-surface p-4">
          <p className="text-sm text-muted">활성 광고 수</p>
          <strong className="mt-2 block text-2xl font-semibold text-foreground">{activeAdCount}</strong>
        </section>
        <section className="border border-line bg-surface p-4">
          <p className="text-sm text-muted">활성 슬롯 수</p>
          <strong className="mt-2 block text-2xl font-semibold text-foreground">{activeSlotCount}</strong>
        </section>
        <section className="border border-line bg-surface p-4">
          <p className="text-sm text-muted">총 노출수</p>
          <strong className="mt-2 block text-2xl font-semibold text-foreground">
            {totalImpressions.toLocaleString()}
          </strong>
        </section>
        <section className="border border-line bg-surface p-4">
          <p className="text-sm text-muted">총 클릭수</p>
          <strong className="mt-2 block text-2xl font-semibold text-foreground">
            {totalClicks.toLocaleString()}
          </strong>
        </section>
      </div>

      {hasError ? (
        <div className="flex min-h-60 items-center justify-center border border-line bg-white text-sm text-danger">
          광고 정보를 불러오지 못했습니다.
        </div>
      ) : (
        <>
          <DataTable
            columns={adSlotColumns}
            data={adSlots}
            rowKey={(slot) => slot.id}
            isLoading={adSlotsQuery.isLoading}
            emptyMessage="등록된 광고 슬롯이 없습니다."
            pageSize={8}
            toolbar={
              <div>
                <div className="text-sm font-bold text-ink">광고 슬롯</div>
                <div className="mt-0.5 text-xs text-muted">
                  플랫폼 공통 또는 박람회 한정 광고 지면입니다.
                </div>
              </div>
            }
          />

          <DataTable
            columns={adColumns}
            data={ads}
            rowKey={(ad) => ad.id}
            isLoading={adsQuery.isLoading}
            emptyMessage="등록된 광고가 없습니다."
            pageSize={8}
            toolbar={
              <div>
                <div className="text-sm font-bold text-ink">광고 목록</div>
                <div className="mt-0.5 text-xs text-muted">
                  집행 중이거나 예정된 광고 캠페인입니다.
                </div>
              </div>
            }
          />
        </>
      )}
    </section>
  )
}
