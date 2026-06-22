import { Navigate, Route, Routes } from 'react-router'
import StatsDashboardPage from '../pages/admin/StatsDashboardPage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
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

      <Route element={<VisitorLayout />}>
        <Route index element={<Stub label="홈" />} />
        <Route path="exhibitions/*" element={<Stub label="박람회" />} />

        <Route element={<ProtectedRoute roles={['VISITOR']} />}>
          <Route path="reserve/*" element={<Stub label="예약" />} />
          <Route path="pay" element={<Stub label="결제" />} />
          <Route path="my/*" element={<Stub label="내 정보" />} />
          <Route path="assistant" element={<Stub label="AI 동선 Q&A" />} />
        </Route>
      </Route>

      <Route element={<AdminLayout />}>
        <Route element={<ProtectedRoute roles={['EXPO_ADMIN']} />}>
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
