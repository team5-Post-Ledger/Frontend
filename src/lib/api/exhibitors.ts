import type { Exhibitor } from '../../types'
import { mockDelay } from './mockClient'

const MOCK_EXHIBITORS: Exhibitor[] = [
  { id: 1, exhibitionId: 1, companyName: '㈜테크노바', intro: '실시간 머신비전 및 AI 추론 솔루션을 개발합니다.', website: null, accountUserId: 101 },
  { id: 2, exhibitionId: 1, companyName: '스마트로보㈜', intro: '협동로봇 및 자동화 라인을 공급합니다.', website: null, accountUserId: 102 },
  { id: 3, exhibitionId: 1, companyName: '클라우드웍스', intro: '엔터프라이즈 클라우드 인프라 솔루션을 제공합니다.', website: null, accountUserId: 103 },
  { id: 4, exhibitionId: 1, companyName: '데이터브릿지㈜', intro: '데이터 파이프라인 및 분석 플랫폼을 운영합니다.', website: null, accountUserId: 104 },
  { id: 5, exhibitionId: 1, companyName: '엣지센서랩', intro: 'IoT 엣지 디바이스와 센서 네트워크를 제조합니다.', website: null, accountUserId: 105 },
  { id: 6, exhibitionId: 1, companyName: '핀테크온㈜', intro: '결제·정산 API 플랫폼을 운영합니다.', website: null, accountUserId: 106 },
  { id: 7, exhibitionId: 3, companyName: '㈜쿡로보', intro: '조리 자동화 로봇과 무인 조리 솔루션을 개발합니다.', website: null, accountUserId: 201 },
  { id: 8, exhibitionId: 3, companyName: '프레시체인㈜', intro: '신선식품 저온유통(콜드체인) 솔루션을 제공합니다.', website: null, accountUserId: 202 },
  { id: 9, exhibitionId: 3, companyName: '대체식품랩', intro: '식물성 대체육 및 배양식품을 연구·생산합니다.', website: null, accountUserId: 203 },
  { id: 10, exhibitionId: 3, companyName: '스마트키친웍스', intro: '스마트 주방기기와 IoT 조리 디바이스를 공급합니다.', website: null, accountUserId: 204 },
  { id: 11, exhibitionId: 3, companyName: '푸드테크에이아이', intro: 'AI 기반 메뉴 추천 및 푸드 매칭 서비스를 운영합니다.', website: null, accountUserId: 205 },
  { id: 12, exhibitionId: 3, companyName: '그린패키징㈜', intro: '식품용 친환경 포장재 및 라벨을 생산합니다.', website: null, accountUserId: 206 },
]

export async function getExhibitors(): Promise<Exhibitor[]> {
  return mockDelay(MOCK_EXHIBITORS)
}
