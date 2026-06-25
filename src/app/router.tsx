import { Navigate, Route, Routes } from 'react-router'
import BoothsPage from '../pages/admin/BoothsPage'
import CheckinHubPage from '../pages/admin/CheckinHubPage'
import CheckinManualPage from '../pages/admin/CheckinManualPage'
import CheckinOnsitePaymentPage from '../pages/admin/CheckinOnsitePaymentPage'
import CheckinQrPage from '../pages/admin/CheckinQrPage'
import CheckinWalkInPage from '../pages/admin/CheckinWalkInPage'
import ExhibitionDashboardPage from '../pages/admin/ExhibitionDashboardPage'
import ExhibitionEditPage from '../pages/admin/ExhibitionEditPage'
import ExhibitorsPage from '../pages/admin/ExhibitorsPage'
import NameTagsPage from '../pages/admin/NameTagsPage'
import ReservationDetailPage from '../pages/admin/ReservationDetailPage'
import ReservationExportPage from '../pages/admin/ReservationExportPage'
import ReservationsPage from '../pages/admin/ReservationsPage'
import SessionsPage from '../pages/admin/SessionsPage'
import StaffPage from '../pages/admin/StaffPage'
import StatsDashboardPage from '../pages/admin/StatsDashboardPage'
import TicketTypesPage from '../pages/admin/TicketTypesPage'
import TimeSlotsPage from '../pages/admin/TimeSlotsPage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import PrimitivesPreviewPage from '../pages/dev/PrimitivesPreviewPage'
import AssistantPage from '../pages/visitor/AssistantPage'
import BoothDetailPage from '../pages/visitor/BoothDetailPage'
import BoothListPage from '../pages/visitor/BoothListPage'
import ExhibitionDetailPage from '../pages/visitor/ExhibitionDetailPage'
import ExhibitionListPage from '../pages/visitor/ExhibitionListPage'
import HomePage from '../pages/visitor/HomePage'
import MyReportPage from '../pages/visitor/my/MyReportPage'
import MyReservationDetailPage from '../pages/visitor/my/MyReservationDetailPage'
import MyReservationsPage from '../pages/visitor/my/MyReservationsPage'
import MyRouteDetailPage from '../pages/visitor/my/MyRouteDetailPage'
import MyRouteListPage from '../pages/visitor/my/MyRouteListPage'
import MyTabsLayout from '../pages/visitor/my/MyTabsLayout'
import MyTicketsPage from '../pages/visitor/my/MyTicketsPage'
import PayPage from '../pages/visitor/PayPage'
import ReserveAttendeesPage from '../pages/visitor/reserve/ReserveAttendeesPage'
import ReserveConfirmPage from '../pages/visitor/reserve/ReserveConfirmPage'
import ReserveFlowLayout from '../pages/visitor/reserve/ReserveFlowLayout'
import ReserveSelectPage from '../pages/visitor/reserve/ReserveSelectPage'
import { ProtectedRoute } from './guards/ProtectedRoute'
import { RequireCurrentExhibition } from './guards/RequireCurrentExhibition'
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
        <Route path="exhibitions" element={<ExhibitionListPage />} />
        <Route path="exhibitions/:id" element={<ExhibitionDetailPage />} />
        <Route path="exhibitions/:id/booths" element={<BoothListPage />} />
        <Route path="exhibitions/:id/booths/:boothId" element={<BoothDetailPage />} />

        <Route element={<ProtectedRoute roles={['VISITOR']} />}>
          <Route path="reserve" element={<ReserveFlowLayout />}>
            <Route index element={<ReserveSelectPage />} />
            <Route path="attendees" element={<ReserveAttendeesPage />} />
            <Route path="confirm" element={<ReserveConfirmPage />} />
          </Route>
          <Route path="pay" element={<PayPage />} />
          <Route path="my" element={<Navigate to="tickets" replace />} />
          <Route element={<MyTabsLayout />}>
            <Route path="my/reservations" element={<MyReservationsPage />} />
            <Route path="my/tickets" element={<MyTicketsPage />} />
          </Route>
          <Route path="my/reservations/:id" element={<MyReservationDetailPage />} />
          <Route path="my/reservations/:id/report" element={<MyReportPage />} />
          <Route path="my/route" element={<MyRouteListPage />} />
          <Route path="my/route/:routeId" element={<MyRouteDetailPage />} />
          <Route path="assistant" element={<AssistantPage />} />
        </Route>
      </Route>

      <Route element={<AdminLayout />}>
        <Route element={<ProtectedRoute roles={['EXPO_ADMIN']} />}>
          <Route path="admin/reservations" element={<ReservationsPage />} />
          <Route path="admin/reservations/:id" element={<ReservationDetailPage />} />
          <Route path="admin/booths" element={<BoothsPage />} />
          <Route path="admin/checkin" element={<CheckinHubPage />}>
            <Route index element={<Navigate to="qr" replace />} />
            <Route path="qr" element={<CheckinQrPage />} />
            <Route path="manual" element={<CheckinManualPage />} />
            <Route element={<RequireCurrentExhibition />}>
              <Route path="walk-in" element={<CheckinWalkInPage />} />
            </Route>
            <Route path="onsite-payment" element={<CheckinOnsitePaymentPage />} />
          </Route>
          <Route path="admin/exhibitions/:id/edit" element={<ExhibitionEditPage />} />
          <Route path="admin/exhibitions/:id" element={<ExhibitionDashboardPage />} />
          <Route path="admin/stats" element={<StatsDashboardPage />} />

          {/* 아래는 useCurrentExhibition()(admin이 고른 "현재 행사")에 의존하는 화면들 — 선택이
              없으면 RequireCurrentExhibition이 /admin(행사 선택, 다음 작업에서 피커로 교체 예정)으로
              보낸다. */}
          <Route element={<RequireCurrentExhibition />}>
            <Route path="admin/reservations/export" element={<ReservationExportPage />} />
            <Route path="admin/exhibitors" element={<ExhibitorsPage />} />
            <Route path="admin/staff" element={<StaffPage />} />
            <Route path="admin/nametags" element={<NameTagsPage />} />
            <Route path="admin/sessions" element={<SessionsPage />} />
            <Route path="admin/time-slots" element={<TimeSlotsPage />} />
            <Route path="admin/ticket-types" element={<TicketTypesPage />} />
          </Route>

          <Route path="admin/*" element={<Stub label="행사 선택 — 행사 선택 화면은 다음 작업에서 추가됩니다" />} />
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
