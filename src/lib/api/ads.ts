import type { Advertisement } from '../../types'
import { mockDelay } from './mockClient'

const MOCK_ADS: Advertisement[] = [
  {
    id: 1,
    adSlotId: 1,
    advertiserName: '광고주명',
    exhibitorId: null,
    title: '박람회장 주변 편의 서비스를 소개합니다',
    imageUrl: '',
    linkUrl: '',
    startAt: '2026-01-01T00:00:00',
    endAt: '2026-12-31T23:59:59',
    price: 500000,
    status: 'ACTIVE',
    impressions: 0,
    clicks: 0,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  },
]

export async function getActiveAds(): Promise<Advertisement[]> {
  return mockDelay(MOCK_ADS.filter((ad) => ad.status === 'ACTIVE'))
}
