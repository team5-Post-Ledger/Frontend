import type { Advertisement, AdSlot, Exhibition, User } from '../../types'
import { mockDelay } from '../../lib/api/mockClient'

export interface PlatformExhibitionSummary extends Exhibition {
  adminCount: number
}

export interface PlatformAdminSummary extends User {
  assignedExhibitionIds: number[]
  isActive: boolean
}

export interface PlatformAccountantSummary extends User {
  isActive: boolean
}

export interface PlatformAdSummary extends Advertisement {
  placement: string
  exhibitionTitle: string | null
}

export interface PlatformStatsOverview {
  exhibitionCount: number
  openExhibitionCount: number
  grossAmount: number
  onlineAmount: number
  onsiteAmount: number
  feeAmount: number
  netPayout: number
  visitorCount: number
  reservationCount: number
  adRevenue: number
  activeAdCount: number
  adImpressions: number
  adClicks: number
  exhibitionSummaries: PlatformExhibitionStatsSummary[]
}

export interface PlatformExhibitionStatsSummary {
  exhibitionId: number
  title: string
  status: Exhibition['status']
  startDate: string
  endDate: string
  grossAmount: number
  visitorCount: number
  reservationCount: number
  adRevenue: number
}

export type CreatePlatformExhibitionInput = Pick<
  Exhibition,
  'title' | 'slug' | 'venue' | 'address' | 'startDate' | 'endDate'
> &
  Partial<Pick<Exhibition, 'status' | 'floorMapMeta' | 'enforceStaffQualification' | 'createdBy'>>

export type UpdatePlatformExhibitionInput = Partial<
  Pick<
    Exhibition,
    | 'title'
    | 'slug'
    | 'venue'
    | 'address'
    | 'floorMapMeta'
    | 'startDate'
    | 'endDate'
    | 'status'
    | 'enforceStaffQualification'
  >
>

export interface CreatePlatformAdminInput {
  email: string
  name: string
  phone?: string | null
  exhibitionId?: number
}

export interface CreatePlatformAccountantInput {
  email: string
  name: string
  phone?: string | null
}

export type CreatePlatformAdSlotInput = Pick<AdSlot, 'exhibitionId' | 'placement' | 'basePrice'> &
  Partial<Pick<AdSlot, 'status'>>

export type UpdatePlatformAdSlotInput = Partial<Pick<AdSlot, 'exhibitionId' | 'placement' | 'basePrice' | 'status'>>

export type CreatePlatformAdInput = Pick<
  Advertisement,
  'adSlotId' | 'advertiserName' | 'title' | 'imageUrl' | 'linkUrl' | 'startAt' | 'endAt' | 'price'
> &
  Partial<Pick<Advertisement, 'exhibitorId' | 'status'>>

export type UpdatePlatformAdInput = Partial<
  Pick<
    Advertisement,
    | 'adSlotId'
    | 'advertiserName'
    | 'exhibitorId'
    | 'title'
    | 'imageUrl'
    | 'linkUrl'
    | 'startAt'
    | 'endAt'
    | 'price'
    | 'status'
  >
>

let PLATFORM_EXHIBITIONS: PlatformExhibitionSummary[] = [
  {
    id: 1,
    title: '2026 서울 스마트팩토리 박람회',
    slug: 'smart-factory-2026',
    venue: '코엑스 1전시장',
    address: '서울 강남구 영동대로 513',
    floorMapMeta: null,
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    status: 'OPEN',
    enforceStaffQualification: true,
    createdBy: 1,
    deletedAt: null,
    adminCount: 2,
  },
  {
    id: 13,
    title: '2027 스마트시티 박람회',
    slug: 'smart-city-2027',
    venue: '코엑스 1전시장',
    address: '서울 강남구 영동대로 513',
    floorMapMeta: null,
    startDate: '2027-03-03',
    endDate: '2027-03-05',
    status: 'DRAFT',
    enforceStaffQualification: true,
    createdBy: 1,
    deletedAt: null,
    adminCount: 1,
  },
  {
    id: 12,
    title: '2026 부산 국제수산엑스포',
    slug: 'busan-seafood-2026',
    venue: 'BEXCO 제2전시장',
    address: '부산 해운대구 APEC로 55',
    floorMapMeta: null,
    startDate: '2026-03-10',
    endDate: '2026-03-12',
    status: 'CLOSED',
    enforceStaffQualification: false,
    createdBy: 1,
    deletedAt: null,
    adminCount: 1,
  },
]

type PlatformAdminRecord = User & {
  assignedExhibitionIds: number[]
}

