import type { Advertisement, Exhibition, User } from '../../types'
import { mockDelay } from '../../lib/api/mockClient'

export interface PlatformExhibitionSummary extends Exhibition {
  adminCount: number
  accountantCount: number
}

export interface PlatformUserSummary extends User {
  assignedExhibitionIds: number[]
  active: boolean
}

export interface PlatformAdSummary extends Advertisement {
  placement: string
  exhibitionTitle: string | null
}

export interface PlatformStatsOverview {
  exhibitionCount: number
  openExhibitionCount: number
  grossAmount: number
  visitorCount: number
  adRevenue: number
}

const PLATFORM_EXHIBITIONS: PlatformExhibitionSummary[] = [
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
    accountantCount: 1,
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
    accountantCount: 0,
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
    accountantCount: 1,
  },
]

const PLATFORM_ADMINS: PlatformUserSummary[] = [
  {
    id: 2,
    email: 'admin@fairpilot.io',
    name: '김운영',
    phone: '010-2222-2222',
    role: 'EXPO_ADMIN',
    deletedAt: null,
    assignedExhibitionIds: [1, 13],
    active: true,
  },
  {
    id: 7,
    email: 'expo.sea@fairpilot.io',
    name: '정바다',
    phone: '010-7777-7777',
    role: 'EXPO_ADMIN',
    deletedAt: null,
    assignedExhibitionIds: [12],
    active: true,
  },
  {
    id: 8,
    email: 'expo.pending@fairpilot.io',
    name: '오미배정',
    phone: null,
    role: 'EXPO_ADMIN',
    deletedAt: null,
    assignedExhibitionIds: [],
    active: false,
  },
]

const PLATFORM_ACCOUNTANTS: PlatformUserSummary[] = [
  {
    id: 4,
    email: 'accountant@fairpilot.io',
    name: '이회계',
    phone: null,
    role: 'ACCOUNTANT',
    deletedAt: null,
    assignedExhibitionIds: [1],
    active: true,
  },
  {
    id: 9,
    email: 'settlement@fairpilot.io',
    name: '박정산',
    phone: '010-9999-9999',
    role: 'ACCOUNTANT',
    deletedAt: null,
    assignedExhibitionIds: [],
    active: true,
  },
  {
    id: 10,
    email: 'accounting.closed@fairpilot.io',
    name: '최마감',
    phone: '010-1010-1010',
    role: 'ACCOUNTANT',
    deletedAt: null,
    assignedExhibitionIds: [],
    active: false,
  },
]

const PLATFORM_ADS: PlatformAdSummary[] = [
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
    placement: 'HOME_TOP',
    exhibitionTitle: null,
  },
]

const PLATFORM_STATS: PlatformStatsOverview = {
  exhibitionCount: 2,
  openExhibitionCount: 1,
  grossAmount: 28400000,
  visitorCount: 12640,
  adRevenue: 1200000,
}

export async function listPlatformExhibitions(options: { fail?: boolean } = {}): Promise<PlatformExhibitionSummary[]> {
  if (options.fail) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Failed to load platform exhibitions')), 400)
    })
  }

  return mockDelay(PLATFORM_EXHIBITIONS, 500)
}

export async function getPlatformExhibition(id: number): Promise<PlatformExhibitionSummary | null> {
  return mockDelay(PLATFORM_EXHIBITIONS.find((exhibition) => exhibition.id === id) ?? null, 450)
}

export async function listPlatformExhibitionAdmins(exhibitionId: number): Promise<PlatformUserSummary[]> {
  return mockDelay(
    PLATFORM_ADMINS.filter(
      (admin) => admin.role === 'EXPO_ADMIN' && admin.assignedExhibitionIds.includes(exhibitionId),
    ),
    450,
  )
}

export async function listPlatformAdmins(): Promise<PlatformUserSummary[]> {
  return mockDelay(
    PLATFORM_ADMINS.filter((admin) => admin.role === 'EXPO_ADMIN'),
    500,
  )
}

export async function listPlatformAccountants(): Promise<PlatformUserSummary[]> {
  return mockDelay(
    PLATFORM_ACCOUNTANTS.filter((accountant) => accountant.role === 'ACCOUNTANT'),
    500,
  )
}

export async function listPlatformAds(): Promise<PlatformAdSummary[]> {
  return mockDelay(PLATFORM_ADS)
}

export async function getPlatformStatsOverview(): Promise<PlatformStatsOverview> {
  return mockDelay(PLATFORM_STATS)
}
