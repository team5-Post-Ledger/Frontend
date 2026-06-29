import type { Advertisement } from '../../types'
import { platformAdvertisementSeed } from '../mock/platformSeed'
import { mockDelay } from './mockClient'

const MOCK_ADS: Advertisement[] = platformAdvertisementSeed.map((ad) => ({ ...ad }))

export async function getActiveAds(): Promise<Advertisement[]> {
  return mockDelay(MOCK_ADS.filter((ad) => ad.status === 'ACTIVE'))
}
