import { useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { DetailLayout } from '../../components/DetailLayout'
import { Field, fieldControlClass } from '../../components/Field'
import { Panel } from '../../components/Panel'
import { QRScanner } from '../../components/QRScanner'
import { Stepper, StepperNav } from '../../components/Stepper'
import type { MovementMode, ReservationSource, ReservationStatus } from '../../types'

interface MockReservationRow {
  id: number
  applicantName: string
  groupSize: number
  movementMode: MovementMode
  status: ReservationStatus
  reservationSource: ReservationSource
}

const MOCK_RESERVATIONS: MockReservationRow[] = [
  { id: 1042, applicantName: '김도현', groupSize: 1, movementMode: 'INDIVIDUAL', status: 'CHECKED_IN', reservationSource: 'ONLINE' },
  { id: 1041, applicantName: '이서연', groupSize: 4, movementMode: 'GROUP', status: 'PAID', reservationSource: 'ONLINE' },
  { id: 1040, applicantName: '박준영', groupSize: 2, movementMode: 'GROUP', status: 'PENDING', reservationSource: 'ONLINE' },
  { id: 1039, applicantName: '최유진', groupSize: 1, movementMode: 'INDIVIDUAL', status: 'CANCELLED', reservationSource: 'ONSITE_MANUAL' },
  { id: 1038, applicantName: '정민수', groupSize: 3, movementMode: 'GROUP', status: 'REFUNDED', reservationSource: 'ONLINE' },
  { id: 1037, applicantName: '한지우', groupSize: 1, movementMode: 'INDIVIDUAL', status: 'PAID', reservationSource: 'ONSITE_MANUAL' },
]

const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: '결제 대기',
  PAID: '결제 완료',
  CANCELLED: '취소',
  REFUNDED: '환불',
  CHECKED_IN: '체크인 완료',
}

const STATUS_BADGE_CLASS: Record<ReservationStatus, string> = {
  PENDING: 'bg-warning text-white',
  PAID: 'bg-primary text-white',
  CANCELLED: 'bg-line text-muted',
  REFUNDED: 'bg-danger text-white',
  CHECKED_IN: 'bg-live text-ink',
}

const MOVEMENT_LABEL: Record<MovementMode, string> = {
  GROUP: '단체',
  INDIVIDUAL: '개인',
}

const SOURCE_LABEL: Record<ReservationSource, string> = {
  ONLINE: '온라인',
  ONSITE_MANUAL: '현장 수기',
}

const STATUS_FILTERS: Array<{ key: ReservationStatus | 'ALL'; label: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'PENDING', label: '결제 대기' },
  { key: 'PAID', label: '결제 완료' },
  { key: 'CHECKED_IN', label: '체크인 완료' },
  { key: 'CANCELLED', label: '취소' },
  { key: 'REFUNDED', label: '환불' },
]