let PLATFORM_ADMINS: PlatformAdminRecord[] = [
  {
    id: 2,
    email: 'admin@fairpilot.io',
    name: '김운영',
    phone: '010-2222-2222',
    role: 'EXPO_ADMIN',
    deletedAt: null,
    assignedExhibitionIds: [1, 13],
  },
  {
    id: 7,
    email: 'expo.sea@fairpilot.io',
    name: '정바다',
    phone: '010-7777-7777',
    role: 'EXPO_ADMIN',
    deletedAt: null,
    assignedExhibitionIds: [12],
  },
  {
    id: 8,
    email: 'expo.pending@fairpilot.io',
    name: '오미배정',
    phone: null,
    role: 'EXPO_ADMIN',
    deletedAt: null,
    assignedExhibitionIds: [],
  },
]

let PLATFORM_ACCOUNTANTS: User[] = [
  {
    id: 4,
    email: 'accountant@fairpilot.io',
    name: '이회계',
    phone: null,
    role: 'ACCOUNTANT',
    deletedAt: null,
  },
  {
    id: 9,
    email: 'settlement@fairpilot.io',
    name: '박정산',
    phone: '010-9999-9999',
    role: 'ACCOUNTANT',
    deletedAt: null,
  },
  {
    id: 10,
    email: 'accounting.closed@fairpilot.io',
    name: '최마감',
    phone: '010-1010-1010',
    role: 'ACCOUNTANT',
    deletedAt: '2026-08-31T18:00:00',
  },
]

let PLATFORM_AD_SLOTS: AdSlot[] = [
  {
    id: 1,
    exhibitionId: null,
    placement: 'HOME_TOP',
    basePrice: 1200000,
    status: 'ACTIVE',
    createdAt: '2026-08-01T09:00:00',
    updatedAt: '2026-08-10T09:00:00',
  },
  {
    id: 2,
    exhibitionId: 1,
    placement: 'EXPO_BANNER',
    basePrice: 900000,
    status: 'ACTIVE',
    createdAt: '2026-08-03T09:00:00',
    updatedAt: '2026-08-12T09:00:00',
  },
  {
    id: 3,
    exhibitionId: 13,
    placement: 'BOOTH_RECOMMEND',
    basePrice: 600000,
    status: 'INACTIVE',
    createdAt: '2026-08-05T09:00:00',
    updatedAt: '2026-08-15T09:00:00',
  },
]

let PLATFORM_ADS: Advertisement[] = [
  {
    id: 1,
    adSlotId: 1,
    advertiserName: '스마트팩토리 협회',
    exhibitorId: null,
    title: '제조 자동화 특별관',
    imageUrl: '/ads/smart-factory.png',
    linkUrl: '/exhibitions/1',
    startAt: '2026-08-20T00:00:00',
    endAt: '2026-09-03T23:59:59',
    price: 1200000,
    status: 'ACTIVE',
    impressions: 8420,
    clicks: 318,
    createdAt: '2026-08-01T09:00:00',
    updatedAt: '2026-08-10T09:00:00',
  },
  {
    id: 2,
    adSlotId: 2,
    advertiserName: 'AI 제조 클러스터',
    exhibitorId: null,
    title: '스마트 제조 상담관',
    imageUrl: '/ads/ai-factory.png',
    linkUrl: '/exhibitions/1/booths',
    startAt: '2026-08-25T00:00:00',
    endAt: '2026-09-03T23:59:59',
    price: 900000,
    status: 'DRAFT',
    impressions: 0,
    clicks: 0,
    createdAt: '2026-08-12T10:00:00',
    updatedAt: '2026-08-12T10:00:00',
  },
  {
    id: 3,
    adSlotId: 2,
    advertiserName: '산업 IoT 포럼',
    exhibitorId: null,
    title: '현장 데이터 분석 세미나',
    imageUrl: '/ads/iot-forum.png',
    linkUrl: '/exhibitions/1',
    startAt: '2026-09-01T00:00:00',
    endAt: '2026-09-03T23:59:59',
    price: 760000,
    status: 'PAUSED',
    impressions: 2140,
    clicks: 64,
    createdAt: '2026-08-13T10:00:00',
    updatedAt: '2026-08-20T10:00:00',
  },
  {
    id: 4,
    adSlotId: 3,
    advertiserName: '스마트시티 협의회',
    exhibitorId: null,
    title: '도시 데이터 특별전',
    imageUrl: '/ads/smart-city.png',
    linkUrl: '/exhibitions/13',
    startAt: '2026-06-01T00:00:00',
    endAt: '2026-06-15T23:59:59',
    price: 580000,
    status: 'EXPIRED',
    impressions: 5320,
    clicks: 181,
    createdAt: '2026-05-20T10:00:00',
    updatedAt: '2026-06-16T10:00:00',
  },
]

