import { Outlet } from 'react-router'
import { ConsoleTopBar } from '../../components/ConsoleTopBar'
import { useAuthStore } from '../../stores/authStore'

export function AccountantLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  // 정산은 화면이 1개(정산 목록)뿐이라 네비 항목이 없다. 상단바는 브랜드 + 화면
  // 제목(contextSlot) + 유저 메뉴만 둔다.
  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <ConsoleTopBar
        homeTo="/settlements"
        consoleName="Accountant Console"
        contextSlot={
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold text-ink">정산 관리</div>
            <div className="mt-0.5 text-xs font-medium text-muted">
              박람회별 정산 내역을 확인하고 관리합니다.
            </div>
          </div>
        }
        user={{ name: user?.name, role: user?.role }}
        onLogout={logout}
        mainSiteHref="/"
      />

      <main className="min-w-0 flex-1 bg-surface p-6">
        <div className="min-h-full border border-line bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
