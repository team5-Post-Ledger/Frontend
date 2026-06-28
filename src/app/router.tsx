import { Navigate, Route, Routes } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import BoothsPage from '../pages/admin/BoothsPage'
import CheckinHubPage from '../pages/admin/CheckinHubPage'
import CheckinManualPage from '../pages/admin/CheckinManualPage'
import CheckinOnsitePaymentPage from '../pages/admin/CheckinOnsitePaymentPage'
import CheckinQrPage from '../pages/admin/CheckinQrPage'
import CheckinWalkInPage from '../pages/admin/CheckinWalkInPage'
import EducationEditPage from '../pages/admin/EducationEditPage'
import EducationPage from '../pages/admin/EducationPage'
import ExhibitionDashboardPage from '../pages/admin/ExhibitionDashboardPage'
import ExhibitionEditPage from '../pages/admin/ExhibitionEditPage'
import ExhibitionPickerPage from '../pages/admin/ExhibitionPickerPage'
import ExhibitorsPage from '../pages/admin/ExhibitorsPage'
import NameTagsPage from '../pages/admin/NameTagsPage'
import ReservationDetailPage from '../pages/admin/ReservationDetailPage'
import ReservationExportPage from '../pages/admin/ReservationExportPage'
import ReservationsPage from '../pages/admin/ReservationsPage'
import SessionsPage from '../pages/admin/SessionsPage'
import StaffPage from '../pages/admin/StaffPage'
import StatsDashboardPage from '../pages/admin/StatsDashboardPage'
import StatsFlowPage from '../pages/admin/StatsFlowPage'
import TicketTypesPage from '../pages/admin/TicketTypesPage'
import TimeSlotsPage from '../pages/admin/TimeSlotsPage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import PrimitivesPreviewPage from '../pages/dev/PrimitivesPreviewPage'
import PlatformAdminsPage from '../pages/platform/PlatformAdminsPage'
import PlatformExhibitionDetailPage from '../pages/platform/PlatformExhibitionDetailPage'
import PlatformExhibitionsPage from '../pages/platform/PlatformExhibitionsPage'
import PlatformStubPage from '../pages/platform/PlatformStubPage'
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
import StaffCheckinHomePage from '../pages/staff/CheckinHomePage'
import StaffCheckinHubPage from '../pages/staff/CheckinHubPage'
import StaffCheckinStatusPage from '../pages/staff/CheckinStatusPage'
import StaffCheckinManualPage from '../pages/staff/CheckinManualPage'
import StaffCheckinOnsitePaymentPage from '../pages/staff/CheckinOnsitePaymentPage'
import StaffCheckinQrPage from '../pages/staff/CheckinQrPage'
import StaffCheckinWalkInPage from '../pages/staff/CheckinWalkInPage'
import EducationListPage from '../pages/staff/EducationListPage'
import EducationDetailPage from '../pages/staff/EducationDetailPage'
import QuizPage from '../pages/staff/QuizPage'
import ProgressPage from '../pages/staff/ProgressPage'
import { ProtectedRoute } from './guards/ProtectedRoute'
import { RequireCurrentExhibition } from './guards/RequireCurrentExhibition'
import { RequireStaffExhibition } from './guards/RequireStaffExhibition'
import { AdminLayout } from './layouts/AdminLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { MobileLayout } from './layouts/MobileLayout'
import { PlatformLayout } from './layouts/PlatformLayout'
import { StaffLayout } from './layouts/StaffLayout'
import { VisitorLayout } from './layouts/VisitorLayout'

function Stub({ label }: { label: string }) {
  return <p className="text-sm text-muted">{label}</p>
}

