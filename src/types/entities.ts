import type {
  AdSlotStatus,
  AdvertisementStatus,
  AttendeeStatus,
  CheckinMethod,
  CheckinStatus,
  CloseReason,
  EducationGuideStatus,
  EducationTargetRole,
  ExhibitionStatus,
  MovementMode,
  NameTagStatus,
  PaymentStatus,
  PgProvider,
  ReservationSource,
  ReservationStatus,
  Role,
  RouteStatus,
  ScanPointType,
  ScanType,
  SettlementStatus,
  StatScanPointType,
} from './enums'

export interface User {
  id: number
  email: string
  name: string
  phone: string | null
  role: Role
  deletedAt: string | null
}

export interface Exhibition {
  id: number
  title: string
  slug: string
  venue: string
  address: string
  floorMapMeta: Record<string, unknown> | null
  startDate: string
  endDate: string
  status: ExhibitionStatus
  enforceStaffQualification: boolean
  createdBy: number
  deletedAt: string | null
  bannerImageUrl: string | null
}

export interface ExhibitionAdmin {
  id: number
  exhibitionId: number
  userId: number
  createdAt: string
  updatedAt: string
}

export interface ExhibitionStaff {
  id: number
  exhibitionId: number
  userId: number
  createdAt: string
  updatedAt: string
}

export interface Exhibitor {
  id: number
  exhibitionId: number
  companyName: string
  intro: string
  website: string | null
  accountUserId: number | null
}

export interface BoothCategory {
  id: number
  exhibitionId: number
  name: string
}

export interface Booth {
  id: number
  exhibitionId: number
  exhibitorId: number
  categoryId: number | null
  name: string
  description: string
  tags: string[]
  posX: number
  posY: number
  floor: number
}

export interface Session {
  id: number
  exhibitionId: number
  hostExhibitorId: number | null
  title: string
  description: string
  location: string
  startAt: string
  endAt: string
  capacity: number
}

export interface TimeSlot {
  id: number
  exhibitionId: number
  startAt: string
  endAt: string
  capacity: number
  reservedCount: number
}

export interface TicketType {
  id: number
  exhibitionId: number
  name: string
  price: number
  quota: number
}

export interface Reservation {
  id: number
  userId: number
  exhibitionId: number
  timeSlotId: number | null
  ticketTypeId: number | null
  movementMode: MovementMode
  groupSize: number
  status: ReservationStatus
  reservationSource: ReservationSource
  deletedAt: string | null
}

export interface ReservationAttendee {
  id: number
  reservationId: number
  exhibitionId: number
  linkedUserId: number | null
  name: string
  phone: string | null
  email: string | null
  isGroupLeader: boolean
  ticketQrToken: string | null
  checkinStatus: CheckinStatus
  attendeeStatus: AttendeeStatus
  checkedInAt: string | null
  deletedAt: string | null
}

export interface Payment {
  id: number
  reservationId: number
  pgProvider: PgProvider
  pgTxId: string
  amount: number
  feeAmount: number
  status: PaymentStatus
  paidAt: string | null
  deletedAt: string | null
}

export interface NameTag {
  id: number
  exhibitionId: number
  attendeeId: number | null
  token: string
  status: NameTagStatus
  issuedByUserId: number | null
  issuedAt: string | null
}

export interface CheckinLog {
  id: number
  exhibitionId: number
  reservationId: number
  attendeeId: number
  nameTagId: number | null
  checkinMethod: CheckinMethod
  checkedInByUserId: number
  checkedInAt: string
  memo: string | null
}

export interface VisitLog {
  id: number
  exhibitionId: number
  attendeeId: number
  nameTagId: number
  scanPointType: ScanPointType
  scanPointId: number | null
  scanType: ScanType
  headCount: number
  scannedByUserId: number | null
  isManual: boolean
  isAutoExit: boolean
  scannedAt: string
}

export interface VisitDwell {
  id: number
  exhibitionId: number
  attendeeId: number
  scanPointType: StatScanPointType
  scanPointId: number
  entryAt: string
  exitAt: string | null
  dwellSeconds: number
  headCount: number
  isEstimated: boolean
  closeReason: CloseReason
}

export interface StatVisitPoint {
  id: number
  exhibitionId: number
  scanPointType: StatScanPointType
  scanPointId: number
  statDate: string
  statHour: number
  visitCount: number
  visitorCount: number
  uniqueAttendee: number
  sumDwellSec: number
  dwellCount: number
  avgDwellSec: number
}

export interface StatCongestionHourly {
  id: number
  exhibitionId: number
  statDate: string
  statHour: number
  headCount: number
}

export interface UserPreference {
  id: number
  userId: number
  exhibitionId: number
  interestTags: string
  availableMinutes: number
  mustVisitBoothIds: number[]
  createdAt: string
  updatedAt: string
}

export interface RecommendedRoute {
  id: number
  userId: number
  exhibitionId: number
  preferenceId: number | null
  rationale: string
  totalEstMinutes: number
  routeStatus: RouteStatus
  createdAt: string
  updatedAt: string
}

export interface RouteStop {
  id: number
  routeId: number
  boothId: number
  visitOrder: number
  estMinutes: number
  reason: string
  congestionSnapshot: number | null
  createdAt: string
  updatedAt: string
}

export interface BoothEmbedding {
  id: number
  boothId: number
  embedding: number[]
  model: string
  sourceHash: string
  updatedAt: string
}

export interface AdSlot {
  id: number
  exhibitionId: number | null
  placement: string
  basePrice: number
  status: AdSlotStatus
  createdAt: string
  updatedAt: string
}

export interface Advertisement {
  id: number
  adSlotId: number
  advertiserName: string
  exhibitorId: number | null
  title: string
  imageUrl: string
  linkUrl: string
  startAt: string
  endAt: string
  price: number
  status: AdvertisementStatus
  impressions: number
  clicks: number
  createdAt: string
  updatedAt: string
}

export interface Settlement {
  id: number
  exhibitionId: number
  periodStart: string
  periodEnd: string
  grossAmount: number
  onlineAmount: number
  onsiteAmount: number
  feeAmount: number
  adRevenue: number
  netPayout: number
  status: SettlementStatus
  generatedAt: string
  paidOutAt: string | null
}

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number
}

export type QuizQuestionPublic = Omit<QuizQuestion, 'answer'>

export interface EducationGuide {
  id: number
  exhibitionId: number | null
  targetRole: EducationTargetRole
  category: string
  title: string
  content: string
  videoUrl: string | null
  isRequired: boolean
  sortOrder: number
  quizQuestions: QuizQuestion[] | null
  quizPassScore: number | null
  status: EducationGuideStatus
}

export type EducationGuidePublic = Omit<EducationGuide, 'quizQuestions'> & {
  quizQuestions: QuizQuestionPublic[] | null
}

export interface EducationCompletion {
  id: number
  guideId: number
  userId: number
  videoCompleted: boolean
  quizScore: number | null
  passed: boolean
  confirmedAt: string
}