const PLATFORM_STATS_BASE: Omit<
  PlatformStatsOverview,
  'exhibitionCount' | 'openExhibitionCount' | 'activeAdCount' | 'adImpressions' | 'adClicks'
> = {
  grossAmount: 28400000,
  onlineAmount: 22300000,
  onsiteAmount: 6100000,
  feeAmount: 1780000,
  netPayout: 28400000,
  visitorCount: 12640,
  reservationCount: 1800,
  adRevenue: 1780000,
  exhibitionSummaries: [
    {
      exhibitionId: 1,
      title: '2026 서울 스마트팩토리 박람회',
      status: 'OPEN',
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      grossAmount: 18400000,
      visitorCount: 7480,
      reservationCount: 830,
      adRevenue: 1200000,
    },
    {
      exhibitionId: 12,
      title: '2026 부산 국제수산엑스포',
      status: 'CLOSED',
      startDate: '2026-03-10',
      endDate: '2026-03-12',
      grossAmount: 6300000,
      visitorCount: 3920,
      reservationCount: 710,
      adRevenue: 0,
    },
    {
      exhibitionId: 13,
      title: '2027 스마트시티 박람회',
      status: 'DRAFT',
      startDate: '2027-03-03',
      endDate: '2027-03-05',
      grossAmount: 3700000,
      visitorCount: 1240,
      reservationCount: 260,
      adRevenue: 580000,
    },
  ],
}

function nowIso() {
  return new Date().toISOString()
}

function nextId(records: Array<{ id: number }>) {
  return Math.max(0, ...records.map((record) => record.id)) + 1
}

function toPlatformAdminSummary(admin: PlatformAdminRecord): PlatformAdminSummary {
  return {
    ...admin,
    isActive: admin.deletedAt === null,
  }
}

function toPlatformAccountantSummary(accountant: User): PlatformAccountantSummary {
  return {
    ...accountant,
    isActive: accountant.deletedAt === null,
  }
}

function toPlatformAdSummary(ad: Advertisement): PlatformAdSummary {
  const slot = PLATFORM_AD_SLOTS.find((item) => item.id === ad.adSlotId)
  const exhibition = slot?.exhibitionId
    ? PLATFORM_EXHIBITIONS.find((item) => item.id === slot.exhibitionId)
    : null

  return {
    ...ad,
    placement: slot?.placement ?? `SLOT_${ad.adSlotId}`,
    exhibitionTitle: exhibition?.title ?? null,
  }
}

function buildPlatformStatsOverview(): PlatformStatsOverview {
  const activeExhibitions = PLATFORM_EXHIBITIONS.filter((exhibition) => exhibition.deletedAt === null)

  return {
    ...PLATFORM_STATS_BASE,
    exhibitionCount: activeExhibitions.length,
    openExhibitionCount: activeExhibitions.filter((exhibition) => exhibition.status === 'OPEN').length,
    activeAdCount: PLATFORM_ADS.filter((ad) => ad.status === 'ACTIVE').length,
    adImpressions: PLATFORM_ADS.reduce((sum, ad) => sum + ad.impressions, 0),
    adClicks: PLATFORM_ADS.reduce((sum, ad) => sum + ad.clicks, 0),
    exhibitionSummaries: activeExhibitions.map((exhibition) => {
      const summary = PLATFORM_STATS_BASE.exhibitionSummaries.find((item) => item.exhibitionId === exhibition.id)

      return {
        exhibitionId: exhibition.id,
        title: exhibition.title,
        status: exhibition.status,
        startDate: exhibition.startDate,
        endDate: exhibition.endDate,
        grossAmount: summary?.grossAmount ?? 0,
        visitorCount: summary?.visitorCount ?? 0,
        reservationCount: summary?.reservationCount ?? 0,
        adRevenue: summary?.adRevenue ?? 0,
      }
    }),
  }
}

export async function listPlatformExhibitions(options: { fail?: boolean } = {}): Promise<PlatformExhibitionSummary[]> {
  if (options.fail) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Failed to load platform exhibitions')), 400)
    })
  }

  return mockDelay(PLATFORM_EXHIBITIONS.filter((exhibition) => exhibition.deletedAt === null), 500)
}