function DataTableDemo() {
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>('ALL')

  const filtered = statusFilter === 'ALL' ? MOCK_RESERVATIONS : MOCK_RESERVATIONS.filter((row) => row.status === statusFilter)

  const columns: DataTableColumn<MockReservationRow>[] = [
    { key: 'id', header: '예약번호', sortable: true, render: (row) => `#${row.id}` },
    { key: 'applicantName', header: '예약자', sortable: true },
    { key: 'groupSize', header: '인원', align: 'right', sortable: true, render: (row) => `${row.groupSize}명` },
    { key: 'movementMode', header: '이동방식', render: (row) => MOVEMENT_LABEL[row.movementMode] },
    {
      key: 'status',
      header: '상태',
      sortable: true,
      render: (row) => <span className={`px-2.5 py-1 text-xs font-bold ${STATUS_BADGE_CLASS[row.status]}`}>{STATUS_LABEL[row.status]}</span>,
    },
    { key: 'reservationSource', header: '예약경로', render: (row) => SOURCE_LABEL[row.reservationSource] },
  ]

  return (
    <DataTable
      columns={columns}
      data={filtered}
      rowKey={(row) => row.id}
      pageSize={4}
      emptyMessage="조건에 맞는 예약이 없습니다."
      toolbar={
        <>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`px-3 py-1.5 text-sm font-semibold ${
                statusFilter === filter.key ? 'bg-primary text-white' : 'border border-line text-muted hover:text-ink'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </>
      }
    />
  )
}

function DetailLayoutDemo() {
  return (
    <DetailLayout
      title="AI Factory"
      subtitle="부스 #12 · 1전시장 2층"
      badge={<span className="bg-live px-2.5 py-1 text-xs font-bold text-ink">전시중</span>}
      actions={
        <button type="button" className="border border-line px-4 py-2 text-sm font-semibold text-muted hover:text-ink">
          정보 수정
        </button>
      }
      attributes={[
        { label: '참가기업', value: '(주)팩토리에이아이' },
        { label: '카테고리', value: '스마트팩토리' },
        { label: '위치', value: '1전시장 2층 A-12' },
        { label: '태그', value: 'AI · 로보틱스 · IoT' },
      ]}
    >
      <Panel title="부스 소개">
        <p className="text-sm leading-relaxed text-ink">
          제조 현장의 데이터를 실시간으로 분석해 불량을 예측하는 AI 솔루션을 시연합니다. 현장에서 직접 데모를 체험할 수 있습니다.
        </p>
      </Panel>
      <Panel title="누적 방문" subtitle="이번 행사 기준">
        <div className="flex items-baseline gap-1 text-2xl font-extrabold text-ink">
          482<span className="text-sm font-semibold text-muted">명</span>
        </div>
      </Panel>
    </DetailLayout>
  )
}

const MOCK_TIME_SLOTS = ['09:00 – 11:00', '13:00 – 15:00', '15:00 – 17:00']

function StepperDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isDone, setIsDone] = useState(false)

  const steps = [
    { key: 'schedule', label: '일정 선택' },
    { key: 'attendee', label: '참석자 정보' },
    { key: 'confirm', label: '확인' },
  ]

  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-sm font-bold text-ink">예약이 접수되었습니다.</p>
        <p className="text-xs text-muted">
          {selectedSlot} · {name} ({phone || '연락처 미입력'})
        </p>
        <button type="button" onClick={() => { setIsDone(false); setCurrentStep(0); setSelectedSlot(null); setName(''); setPhone('') }} className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover">
          다시 보기
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Stepper steps={steps} currentStep={currentStep} />

      {currentStep === 0 && (
        <div className="flex flex-col gap-2">
          {MOCK_TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className={`border px-4 py-3 text-left text-sm font-semibold ${
                selectedSlot === slot ? 'border-primary bg-primary/5 text-primary' : 'border-line text-ink hover:border-accent'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      )}

      {currentStep === 1 && (
        <div className="flex flex-col gap-4">
          <Field label="이름" id="stepper-demo-name" required>
            <input id="stepper-demo-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="홍길동" className={fieldControlClass} />
          </Field>
          <Field label="전화번호" id="stepper-demo-phone" hint="선택 항목입니다.">
            <input id="stepper-demo-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="010-0000-0000" className={fieldControlClass} />
          </Field>
        </div>
      )}

      {currentStep === 2 && (
        <dl className="flex flex-col gap-2 border border-line p-4">
          <div className="flex justify-between text-sm">
            <dt className="text-muted">일정</dt>
            <dd className="font-semibold text-ink">{selectedSlot}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-muted">참석자</dt>
            <dd className="font-semibold text-ink">{name}</dd>
          </div>
        </dl>
      )}

      <StepperNav
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === steps.length - 1}
        isNextDisabled={(currentStep === 0 && !selectedSlot) || (currentStep === 1 && !name.trim())}
        onPrev={() => setCurrentStep((step) => Math.max(0, step - 1))}
        onNext={() => (currentStep === steps.length - 1 ? setIsDone(true) : setCurrentStep((step) => step + 1))}
      />
    </div>
  )
}

const MOCK_NAMETAG_LOOKUP: Record<string, { name: string; checkinStatus: string }> = {
  'MOCK-QR-TOKEN-0001': { name: '김도현', checkinStatus: '체크인 완료' },
}

function QRScannerDemo() {
  const [isPaused, setIsPaused] = useState(false)
  const [scanResult, setScanResult] = useState<{ name: string; checkinStatus: string } | null>(null)

  function handleScan(decodedText: string) {
    setScanResult(MOCK_NAMETAG_LOOKUP[decodedText] ?? { name: '알 수 없는 코드', checkinStatus: decodedText })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-[320px]">
        <QRScanner onScan={handleScan} isPaused={isPaused} />
      </div>

      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={() => setIsPaused((value) => !value)} className="border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink">
          {isPaused ? '스캔 재개' : '스캔 일시정지'}
        </button>
        <button type="button" onClick={() => handleScan('MOCK-QR-TOKEN-0001')} className="bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
          테스트용 스캔 시뮬레이션
        </button>
      </div>

      {scanResult && (
        <div className="border border-line bg-surface px-4 py-3 text-center text-sm">
          <span className="font-semibold text-ink">{scanResult.name}</span>
          <span className="ml-2 text-muted">· {scanResult.checkinStatus}</span>
        </div>
      )}
    </div>
  )
}

export default function PrimitivesPreviewPage() {
  return (
    <div className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">프리미티브 미리보기</h1>
          <p className="mt-1 text-sm text-muted">목 데이터로 동작을 확인하기 위한 임시 페이지입니다. 실제 화면 구현 시 삭제해도 됩니다.</p>
        </div>

        <Panel title="DataTable" subtitle="정렬 · 필터바 · 페이지네이션">
          <DataTableDemo />
        </Panel>

        <Panel title="DetailLayout" subtitle="헤더 · 속성 리스트 · 섹션(Panel 재사용)">
          <DetailLayoutDemo />
        </Panel>

        <Panel title="Stepper" subtitle="다단계 위저드 (Field 함께 사용)">
          <StepperDemo />
        </Panel>

        <Panel title="QRScanner" subtitle="html5-qrcode 래퍼 — 실제 카메라 권한이 필요합니다">
          <QRScannerDemo />
        </Panel>
      </div>
    </div>
  )
}
