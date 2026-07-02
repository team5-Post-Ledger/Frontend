import type { Advertisement, AdSlot, Exhibition, ExhibitionAdmin, User } from '../../types'
import {
  platformAdvertisementSeed,
  platformAdSlotSeed,
  platformExhibitionAdminSeed,
  platformExhibitionSeed,
  platformStatsBaseSeed,
  platformUserSeed,
} from '../../lib/mock/platformSeed'
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

let platformExhibitions: Exhibition[] = platformExhibitionSeed.map((exhibition) => ({ ...exhibition }))
let platformUsers: User[] = platformUserSeed.map((user) => ({ ...user }))
let platformExhibitionAdmins: ExhibitionAdmin[] = platformExhibitionAdminSeed.map((admin) => ({ ...admin }))
let platformAdSlots: AdSlot[] = platformAdSlotSeed.map((slot) => ({ ...slot }))
let platformAds: Advertisement[] = platformAdvertisementSeed.map((ad) => ({ ...ad }))

function nowIso() {
  return new Date().toISOString()
}

function nextId(records: Array<{ id: number }>) {
  return Math.max(0, ...records.map((record) => record.id)) + 1
}

function getAssignedExhibitionIds(userId: number): number[] {
  return platformExhibitionAdmins.filter((admin) => admin.userId === userId).map((admin) => admin.exhibitionId)
}

function getAdminCount(exhibitionId: number): number {
  return platformExhibitionAdmins.filter((admin) => admin.exhibitionId === exhibitionId).length
}

function toPlatformExhibitionSummary(exhibition: Exhibition): PlatformExhibitionSummary {
  return {
    ...exhibition,
    adminCount: getAdminCount(exhibition.id),
  }
}

function toPlatformAdminSummary(admin: User): PlatformAdminSummary {
  return {
    ...admin,
    assignedExhibitionIds: getAssignedExhibitionIds(admin.id),
    isActive: admin.deletedAt === null,
  }
}

function toPlatformAccountantSummary(accountant: User): PlatformAccountantSummary {
  return {
    ...accountant,
    isActive: accountant.deletedAt === null,
  }
}

function toPlatformAdSlotSummary(slot: AdSlot): AdSlot {
  return { ...slot }
}

function toPlatformAdvertisementSummary(ad: Advertisement): PlatformAdSummary {
  const slot = platformAdSlots.find((item) => item.id === ad.adSlotId)
  const exhibition = slot?.exhibitionId
    ? platformExhibitions.find((item) => item.id === slot.exhibitionId)
    : null

  return {
    ...ad,
    placement: slot?.placement ?? `SLOT_${ad.adSlotId}`,
    exhibitionTitle: exhibition?.title ?? null,
  }
}