export async function getPlatformExhibition(id: number): Promise<PlatformExhibitionSummary | null> {
  return mockDelay(PLATFORM_EXHIBITIONS.find((exhibition) => exhibition.id === id && exhibition.deletedAt === null) ?? null, 450)
}

export async function listPlatformExhibitionAdmins(exhibitionId: number): Promise<PlatformAdminSummary[]> {
  return mockDelay(
    PLATFORM_ADMINS.filter(
      (admin) => admin.role === 'EXPO_ADMIN' && admin.assignedExhibitionIds.includes(exhibitionId),
    ).map(toPlatformAdminSummary),
    450,
  )
}

export async function listPlatformAdmins(): Promise<PlatformAdminSummary[]> {
  return mockDelay(
    PLATFORM_ADMINS.filter((admin) => admin.role === 'EXPO_ADMIN').map(toPlatformAdminSummary),
    500,
  )
}

export async function listPlatformAccountants(): Promise<PlatformAccountantSummary[]> {
  return mockDelay(
    PLATFORM_ACCOUNTANTS.filter((accountant) => accountant.role === 'ACCOUNTANT').map(toPlatformAccountantSummary),
    500,
  )
}

export async function listPlatformAdSlots(): Promise<AdSlot[]> {
  return mockDelay(PLATFORM_AD_SLOTS, 500)
}

export async function listPlatformAds(): Promise<PlatformAdSummary[]> {
  return mockDelay(PLATFORM_ADS.map(toPlatformAdSummary), 500)
}

export async function getPlatformStatsOverview(): Promise<PlatformStatsOverview> {
  return mockDelay(buildPlatformStatsOverview(), 500)
}

export async function createPlatformExhibition(input: CreatePlatformExhibitionInput): Promise<PlatformExhibitionSummary> {
  const created: PlatformExhibitionSummary = {
    id: nextId(PLATFORM_EXHIBITIONS),
    title: input.title,
    slug: input.slug,
    venue: input.venue,
    address: input.address,
    floorMapMeta: input.floorMapMeta ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status ?? 'DRAFT',
    enforceStaffQualification: input.enforceStaffQualification ?? false,
    createdBy: input.createdBy ?? 1,
    deletedAt: null,
    adminCount: 0,
  }

  PLATFORM_EXHIBITIONS = [created, ...PLATFORM_EXHIBITIONS]
  return mockDelay(created, 350)
}

export async function updatePlatformExhibition(
  id: number,
  input: UpdatePlatformExhibitionInput,
): Promise<PlatformExhibitionSummary> {
  const exhibition = PLATFORM_EXHIBITIONS.find((item) => item.id === id && item.deletedAt === null)
  if (!exhibition) {
    throw new Error('Platform exhibition not found')
  }

  Object.assign(exhibition, input)
  return mockDelay(exhibition, 350)
}

export async function updatePlatformExhibitionStatus(
  id: number,
  status: Exhibition['status'],
): Promise<PlatformExhibitionSummary> {
  return updatePlatformExhibition(id, { status })
}

export async function deletePlatformExhibition(id: number): Promise<void> {
  const exhibition = PLATFORM_EXHIBITIONS.find((item) => item.id === id && item.deletedAt === null)
  if (!exhibition) {
    throw new Error('Platform exhibition not found')
  }

  exhibition.deletedAt = nowIso()
  await mockDelay(null, 350)
}

export async function createPlatformAdmin(input: CreatePlatformAdminInput): Promise<PlatformAdminSummary> {
  const created: PlatformAdminRecord = {
    id: nextId([...PLATFORM_ADMINS, ...PLATFORM_ACCOUNTANTS]),
    email: input.email,
    name: input.name,
    phone: input.phone ?? null,
    role: 'EXPO_ADMIN',
    deletedAt: null,
    assignedExhibitionIds: input.exhibitionId ? [input.exhibitionId] : [],
  }

  PLATFORM_ADMINS = [created, ...PLATFORM_ADMINS]
  if (input.exhibitionId) {
    const exhibition = PLATFORM_EXHIBITIONS.find((item) => item.id === input.exhibitionId)
    if (exhibition) {
      exhibition.adminCount = PLATFORM_ADMINS.filter((admin) =>
        admin.assignedExhibitionIds.includes(input.exhibitionId as number),
      ).length
    }
  }
  return mockDelay(toPlatformAdminSummary(created), 350)
}