// STAFF·EXHIBITOR 공유 교육 화면용 셸 — ProtectedRoute 통과 후 역할에 맞는 레이아웃을 고른다.
function EducationShell() {
  const role = useAuthStore((s) => s.user?.role)
  if (role === 'STAFF') return <StaffLayout />
  // TODO: ExhibitorLayout 도입 시 MobileLayout → ExhibitorLayout으로 교체
  if (role === 'EXHIBITOR') return <MobileLayout />
  return <Navigate to="/403" replace />
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
          <Route path="my" element={<Navigate to="reservations" replace />} />
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
          <Route path="admin" element={<ExhibitionPickerPage />} />
          <Route path="admin/exhibitions/:id/edit" element={<ExhibitionEditPage />} />
          <Route path="admin/exhibitions/:id" element={<ExhibitionDashboardPage />} />
          <Route path="admin/education" element={<EducationPage />} />
          <Route path="admin/education/:id/edit" element={<EducationEditPage />} />

          {/* 아래는 useCurrentExhibition()(admin이 고른 "현재 행사")에 의존하는 화면들 — 선택이
              없으면 RequireCurrentExhibition이 /admin(담당 행사 선택, ExhibitionPickerPage)으로
              보낸다. */}
          <Route element={<RequireCurrentExhibition />}>
            <Route path="admin/reservations" element={<ReservationsPage />} />
            <Route path="admin/reservations/:id" element={<ReservationDetailPage />} />
            <Route path="admin/reservations/export" element={<ReservationExportPage />} />
            <Route path="admin/booths" element={<BoothsPage />} />
            <Route path="admin/exhibitors" element={<ExhibitorsPage />} />
            <Route path="admin/checkin" element={<CheckinHubPage />}>
              <Route index element={<Navigate to="qr" replace />} />
              <Route path="qr" element={<CheckinQrPage />} />
              <Route path="manual" element={<CheckinManualPage />} />
              <Route path="walk-in" element={<CheckinWalkInPage />} />
              <Route path="onsite-payment" element={<CheckinOnsitePaymentPage />} />
            </Route>
            <Route path="admin/staff" element={<StaffPage />} />
            <Route path="admin/nametags" element={<NameTagsPage />} />
            <Route path="admin/sessions" element={<SessionsPage />} />
            <Route path="admin/time-slots" element={<TimeSlotsPage />} />
            <Route path="admin/ticket-types" element={<TicketTypesPage />} />
            <Route path="admin/stats" element={<StatsDashboardPage />} />
            <Route path="admin/stats/flow" element={<StatsFlowPage />} />
          </Route>

          <Route path="admin/*" element={<Stub label="이 화면은 아직 준비 중입니다" />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ACCOUNTANT']} />}>
          <Route path="settlements/*" element={<Stub label="정산" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['PLATFORM_ADMIN']} />}>
        <Route element={<PlatformLayout />}>
          <Route path="platform" element={<Navigate to="/platform/exhibitions" replace />} />
          <Route path="platform/exhibitions" element={<PlatformExhibitionsPage />} />
          <Route path="platform/exhibitions/:id" element={<PlatformExhibitionDetailPage />} />
          <Route path="platform/admins" element={<PlatformAdminsPage />} />
          <Route path="platform/accountants" element={<PlatformStubPage kind="accountants" />} />
          <Route path="platform/ads" element={<PlatformStubPage kind="ads" />} />
          <Route path="platform/stats" element={<PlatformStubPage kind="stats" />} />
          <Route path="platform/*" element={<Navigate to="/platform/exhibitions" replace />} />
        </Route>
      </Route>

      {/* STAFF 전용 모바일 셸 — 하단 3탭(체크인·교육·자격) */}
      <Route element={<StaffLayout />}>
        <Route element={<ProtectedRoute roles={['STAFF']} />}>
          {/* /checkin index → CheckinHomePage(피커 겸 홈, 로고 목적지).
              /checkin/* → StaffCheckinHubPage(4탭 셸)가 pathless 레이아웃으로 감싼다.
              탭(체크인 NAV 항목)은 /checkin/qr 직행; 로고=홈, 탭=허브로 목적지 분리. */}
          <Route path="checkin">
            <Route index element={<StaffCheckinHomePage />} />
            <Route element={<StaffCheckinHubPage />}>
              <Route path="qr" element={<StaffCheckinQrPage />} />
              <Route path="manual" element={<StaffCheckinManualPage />} />
              <Route path="onsite-payment" element={<StaffCheckinOnsitePaymentPage />} />
              <Route path="walk-in" element={<StaffCheckinWalkInPage />} />
            </Route>
          </Route>
          {/* 팀 체크인 현황 — 허브 밖 독립 라우트, 행사 선택 필요 */}
          <Route element={<RequireStaffExhibition />}>
            <Route path="checkin/reservations/:id/status" element={<StaffCheckinStatusPage />} />
          </Route>
        </Route>
      </Route>

      {/* EXHIBITOR 전용 모바일 셸 */}
      <Route element={<MobileLayout />}>
        <Route element={<ProtectedRoute roles={['EXHIBITOR']} />}>
          <Route path="scanner/*" element={<Stub label="스캐너" />} />
          <Route path="exhibitor/*" element={<Stub label="참가기업 리포트" />} />
        </Route>
      </Route>

      {/* STAFF·EXHIBITOR 공유 교육 — EducationShell이 역할별 셸 선택 (§6.7, §3.8) */}
      <Route element={<ProtectedRoute roles={['STAFF', 'EXHIBITOR']} />}>
        <Route element={<EducationShell />}>
          <Route path="education" element={<EducationListPage />} />
          <Route path="education/progress" element={<ProgressPage />} />
          <Route path="education/:id" element={<EducationDetailPage />} />
          <Route path="education/:id/quiz" element={<QuizPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
