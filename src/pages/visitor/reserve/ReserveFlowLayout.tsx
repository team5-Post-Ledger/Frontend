import { Outlet, useLocation } from 'react-router'
import { Stepper } from '../../../components/Stepper'

const STEPS = [
  { key: 'select', label: '박람회·슬롯 선택' },
  { key: 'attendees', label: '참석자 입력' },
  { key: 'confirm', label: '예약 확인' },
]

function getCurrentStep(pathname: string): number {
  if (pathname.endsWith('/confirm')) return 2
  if (pathname.endsWith('/attendees')) return 1
  return 0
}

export default function ReserveFlowLayout() {
  const location = useLocation()
  const currentStep = getCurrentStep(location.pathname)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 lg:py-10">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">예약하기</h1>
        <p className="mt-1 text-sm text-muted">박람회와 시간대, 티켓을 선택해 예약을 시작하세요.</p>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} />

      <Outlet />
    </div>
  )
}
