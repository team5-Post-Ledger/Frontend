import { Navigate, Route, Routes } from 'react-router'
import BoothsPage from '../pages/admin/BoothsPage'
import CheckinHubPage from '../pages/admin/CheckinHubPage'
import ReservationsPage from '../pages/admin/ReservationsPage'
import StatsDashboardPage from '../pages/admin/StatsDashboardPage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import PrimitivesPreviewPage from '../pages/dev/PrimitivesPreviewPage'
import ExhibitionDetailPage from '../pages/visitor/ExhibitionDetailPage'
import HomePage from '../pages/visitor/HomePage'
import PayPage from '../pages/visitor/PayPage'
import ReserveAttendeesPage from '../pages/visitor/reserve/ReserveAttendeesPage'
import ReserveConfirmPage from '../pages/visitor/reserve/ReserveConfirmPage'
import ReserveFlowLayout from '../pages/visitor/reserve/ReserveFlowLayout'
import ReserveSelectPage from '../pages/visitor/reserve/ReserveSelectPage'
import { ProtectedRoute } from './guards/ProtectedRoute'
import { AdminLayout } from './layouts/AdminLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { MobileLayout } from './layouts/MobileLayout'
import { VisitorLayout } from './layouts/VisitorLayout'

function Stub({ label }: { label: string }) {
  return <p className="text-sm text-muted">{label}</p>
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route path="/403" element={<Stub label="접근 권한이 없습니다" />} />
      <Route path="/dev/primitives" element={<PrimitivesPreviewPage />} />

      <Route element={<VisitorLayout />}>
        <Route index element={<HomePage />} />
        <Route path="exhibitions" element={<Stub label="박람회 목록" />} />
        <Route path="exhibitions/:id" element={<ExhibitionDetailPage />} />
        <Route path="exhibitions/:id/*" element={<Stub label="박람회 하위" />} />

        <Route element={<ProtectedRoute roles={['VISITOR']} />}>
          <Route path="reserve" element={<ReserveFlowLayout />}>
            <Route index element={<ReserveSelectPage />} />
            <Route path="attendees" element={<ReserveAttendeesPage />} />
            <Route path="confirm" element={<ReserveConfirmPage />} />
          </Route>
          <Route path="pay" element={<PayPage />} />
          <Route path="my/*" element={<Stub label="내 정보" />} />
          <Route path="assistant" element={<Stub label="AI 동선 Q&A" />} />
        </Route>
      </Route>

      <Route element={<AdminLayout />}>
        <Route element={<ProtectedRoute roles={['EXPO_ADMIN']} />}>
          <Route path="admin/reservations" element={<ReservationsPage />} />
          <Route path="admin/booths" element={<BoothsPage />} />
          <Route path="admin/checkin" element={<CheckinHubPage />}>
            <Route index element={<Navigate to="qr" replace />} />
            <Route path="qr" element={<Stub label="QR 체크인 — 다음 PR에서 구현" />} />
            <Route path="manual" element={<Stub label="수기 체크인 — 다음 PR에서 구현" />} />
            <Route path="walk-in" element={<Stub label="워크인 등록 — 다음 PR에서 구현" />} />
            <Route path="onsite-payment" element={<Stub label="현장 결제 — 다음 PR에서 구현" />} />
          </Route>
          <Route path="admin/stats" element={<StatsDashboardPage />} />
          <Route path="admin/*" element={<Stub label="박람회 운영" />} />
        </Route>
        <Route element={<ProtectedRoute roles={['PLATFORM_ADMIN']} />}>
          <Route path="platform/*" element={<Stub label="플랫폼 관리" />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ACCOUNTANT']} />}>
          <Route path="settlements/*" element={<Stub label="정산" />} />
        </Route>
      </Route>

      <Route element={<MobileLayout />}>
        <Route element={<ProtectedRoute roles={['STAFF']} />}>
          <Route path="checkin/*" element={<Stub label="체크인" />} />
        </Route>
        <Route element={<ProtectedRoute roles={['EXHIBITOR']} />}>
          <Route path="scanner/*" element={<Stub label="스캐너" />} />
          <Route path="exhibitor/*" element={<Stub label="참가기업 리포트" />} />
        </Route>
        <Route element={<ProtectedRoute roles={['STAFF', 'EXHIBITOR']} />}>
          <Route path="education/*" element={<Stub label="교육" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
