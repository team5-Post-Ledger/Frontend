export type Role = 'PLATFORM_ADMIN' | 'EXPO_ADMIN' | 'EXHIBITOR' | 'VISITOR' | 'ACCOUNTANT' | 'STAFF'

export type AccountStatus = 'INVITED' | 'ACTIVE'

export type ExhibitionStatus = 'DRAFT' | 'OPEN' | 'CLOSED'

export type ReservationStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'CHECKED_IN'

export type MovementMode = 'GROUP' | 'INDIVIDUAL'

export type ReservationSource = 'ONLINE' | 'ONSITE_MANUAL'

export type CheckinStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN'

export type AttendeeStatus = 'ACTIVE' | 'CANCELLED' | 'NO_SHOW'

export type PaymentStatus = 'READY' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export type PaymentGatewayProvider = 'TOSS' | 'PORTONE'

export type PgProvider = string

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR'

export type NameTagStatus = 'AVAILABLE' | 'ISSUED' | 'REVOKED'

export type CheckinMethod = 'QR_SELF' | 'MANUAL_SEARCH' | 'ONSITE_MANUAL' | 'WALK_IN' | 'REISSUE'

export type ScanPointType = 'BOOTH' | 'SESSION' | 'GATE'

export type StatScanPointType = 'BOOTH' | 'SESSION'

export type ScanType = 'ENTRY' | 'EXIT'

export type CloseReason = 'NORMAL_EXIT' | 'NEXT_ENTRY_AUTO' | 'TIMEOUT_AUTO' | 'ADMIN_MANUAL'

export type RouteStatus = 'CREATED' | 'EXPIRED' | 'DELETED'

export type AdSlotStatus = 'ACTIVE' | 'INACTIVE'

export type AdvertisementStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED'

export type SettlementStatus = 'PENDING' | 'CONFIRMED' | 'PAID_OUT'

export type EducationTargetRole = 'STAFF' | 'EXHIBITOR'

export type EducationGuideStatus = 'ACTIVE' | 'INACTIVE'