function buildPlatformStatsOverview(): PlatformStatsOverview {
  const activeExhibitions = platformExhibitions.filter((exhibition) => exhibition.deletedAt === null)
  const adRevenue = platformAds
    .filter((ad) => ad.status === 'ACTIVE' || ad.status === 'EXPIRED')
    .reduce((sum, ad) => sum + ad.price, 0)

  return {
    grossAmount: platformStatsBaseSeed.grossAmount,
    onlineAmount: platformStatsBaseSeed.onlineAmount,
    onsiteAmount: platformStatsBaseSeed.onsiteAmount,
    feeAmount: platformStatsBaseSeed.feeAmount,
    netPayout: platformStatsBaseSeed.grossAmount - platformStatsBaseSeed.feeAmount + adRevenue,
    visitorCount: platformStatsBaseSeed.visitorCount,
    reservationCount: platformStatsBaseSeed.reservationCount,
    adRevenue,
    exhibitionCount: activeExhibitions.length,
    openExhibitionCount: activeExhibitions.filter((exhibition) => exhibition.status === 'OPEN').length,
    activeAdCount: platformAds.filter((ad) => ad.status === 'ACTIVE').length,
    adImpressions: platformAds.reduce((sum, ad) => sum + ad.impressions, 0),
    adClicks: platformAds.reduce((sum, ad) => sum + ad.clicks, 0),
    exhibitionSummaries: activeExhibitions.map((exhibition) => {
      const summary = platformStatsBaseSeed.exhibitionMetrics.find((item) => item.exhibitionId === exhibition.id)

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

  return mockDelay(
    platformExhibitions
      .filter((exhibition) => exhibition.deletedAt === null)
      .map(toPlatformExhibitionSummary),
    500,
  )
}

export async function getPlatformExhibition(id: number): Promise<PlatformExhibitionSummary | null> {
  const exhibition = platformExhibitions.find((item) => item.id === id && item.deletedAt === null)
  return mockDelay(exhibition ? toPlatformExhibitionSummary(exhibition) : null, 450)
}

export async function listPlatformExhibitionAdmins(exhibitionId: number): Promise<PlatformAdminSummary[]> {
  return mockDelay(
    platformUsers
      .filter((user) => user.role === 'EXPO_ADMIN' && getAssignedExhibitionIds(user.id).includes(exhibitionId))
      .map(toPlatformAdminSummary),
    450,
  )
}

export async function listPlatformAdmins(): Promise<PlatformAdminSummary[]> {
  return mockDelay(
    platformUsers.filter((user) => user.role === 'EXPO_ADMIN').map(toPlatformAdminSummary),
    500,
  )
}

export async function listPlatformAccountants(): Promise<PlatformAccountantSummary[]> {
  return mockDelay(
    platformUsers.filter((user) => user.role === 'ACCOUNTANT').map(toPlatformAccountantSummary),
    500,
  )
}

export async function listPlatformAdSlots(): Promise<AdSlot[]> {
  return mockDelay(platformAdSlots.map(toPlatformAdSlotSummary), 500)
}

export async function listPlatformAds(): Promise<PlatformAdSummary[]> {
  return mockDelay(platformAds.map(toPlatformAdvertisementSummary), 500)
}

export async function getPlatformStatsOverview(): Promise<PlatformStatsOverview> {
  return mockDelay(buildPlatformStatsOverview(), 500)
}

export async function createPlatformExhibition(input: CreatePlatformExhibitionInput): Promise<PlatformExhibitionSummary> {
  const created: Exhibition = {
    id: nextId(platformExhibitions),
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
    bannerImageUrl: null,
  }

  platformExhibitions = [created, ...platformExhibitions]
  return mockDelay(toPlatformExhibitionSummary(created), 350)
}

export async function updatePlatformExhibition(
  id: number,
  input: UpdatePlatformExhibitionInput,
): Promise<PlatformExhibitionSummary> {
  const exhibition = platformExhibitions.find((item) => item.id === id && item.deletedAt === null)
  if (!exhibition) {
    throw new Error('Platform exhibition not found')
  }

  Object.assign(exhibition, input)
  return mockDelay(toPlatformExhibitionSummary(exhibition), 350)
}

export async function updatePlatformExhibitionStatus(
  id: number,
  status: Exhibition['status'],
): Promise<PlatformExhibitionSummary> {
  return updatePlatformExhibition(id, { status })
}

export async function deletePlatformExhibition(id: number): Promise<void> {
  const exhibition = platformExhibitions.find((item) => item.id === id && item.deletedAt === null)
  if (!exhibition) {
    throw new Error('Platform exhibition not found')
  }

  exhibition.deletedAt = nowIso()
  await mockDelay(null, 350)
}

export async function createPlatformAdmin(input: CreatePlatformAdminInput): Promise<PlatformAdminSummary> {
  const created: User = {
    id: nextId(platformUsers),
    email: input.email,
    name: input.name,
    phone: input.phone ?? null,
    role: 'EXPO_ADMIN',
    deletedAt: null,
  }

  platformUsers = [created, ...platformUsers]
  if (input.exhibitionId) {
    platformExhibitionAdmins = [
      {
        id: nextId(platformExhibitionAdmins),
        exhibitionId: input.exhibitionId,
        userId: created.id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      ...platformExhibitionAdmins,
    ]
  }
  return mockDelay(toPlatformAdminSummary(created), 350)
}

export async function assignPlatformAdmin(exhibitionId: number, userId: number): Promise<PlatformAdminSummary> {
  const admin = platformUsers.find((item) => item.id === userId && item.role === 'EXPO_ADMIN')
  if (!admin) {
    throw new Error('Platform admin not found')
  }

  const existing = platformExhibitionAdmins.find(
    (item) => item.exhibitionId === exhibitionId && item.userId === userId,
  )
  if (!existing) {
    platformExhibitionAdmins = [
      {
        id: nextId(platformExhibitionAdmins),
        exhibitionId,
        userId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      ...platformExhibitionAdmins,
    ]
  }

  return mockDelay(toPlatformAdminSummary(admin), 350)
}

export async function createPlatformAccountant(
  input: CreatePlatformAccountantInput,
): Promise<PlatformAccountantSummary> {
  const created: User = {
    id: nextId(platformUsers),
    email: input.email,
    name: input.name,
    phone: input.phone ?? null,
    role: 'ACCOUNTANT',
    deletedAt: null,
  }

  platformUsers = [created, ...platformUsers]
  return mockDelay(toPlatformAccountantSummary(created), 350)
}

export async function deactivatePlatformAccountant(userId: number): Promise<PlatformAccountantSummary> {
  const accountant = platformUsers.find((item) => item.id === userId && item.role === 'ACCOUNTANT')
  if (!accountant) {
    throw new Error('Platform accountant not found')
  }

  accountant.deletedAt = accountant.deletedAt ?? nowIso()
  return mockDelay(toPlatformAccountantSummary(accountant), 350)
}

export async function activatePlatformAccountant(userId: number): Promise<PlatformAccountantSummary> {
  const accountant = platformUsers.find((item) => item.id === userId && item.role === 'ACCOUNTANT')
  if (!accountant) {
    throw new Error('Platform accountant not found')
  }

  accountant.deletedAt = null
  return mockDelay(toPlatformAccountantSummary(accountant), 350)
}

export async function createPlatformAdSlot(input: CreatePlatformAdSlotInput): Promise<AdSlot> {
  const created: AdSlot = {
    id: nextId(platformAdSlots),
    exhibitionId: input.exhibitionId,
    placement: input.placement,
    basePrice: input.basePrice,
    status: input.status ?? 'ACTIVE',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  platformAdSlots = [created, ...platformAdSlots]
  return mockDelay(toPlatformAdSlotSummary(created), 350)
}

export async function updatePlatformAdSlot(slotId: number, input: UpdatePlatformAdSlotInput): Promise<AdSlot> {
  const slot = platformAdSlots.find((item) => item.id === slotId)
  if (!slot) {
    throw new Error('Platform ad slot not found')
  }

  Object.assign(slot, input, { updatedAt: nowIso() })
  return mockDelay(toPlatformAdSlotSummary(slot), 350)
}

export async function deletePlatformAdSlot(slotId: number): Promise<void> {
  await updatePlatformAdSlot(slotId, { status: 'INACTIVE' })
}

export async function createPlatformAd(input: CreatePlatformAdInput): Promise<PlatformAdSummary> {
  const created: Advertisement = {
    id: nextId(platformAds),
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

  platformAds = [created, ...platformAds]
  return mockDelay(toPlatformAdvertisementSummary(created), 350)
}

export async function updatePlatformAd(adId: number, input: UpdatePlatformAdInput): Promise<PlatformAdSummary> {
  const ad = platformAds.find((item) => item.id === adId)
  if (!ad) {
    throw new Error('Platform ad not found')
  }

  Object.assign(ad, input, { updatedAt: nowIso() })
  return mockDelay(toPlatformAdvertisementSummary(ad), 350)
}

export async function updatePlatformAdStatus(
  adId: number,
  status: Advertisement['status'],
): Promise<PlatformAdSummary> {
  return updatePlatformAd(adId, { status })
}