export async function assignPlatformAdmin(exhibitionId: number, userId: number): Promise<PlatformAdminSummary> {
  const admin = PLATFORM_ADMINS.find((item) => item.id === userId && item.role === 'EXPO_ADMIN')
  if (!admin) {
    throw new Error('Platform admin not found')
  }

  if (!admin.assignedExhibitionIds.includes(exhibitionId)) {
    admin.assignedExhibitionIds = [...admin.assignedExhibitionIds, exhibitionId]
  }
  const exhibition = PLATFORM_EXHIBITIONS.find((item) => item.id === exhibitionId)
  if (exhibition) {
    exhibition.adminCount = PLATFORM_ADMINS.filter((item) => item.assignedExhibitionIds.includes(exhibitionId)).length
  }

  return mockDelay(toPlatformAdminSummary(admin), 350)
}

export async function createPlatformAccountant(
  input: CreatePlatformAccountantInput,
): Promise<PlatformAccountantSummary> {
  const created: User = {
    id: nextId([...PLATFORM_ADMINS, ...PLATFORM_ACCOUNTANTS]),
    email: input.email,
    name: input.name,
    phone: input.phone ?? null,
    role: 'ACCOUNTANT',
    deletedAt: null,
  }

  PLATFORM_ACCOUNTANTS = [created, ...PLATFORM_ACCOUNTANTS]
  return mockDelay(toPlatformAccountantSummary(created), 350)
}

export async function deactivatePlatformAccountant(userId: number): Promise<PlatformAccountantSummary> {
  const accountant = PLATFORM_ACCOUNTANTS.find((item) => item.id === userId && item.role === 'ACCOUNTANT')
  if (!accountant) {
    throw new Error('Platform accountant not found')
  }

  accountant.deletedAt = accountant.deletedAt ?? nowIso()
  return mockDelay(toPlatformAccountantSummary(accountant), 350)
}

export async function activatePlatformAccountant(userId: number): Promise<PlatformAccountantSummary> {
  const accountant = PLATFORM_ACCOUNTANTS.find((item) => item.id === userId && item.role === 'ACCOUNTANT')
  if (!accountant) {
    throw new Error('Platform accountant not found')
  }

  accountant.deletedAt = null
  return mockDelay(toPlatformAccountantSummary(accountant), 350)
}

export async function createPlatformAdSlot(input: CreatePlatformAdSlotInput): Promise<AdSlot> {
  const created: AdSlot = {
    id: nextId(PLATFORM_AD_SLOTS),
    exhibitionId: input.exhibitionId,
    placement: input.placement,
    basePrice: input.basePrice,
    status: input.status ?? 'ACTIVE',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  PLATFORM_AD_SLOTS = [created, ...PLATFORM_AD_SLOTS]
  return mockDelay(created, 350)
}

export async function updatePlatformAdSlot(slotId: number, input: UpdatePlatformAdSlotInput): Promise<AdSlot> {
  const slot = PLATFORM_AD_SLOTS.find((item) => item.id === slotId)
  if (!slot) {
    throw new Error('Platform ad slot not found')
  }

  Object.assign(slot, input, { updatedAt: nowIso() })
  return mockDelay(slot, 350)
}

export async function deletePlatformAdSlot(slotId: number): Promise<void> {
  await updatePlatformAdSlot(slotId, { status: 'INACTIVE' })
}

export async function createPlatformAd(input: CreatePlatformAdInput): Promise<PlatformAdSummary> {
  const created: Advertisement = {
    id: nextId(PLATFORM_ADS),
    adSlotId: input.adSlotId,
    advertiserName: input.advertiserName,
    exhibitorId: input.exhibitorId ?? null,
    title: input.title,
    imageUrl: input.imageUrl,
    linkUrl: input.linkUrl,
    startAt: input.startAt,
    endAt: input.endAt,
    price: input.price,
    status: input.status ?? 'DRAFT',
    impressions: 0,
    clicks: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  PLATFORM_ADS = [created, ...PLATFORM_ADS]
  return mockDelay(toPlatformAdSummary(created), 350)
}

export async function updatePlatformAd(adId: number, input: UpdatePlatformAdInput): Promise<PlatformAdSummary> {
  const ad = PLATFORM_ADS.find((item) => item.id === adId)
  if (!ad) {
    throw new Error('Platform ad not found')
  }

  Object.assign(ad, input, { updatedAt: nowIso() })
  return mockDelay(toPlatformAdSummary(ad), 350)
}

export async function updatePlatformAdStatus(
  adId: number,
  status: Advertisement['status'],
): Promise<PlatformAdSummary> {
  return updatePlatformAd(adId, { status })
}
