import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { Field, fieldControlClass, fieldControlErrorClass } from '../../components/Field'
import type { PlatformAdSummary } from '../../features/platform/api'
import {
  useCreatePlatformAd,
  useCreatePlatformAdSlot,
  usePlatformAds,
  usePlatformAdSlots,
  usePlatformExhibitions,
  useUpdatePlatformAd,
  useUpdatePlatformAdSlot,
  useUpdatePlatformAdStatus,
} from '../../features/platform/hooks'
import { formatCurrency, formatDateTime } from '../../lib/format'
import type { AdSlot, AdSlotStatus, AdvertisementStatus } from '../../types'

type PendingAction =
  | { type: 'slot-status'; slotId: number; targetStatus: AdSlotStatus }
  | { type: 'ad-status'; adId: number; targetStatus: AdvertisementStatus; label: string }

type CreateAdStatus = Extract<AdvertisementStatus, 'DRAFT' | 'ACTIVE' | 'PAUSED'>

interface AdSlotFormValues {
  exhibitionId: string
  placement: string
  basePrice: string
  status: AdSlotStatus
}

type AdSlotFormErrors = Partial<Record<keyof AdSlotFormValues, string>>

interface AdFormValues {
  adSlotId: string
  advertiserName: string
  title: string
  imageUrl: string
  linkUrl: string
  startAt: string
  endAt: string
  price: string
  status: CreateAdStatus
}

type AdFormErrors = Partial<Record<keyof AdFormValues, string>>

interface EditAdFormValues {
  adSlotId: string
  advertiserName: string
  title: string
  imageUrl: string
  linkUrl: string
  startAt: string
  endAt: string
  price: string
  status: AdvertisementStatus
}

type EditAdFormErrors = Partial<Record<keyof EditAdFormValues, string>>

const PLATFORM_SCOPE_VALUE = 'platform'

const INITIAL_AD_SLOT_FORM_VALUES: AdSlotFormValues = {
  exhibitionId: PLATFORM_SCOPE_VALUE,
  placement: '',
  basePrice: '',
  status: 'ACTIVE',
}

const INITIAL_AD_FORM_VALUES: AdFormValues = {
  adSlotId: '',
  advertiserName: '',
  title: '',
  imageUrl: '',
  linkUrl: '',
  startAt: '',
  endAt: '',
  price: '',
  status: 'DRAFT',
}

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

function isLikelyHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function PlatformAdsPage() {
  const adsQuery = usePlatformAds()
  const adSlotsQuery = usePlatformAdSlots()
  const exhibitionsQuery = usePlatformExhibitions()
  const createAd = useCreatePlatformAd()
  const createAdSlot = useCreatePlatformAdSlot()
  const updateAd = useUpdatePlatformAd()
  const updateAdSlot = useUpdatePlatformAdSlot()
  const updateAdStatus = useUpdatePlatformAdStatus()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isAdFormOpen, setIsAdFormOpen] = useState(false)
  const [adFormValues, setAdFormValues] = useState<AdFormValues>(INITIAL_AD_FORM_VALUES)
  const [adFormErrors, setAdFormErrors] = useState<AdFormErrors>({})
  const [isEditAdFormOpen, setIsEditAdFormOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<PlatformAdSummary | null>(null)
  const [editAdFormValues, setEditAdFormValues] = useState<EditAdFormValues | null>(null)
  const [editAdFormErrors, setEditAdFormErrors] = useState<EditAdFormErrors>({})
  const [isSlotFormOpen, setIsSlotFormOpen] = useState(false)
  const [slotFormValues, setSlotFormValues] = useState<AdSlotFormValues>(INITIAL_AD_SLOT_FORM_VALUES)
  const [slotFormErrors, setSlotFormErrors] = useState<AdSlotFormErrors>({})

  const ads = adsQuery.data ?? []
  const adSlots = adSlotsQuery.data ?? []
  const exhibitions = exhibitionsQuery.data ?? []
  const exhibitionTitles = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition.title]))
  const slotById = new Map(adSlots.map((slot) => [slot.id, slot]))
  const activeAdSlots = adSlots.filter((slot) => slot.status === 'ACTIVE')
  const editableAdSlots = editingAd
    ? adSlots.filter((slot) => slot.status === 'ACTIVE' || slot.id === editingAd.adSlotId)
    : activeAdSlots
  const placementSuggestions = Array.from(new Set(adSlots.map((slot) => slot.placement))).sort()

  const activeAdCount = ads.filter((ad) => ad.status === 'ACTIVE').length
  const activeSlotCount = adSlots.filter((slot) => slot.status === 'ACTIVE').length
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0)
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0)
  const hasError = adsQuery.isError || adSlotsQuery.isError
  const isMutating = updateAd.isPending || updateAdSlot.isPending || updateAdStatus.isPending
  const editAdFormRef = useRef<HTMLFormElement | null>(null)

  useEffect(() => {
    if (!isEditAdFormOpen || !editingAd || !editAdFormValues) {
      return
    }

    window.requestAnimationFrame(() => {
      editAdFormRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  }, [editAdFormValues, editingAd, isEditAdFormOpen])

  function resetAdForm() {
    setAdFormValues(INITIAL_AD_FORM_VALUES)
    setAdFormErrors({})
    createAd.reset()
  }

  function handleOpenAdForm() {
    createAd.reset()
    setAdFormErrors({})
    setIsAdFormOpen(true)
  }

  function handleCancelAdForm() {
    if (createAd.isPending) {
      return
    }

    resetAdForm()
    setIsAdFormOpen(false)
  }

  function validateAdForm() {
    const nextErrors: AdFormErrors = {}
    const advertiserName = adFormValues.advertiserName.trim()
    const title = adFormValues.title.trim()
    const imageUrl = adFormValues.imageUrl.trim()
    const linkUrl = adFormValues.linkUrl.trim()
    const price = Number(adFormValues.price)

    if (!adFormValues.adSlotId) {
      nextErrors.adSlotId = '광고 슬롯을 선택해 주세요.'
    }

    if (!advertiserName) {
      nextErrors.advertiserName = '광고주명을 입력해 주세요.'
    }

    if (!title) {
      nextErrors.title = '광고 제목을 입력해 주세요.'
    }

    if (!imageUrl) {
      nextErrors.imageUrl = '이미지 URL을 입력해 주세요.'
    } else if (!isLikelyHttpUrl(imageUrl)) {
      nextErrors.imageUrl = '올바른 이미지 URL을 입력해 주세요.'
    }

    if (linkUrl && !isLikelyHttpUrl(linkUrl)) {
      nextErrors.linkUrl = '올바른 링크 URL을 입력해 주세요.'
    }

    if (!adFormValues.startAt) {
      nextErrors.startAt = '집행 시작일을 선택해 주세요.'
    }

    if (!adFormValues.endAt) {
      nextErrors.endAt = '집행 종료일을 선택해 주세요.'
    } else if (adFormValues.startAt && adFormValues.endAt < adFormValues.startAt) {
      nextErrors.endAt = '집행 종료일은 시작일 이후여야 합니다.'
    }

    if (!adFormValues.price.trim()) {
      nextErrors.price = '판매가를 입력해 주세요.'
    } else if (Number.isNaN(price) || price < 0) {
      nextErrors.price = '판매가는 0 이상의 숫자여야 합니다.'
    }

    if (!['DRAFT', 'ACTIVE', 'PAUSED'].includes(adFormValues.status)) {
      nextErrors.status = '상태는 DRAFT, ACTIVE, PAUSED만 선택할 수 있습니다.'
    }

    setAdFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmitAdForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateAdForm()) {
      return
    }

    createAd.mutate(
      {
        adSlotId: Number(adFormValues.adSlotId),
        advertiserName: adFormValues.advertiserName.trim(),
        title: adFormValues.title.trim(),
        imageUrl: adFormValues.imageUrl.trim(),
        linkUrl: adFormValues.linkUrl.trim(),
        startAt: adFormValues.startAt,
        endAt: adFormValues.endAt,
        price: Number(adFormValues.price),
        status: adFormValues.status,
      },
      {
        onSuccess: () => {
          resetAdForm()
          setIsAdFormOpen(false)
        },
      },
    )
  }

  function resetEditAdForm() {
    setIsEditAdFormOpen(false)
    setEditingAd(null)
    setEditAdFormValues(null)
    setEditAdFormErrors({})
    updateAd.reset()
  }

  function handleOpenEditAdForm(ad: PlatformAdSummary) {
    updateAd.reset()
    setEditingAd(ad)
    setEditAdFormValues({
      adSlotId: String(ad.adSlotId),
      advertiserName: ad.advertiserName,
      title: ad.title,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl ?? '',
      startAt: ad.startAt,
      endAt: ad.endAt,
      price: String(ad.price),
      status: ad.status,
    })
    setEditAdFormErrors({})
    setIsEditAdFormOpen(true)
  }

  function handleCancelEditAdForm() {
    if (updateAd.isPending) {
      return
    }

    resetEditAdForm()
  }

  function validateEditAdForm() {
    const nextErrors: EditAdFormErrors = {}

    if (!editAdFormValues) {
      return false
    }

    const advertiserName = editAdFormValues.advertiserName.trim()
    const title = editAdFormValues.title.trim()
    const imageUrl = editAdFormValues.imageUrl.trim()
    const linkUrl = editAdFormValues.linkUrl.trim()
    const price = Number(editAdFormValues.price)

    if (!editAdFormValues.adSlotId) {
      nextErrors.adSlotId = '광고 슬롯을 선택해 주세요.'
    }

    if (!advertiserName) {
      nextErrors.advertiserName = '광고주명을 입력해 주세요.'
    }

    if (!title) {
      nextErrors.title = '광고 제목을 입력해 주세요.'
    }

    if (!imageUrl) {
      nextErrors.imageUrl = '이미지 URL을 입력해 주세요.'
    } else if (!isLikelyHttpUrl(imageUrl)) {
      nextErrors.imageUrl = '올바른 이미지 URL을 입력해 주세요.'
    }

    if (linkUrl && !isLikelyHttpUrl(linkUrl)) {
      nextErrors.linkUrl = '올바른 링크 URL을 입력해 주세요.'
    }

    if (!editAdFormValues.startAt) {
      nextErrors.startAt = '집행 시작일을 선택해 주세요.'
    }

    if (!editAdFormValues.endAt) {
      nextErrors.endAt = '집행 종료일을 선택해 주세요.'
    } else if (editAdFormValues.startAt && editAdFormValues.endAt < editAdFormValues.startAt) {
      nextErrors.endAt = '집행 종료일은 시작일 이후여야 합니다.'
    }

    if (!editAdFormValues.price.trim()) {
      nextErrors.price = '판매가를 입력해 주세요.'
    } else if (Number.isNaN(price) || price < 0) {
      nextErrors.price = '판매가는 0 이상의 숫자여야 합니다.'
    }

    if (!['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED'].includes(editAdFormValues.status)) {
      nextErrors.status = '상태는 DRAFT, ACTIVE, PAUSED, EXPIRED만 선택할 수 있습니다.'
    }

    setEditAdFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmitEditAdForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingAd || !editAdFormValues || !validateEditAdForm()) {
      return
    }

    updateAd.mutate(
      {
        adId: editingAd.id,
        input: {
          adSlotId: Number(editAdFormValues.adSlotId),
          advertiserName: editAdFormValues.advertiserName.trim(),
          title: editAdFormValues.title.trim(),
          imageUrl: editAdFormValues.imageUrl.trim(),
          linkUrl: editAdFormValues.linkUrl.trim() || undefined,
          startAt: editAdFormValues.startAt,
          endAt: editAdFormValues.endAt,
          price: Number(editAdFormValues.price),
          status: editAdFormValues.status,
        },
      },
      {
        onSuccess: () => {
          resetEditAdForm()
        },
      },
    )
  }

  function resetSlotForm() {
    setSlotFormValues(INITIAL_AD_SLOT_FORM_VALUES)
    setSlotFormErrors({})
    createAdSlot.reset()
  }

  function handleOpenSlotForm() {
    createAdSlot.reset()
    setSlotFormErrors({})
    setIsSlotFormOpen(true)
  }

  function handleCancelSlotForm() {
    if (createAdSlot.isPending) {
      return
    }

    resetSlotForm()
    setIsSlotFormOpen(false)
  }

  function validateSlotForm() {
    const nextErrors: AdSlotFormErrors = {}
    const placement = slotFormValues.placement.trim()
    const basePrice = Number(slotFormValues.basePrice)

    if (!placement) {
      nextErrors.placement = '광고 지면을 입력해 주세요.'
    }

    if (!slotFormValues.basePrice.trim()) {
      nextErrors.basePrice = '기본 가격을 입력해 주세요.'
    } else if (Number.isNaN(basePrice) || basePrice < 0) {
      nextErrors.basePrice = '기본 가격은 0 이상의 숫자여야 합니다.'
    }

    if (slotFormValues.status !== 'ACTIVE' && slotFormValues.status !== 'INACTIVE') {
      nextErrors.status = '상태는 ACTIVE 또는 INACTIVE만 선택할 수 있습니다.'
    }

    setSlotFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmitSlotForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateSlotForm()) {
      return
    }

    createAdSlot.mutate(
      {
        exhibitionId:
          slotFormValues.exhibitionId === PLATFORM_SCOPE_VALUE ? null : Number(slotFormValues.exhibitionId),
        placement: slotFormValues.placement.trim(),
        basePrice: Number(slotFormValues.basePrice),
        status: slotFormValues.status,
      },
      {
        onSuccess: () => {
          resetSlotForm()
          setIsSlotFormOpen(false)
        },
      },
    )
  }

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
            <button
              type="button"
              disabled={updateAd.isPending}
              onClick={() => handleOpenEditAdForm(ad)}
              className="px-2.5 py-1.5 text-xs font-bold text-primary ring-1 ring-line transition-colors hover:text-primary-hover hover:ring-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              상세
            </button>
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
            onClick={handleOpenAdForm}
            disabled={createAd.isPending}
            className="bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            광고 등록
          </button>
          <button
            type="button"
            onClick={handleOpenSlotForm}
            disabled={createAdSlot.isPending}
            className="px-4 py-2 text-sm font-bold text-primary ring-1 ring-line transition-colors hover:text-primary-hover hover:ring-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            슬롯 생성
          </button>
        </div>
      </div>

      {isAdFormOpen && (
        <form onSubmit={handleSubmitAdForm} className="border border-line bg-surface p-5">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-ink">광고 등록</h2>
            <p className="mt-1 text-sm text-muted">광고 슬롯에 연결할 광고 캠페인을 등록합니다.</p>
          </div>

          {createAd.isError && (
            <div className="mb-4 border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">
              광고 등록에 실패했습니다.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="광고 슬롯"
              id="platform-ad-slot"
              required
              error={adFormErrors.adSlotId}
              hint={activeAdSlots.length === 0 ? '선택 가능한 ACTIVE 슬롯이 없습니다.' : undefined}
            >
              <select
                id="platform-ad-slot"
                value={adFormValues.adSlotId}
                onChange={(event) => {
                  setAdFormValues((prev) => ({ ...prev, adSlotId: event.target.value }))
                  setAdFormErrors((prev) => ({ ...prev, adSlotId: undefined }))
                }}
                disabled={createAd.isPending || adSlotsQuery.isLoading || activeAdSlots.length === 0}
                className={[fieldControlClass, adFormErrors.adSlotId ? fieldControlErrorClass : ''].join(' ')}
              >
                <option value="">광고 슬롯 선택</option>
                {activeAdSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.placement} · {getSlotScope(slot, exhibitionTitles)} · {slot.status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="광고주명" id="platform-ad-advertiser" required error={adFormErrors.advertiserName}>
              <input
                id="platform-ad-advertiser"
                value={adFormValues.advertiserName}
                onChange={(event) => {
                  setAdFormValues((prev) => ({ ...prev, advertiserName: event.target.value }))
                  setAdFormErrors((prev) => ({ ...prev, advertiserName: undefined }))
                }}
                disabled={createAd.isPending}
                className={[fieldControlClass, adFormErrors.advertiserName ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="광고 제목" id="platform-ad-title" required error={adFormErrors.title}>
              <input
                id="platform-ad-title"
                value={adFormValues.title}
                onChange={(event) => {
                  setAdFormValues((prev) => ({ ...prev, title: event.target.value }))
                  setAdFormErrors((prev) => ({ ...prev, title: undefined }))
                }}
                disabled={createAd.isPending}
                className={[fieldControlClass, adFormErrors.title ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="이미지 URL" id="platform-ad-image-url" required error={adFormErrors.imageUrl}>
              <input
                id="platform-ad-image-url"
                value={adFormValues.imageUrl}
                onChange={(event) => {
                  setAdFormValues((prev) => ({ ...prev, imageUrl: event.target.value }))
                  setAdFormErrors((prev) => ({ ...prev, imageUrl: undefined }))
                }}
                disabled={createAd.isPending}
                placeholder="https://example.com/banner.png"
                className={[fieldControlClass, adFormErrors.imageUrl ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="링크 URL" id="platform-ad-link-url" error={adFormErrors.linkUrl} hint="선택 입력">
              <input
                id="platform-ad-link-url"
                value={adFormValues.linkUrl}
                onChange={(event) => {
                  setAdFormValues((prev) => ({ ...prev, linkUrl: event.target.value }))
                  setAdFormErrors((prev) => ({ ...prev, linkUrl: undefined }))
                }}
                disabled={createAd.isPending}
                placeholder="https://example.com"
                className={[fieldControlClass, adFormErrors.linkUrl ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="집행 시작일" id="platform-ad-start-at" required error={adFormErrors.startAt}>
              <input
                id="platform-ad-start-at"
                type="datetime-local"
                value={adFormValues.startAt}
                onChange={(event) => {
                  setAdFormValues((prev) => ({ ...prev, startAt: event.target.value }))
                  setAdFormErrors((prev) => ({ ...prev, startAt: undefined }))
                }}
                disabled={createAd.isPending}
                className={[fieldControlClass, adFormErrors.startAt ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="집행 종료일" id="platform-ad-end-at" required error={adFormErrors.endAt}>
              <input
                id="platform-ad-end-at"
                type="datetime-local"
                value={adFormValues.endAt}
                onChange={(event) => {
                  setAdFormValues((prev) => ({ ...prev, endAt: event.target.value }))
                  setAdFormErrors((prev) => ({ ...prev, endAt: undefined }))
                }}
                disabled={createAd.isPending}
                className={[fieldControlClass, adFormErrors.endAt ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="판매가" id="platform-ad-price" required error={adFormErrors.price}>
              <input
                id="platform-ad-price"
                type="number"
                min="0"
                step="1"
                value={adFormValues.price}
                onChange={(event) => {
                  setAdFormValues((prev) => ({ ...prev, price: event.target.value }))
                  setAdFormErrors((prev) => ({ ...prev, price: undefined }))
                }}
                disabled={createAd.isPending}
                className={[fieldControlClass, adFormErrors.price ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="상태" id="platform-ad-status" required error={adFormErrors.status}>
              <select
                id="platform-ad-status"
                value={adFormValues.status}
                onChange={(event) => {
                  setAdFormValues((prev) => ({ ...prev, status: event.target.value as CreateAdStatus }))
                  setAdFormErrors((prev) => ({ ...prev, status: undefined }))
                }}
                disabled={createAd.isPending}
                className={[fieldControlClass, adFormErrors.status ? fieldControlErrorClass : ''].join(' ')}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
              </select>
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={createAd.isPending}
              onClick={handleCancelAdForm}
              className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createAd.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              {createAd.isPending ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      )}

      {isEditAdFormOpen && editingAd && editAdFormValues && (
        <form ref={editAdFormRef} onSubmit={handleSubmitEditAdForm} className="border border-line bg-surface p-5">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-ink">광고 상세/수정</h2>
            <p className="mt-1 text-sm text-muted">등록된 광고 캠페인의 슬롯, 기간, 가격, 상태를 수정합니다.</p>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="border border-line bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">성과 지표</p>
              <p className="mt-2 text-sm font-semibold text-ink">
                노출 {editingAd.impressions.toLocaleString()}회 · 클릭 {editingAd.clicks.toLocaleString()}회
              </p>
              <p className="mt-1 text-xs text-muted">노출과 클릭은 수정할 수 없습니다.</p>
            </div>
            <div className="border border-line bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">광고 ID</p>
              <p className="mt-2 text-sm font-semibold text-ink">#{editingAd.id}</p>
              <p className="mt-1 text-xs text-muted">광고 식별자는 수정할 수 없습니다.</p>
            </div>
          </div>

          {updateAd.isError && (
            <div className="mb-4 border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">
              광고 수정에 실패했습니다.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="광고 슬롯"
              id="platform-edit-ad-slot"
              required
              error={editAdFormErrors.adSlotId}
              hint={editableAdSlots.length === 0 ? '선택 가능한 슬롯이 없습니다.' : undefined}
            >
              <select
                id="platform-edit-ad-slot"
                value={editAdFormValues.adSlotId}
                onChange={(event) => {
                  setEditAdFormValues((prev) => (prev ? { ...prev, adSlotId: event.target.value } : prev))
                  setEditAdFormErrors((prev) => ({ ...prev, adSlotId: undefined }))
                }}
                disabled={updateAd.isPending || adSlotsQuery.isLoading || editableAdSlots.length === 0}
                className={[fieldControlClass, editAdFormErrors.adSlotId ? fieldControlErrorClass : ''].join(' ')}
              >
                <option value="">광고 슬롯 선택</option>
                {editableAdSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.placement} · {getSlotScope(slot, exhibitionTitles)} · {slot.status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="광고주명" id="platform-edit-ad-advertiser" required error={editAdFormErrors.advertiserName}>
              <input
                id="platform-edit-ad-advertiser"
                value={editAdFormValues.advertiserName}
                onChange={(event) => {
                  setEditAdFormValues((prev) => (prev ? { ...prev, advertiserName: event.target.value } : prev))
                  setEditAdFormErrors((prev) => ({ ...prev, advertiserName: undefined }))
                }}
                disabled={updateAd.isPending}
                className={[fieldControlClass, editAdFormErrors.advertiserName ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="광고 제목" id="platform-edit-ad-title" required error={editAdFormErrors.title}>
              <input
                id="platform-edit-ad-title"
                value={editAdFormValues.title}
                onChange={(event) => {
                  setEditAdFormValues((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                  setEditAdFormErrors((prev) => ({ ...prev, title: undefined }))
                }}
                disabled={updateAd.isPending}
                className={[fieldControlClass, editAdFormErrors.title ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="이미지 URL" id="platform-edit-ad-image-url" required error={editAdFormErrors.imageUrl}>
              <input
                id="platform-edit-ad-image-url"
                value={editAdFormValues.imageUrl}
                onChange={(event) => {
                  setEditAdFormValues((prev) => (prev ? { ...prev, imageUrl: event.target.value } : prev))
                  setEditAdFormErrors((prev) => ({ ...prev, imageUrl: undefined }))
                }}
                disabled={updateAd.isPending}
                placeholder="https://example.com/banner.png"
                className={[fieldControlClass, editAdFormErrors.imageUrl ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="링크 URL" id="platform-edit-ad-link-url" error={editAdFormErrors.linkUrl} hint="선택 입력">
              <input
                id="platform-edit-ad-link-url"
                value={editAdFormValues.linkUrl}
                onChange={(event) => {
                  setEditAdFormValues((prev) => (prev ? { ...prev, linkUrl: event.target.value } : prev))
                  setEditAdFormErrors((prev) => ({ ...prev, linkUrl: undefined }))
                }}
                disabled={updateAd.isPending}
                placeholder="https://example.com"
                className={[fieldControlClass, editAdFormErrors.linkUrl ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="집행 시작일" id="platform-edit-ad-start-at" required error={editAdFormErrors.startAt}>
              <input
                id="platform-edit-ad-start-at"
                type="datetime-local"
                value={editAdFormValues.startAt}
                onChange={(event) => {
                  setEditAdFormValues((prev) => (prev ? { ...prev, startAt: event.target.value } : prev))
                  setEditAdFormErrors((prev) => ({ ...prev, startAt: undefined }))
                }}
                disabled={updateAd.isPending}
                className={[fieldControlClass, editAdFormErrors.startAt ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="집행 종료일" id="platform-edit-ad-end-at" required error={editAdFormErrors.endAt}>
              <input
                id="platform-edit-ad-end-at"
                type="datetime-local"
                value={editAdFormValues.endAt}
                onChange={(event) => {
                  setEditAdFormValues((prev) => (prev ? { ...prev, endAt: event.target.value } : prev))
                  setEditAdFormErrors((prev) => ({ ...prev, endAt: undefined }))
                }}
                disabled={updateAd.isPending}
                className={[fieldControlClass, editAdFormErrors.endAt ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="판매가" id="platform-edit-ad-price" required error={editAdFormErrors.price}>
              <input
                id="platform-edit-ad-price"
                type="number"
                min="0"
                step="1"
                value={editAdFormValues.price}
                onChange={(event) => {
                  setEditAdFormValues((prev) => (prev ? { ...prev, price: event.target.value } : prev))
                  setEditAdFormErrors((prev) => ({ ...prev, price: undefined }))
                }}
                disabled={updateAd.isPending}
                className={[fieldControlClass, editAdFormErrors.price ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="상태" id="platform-edit-ad-status" required error={editAdFormErrors.status}>
              <select
                id="platform-edit-ad-status"
                value={editAdFormValues.status}
                onChange={(event) => {
                  setEditAdFormValues((prev) => (prev ? { ...prev, status: event.target.value as AdvertisementStatus } : prev))
                  setEditAdFormErrors((prev) => ({ ...prev, status: undefined }))
                }}
                disabled={updateAd.isPending}
                className={[fieldControlClass, editAdFormErrors.status ? fieldControlErrorClass : ''].join(' ')}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={updateAd.isPending}
              onClick={handleCancelEditAdForm}
              className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={updateAd.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              {updateAd.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      )}

      {isSlotFormOpen && (
        <form onSubmit={handleSubmitSlotForm} className="border border-line bg-surface p-5">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-ink">광고 슬롯 생성</h2>
            <p className="mt-1 text-sm text-muted">플랫폼 공통 또는 행사별 광고 지면을 등록합니다.</p>
          </div>

          {createAdSlot.isError && (
            <div className="mb-4 border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">
              광고 슬롯 생성에 실패했습니다.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="적용 범위"
              id="ad-slot-exhibition"
              hint={exhibitionsQuery.isError ? '행사 목록을 불러오지 못했습니다. 플랫폼 공통은 선택할 수 있습니다.' : undefined}
            >
              <select
                id="ad-slot-exhibition"
                value={slotFormValues.exhibitionId}
                onChange={(event) => setSlotFormValues((prev) => ({ ...prev, exhibitionId: event.target.value }))}
                disabled={createAdSlot.isPending}
                className={fieldControlClass}
              >
                <option value={PLATFORM_SCOPE_VALUE}>플랫폼 공통</option>
                {exhibitions.map((exhibition) => (
                  <option key={exhibition.id} value={exhibition.id}>
                    {exhibition.title} ({exhibition.status})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="placement" id="ad-slot-placement" required error={slotFormErrors.placement}>
              <input
                id="ad-slot-placement"
                list="ad-slot-placement-options"
                value={slotFormValues.placement}
                onChange={(event) => {
                  setSlotFormValues((prev) => ({ ...prev, placement: event.target.value }))
                  setSlotFormErrors((prev) => ({ ...prev, placement: undefined }))
                }}
                disabled={createAdSlot.isPending}
                placeholder="예: MAIN_BANNER"
                className={[fieldControlClass, slotFormErrors.placement ? fieldControlErrorClass : ''].join(' ')}
              />
              {placementSuggestions.length > 0 && (
                <datalist id="ad-slot-placement-options">
                  {placementSuggestions.map((placement) => (
                    <option key={placement} value={placement} />
                  ))}
                </datalist>
              )}
            </Field>

            <Field label="기본 가격" id="ad-slot-base-price" required error={slotFormErrors.basePrice}>
              <input
                id="ad-slot-base-price"
                type="number"
                min="0"
                step="1"
                value={slotFormValues.basePrice}
                onChange={(event) => {
                  setSlotFormValues((prev) => ({ ...prev, basePrice: event.target.value }))
                  setSlotFormErrors((prev) => ({ ...prev, basePrice: undefined }))
                }}
                disabled={createAdSlot.isPending}
                className={[fieldControlClass, slotFormErrors.basePrice ? fieldControlErrorClass : ''].join(' ')}
              />
            </Field>

            <Field label="상태" id="ad-slot-status" required error={slotFormErrors.status}>
              <select
                id="ad-slot-status"
                value={slotFormValues.status}
                onChange={(event) => {
                  setSlotFormValues((prev) => ({ ...prev, status: event.target.value as AdSlotStatus }))
                  setSlotFormErrors((prev) => ({ ...prev, status: undefined }))
                }}
                disabled={createAdSlot.isPending}
                className={[fieldControlClass, slotFormErrors.status ? fieldControlErrorClass : ''].join(' ')}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={createAdSlot.isPending}
              onClick={handleCancelSlotForm}
              className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createAdSlot.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            >
              {createAdSlot.isPending ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      )}

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
