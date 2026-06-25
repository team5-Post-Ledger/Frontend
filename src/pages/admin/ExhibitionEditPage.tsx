import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { DetailLayout } from '../../components/DetailLayout'
import { Field, fieldControlClass } from '../../components/Field'
import { useExhibition, useUpdateExhibition } from '../../features/exhibition/hooks'
import type { ExhibitionEditInput } from '../../lib/api/exhibitions'
import type { Exhibition, ExhibitionStatus } from '../../types'

const STATUS_OPTIONS: { value: ExhibitionStatus; label: string }[] = [
  { value: 'DRAFT', label: '준비중' },
  { value: 'OPEN', label: '진행중' },
  { value: 'CLOSED', label: '종료' },
]

const STATUS_BADGE_CLASS: Record<ExhibitionStatus, string> = {
  DRAFT: 'bg-warning text-white',
  OPEN: 'bg-live text-ink',
  CLOSED: 'bg-line text-muted',
}

interface ExhibitionEditFormState {
  title: string
  venue: string
  address: string
  startDate: string
  endDate: string
  status: ExhibitionStatus
  enforceStaffQualification: boolean
}

type ExhibitionEditFormErrors = Partial<Record<keyof ExhibitionEditFormState, string>>

function exhibitionToFormState(exhibition: Exhibition): ExhibitionEditFormState {
  return {
    title: exhibition.title,
    venue: exhibition.venue,
    address: exhibition.address,
    startDate: exhibition.startDate,
    endDate: exhibition.endDate,
    status: exhibition.status,
    enforceStaffQualification: exhibition.enforceStaffQualification,
  }
}

function ExhibitionEditForm({ exhibition, exhibitionId }: { exhibition: Exhibition; exhibitionId: number }) {
  const navigate = useNavigate()
  const updateMutation = useUpdateExhibition()

  const [form, setForm] = useState<ExhibitionEditFormState>(() => exhibitionToFormState(exhibition))
  const [errors, setErrors] = useState<ExhibitionEditFormErrors>({})

  function updateForm(patch: Partial<ExhibitionEditFormState>) {
    setForm((prev) => ({ ...prev, ...patch }))
    updateMutation.reset()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: ExhibitionEditFormErrors = {}
    if (!form.title.trim()) nextErrors.title = '행사명을 입력해주세요.'
    if (!form.venue.trim()) nextErrors.venue = '장소명을 입력해주세요.'
    if (!form.address.trim()) nextErrors.address = '주소를 입력해주세요.'
    if (!form.startDate) nextErrors.startDate = '시작일을 입력해주세요.'
    if (!form.endDate) nextErrors.endDate = '종료일을 입력해주세요.'
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      nextErrors.endDate = '종료일은 시작일과 같거나 이후여야 합니다.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const input: ExhibitionEditInput = {
      title: form.title.trim(),
      venue: form.venue.trim(),
      address: form.address.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      enforceStaffQualification: form.enforceStaffQualification,
    }

    updateMutation.mutate({ id: exhibitionId, input })
  }

  return (
    <DetailLayout
      title="행사 정보 수정"
      subtitle={exhibition.title}
      badge={
        <span className={`px-2.5 py-1 text-xs font-bold ${STATUS_BADGE_CLASS[exhibition.status]}`}>
          {STATUS_OPTIONS.find((option) => option.value === exhibition.status)?.label}
        </span>
      }
      attributes={[{ label: '슬러그', value: exhibition.slug }]}
    >
      <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
        <Field label="행사명" id="exhibition-title" required error={errors.title}>
          <input
            id="exhibition-title"
            value={form.title}
            onChange={(event) => updateForm({ title: event.target.value })}
            placeholder="예: 2026 서울 스마트팩토리 박람회"
            className={fieldControlClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="장소" id="exhibition-venue" required error={errors.venue}>
            <input
              id="exhibition-venue"
              value={form.venue}
              onChange={(event) => updateForm({ venue: event.target.value })}
              placeholder="예: 코엑스 1전시장"
              className={fieldControlClass}
            />
          </Field>
          <Field label="주소" id="exhibition-address" required error={errors.address}>
            <input
              id="exhibition-address"
              value={form.address}
              onChange={(event) => updateForm({ address: event.target.value })}
              placeholder="예: 서울특별시 강남구 영동대로 513"
              className={fieldControlClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="시작일" id="exhibition-start" required error={errors.startDate}>
            <input
              id="exhibition-start"
              type="date"
              value={form.startDate}
              onChange={(event) => updateForm({ startDate: event.target.value })}
              className={fieldControlClass}
            />
          </Field>
          <Field label="종료일" id="exhibition-end" required error={errors.endDate}>
            <input
              id="exhibition-end"
              type="date"
              value={form.endDate}
              onChange={(event) => updateForm({ endDate: event.target.value })}
              className={fieldControlClass}
            />
          </Field>
        </div>

        <Field label="상태" id="exhibition-status" required hint="DRAFT → OPEN 전환 시 방문자에게 노출됩니다.">
          <select
            id="exhibition-status"
            value={form.status}
            onChange={(event) => updateForm({ status: event.target.value as ExhibitionStatus })}
            className={fieldControlClass}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="border border-line p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.enforceStaffQualification}
              onChange={(event) => updateForm({ enforceStaffQualification: event.target.checked })}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">STAFF 자격 게이트 활성화</span>
              <span className="mt-0.5 block text-xs text-muted">
                {form.enforceStaffQualification
                  ? '필수 LMS 수료 STAFF만 체크인 가능합니다.'
                  : '미수료 STAFF도 체크인 화면에 접근 가능합니다(경고만 표시).'}
              </span>
            </span>
          </label>
        </div>

        {updateMutation.isSuccess && <p className="text-sm font-semibold text-success">변경사항이 저장되었습니다.</p>}
        {updateMutation.isError && <p className="text-sm text-danger">저장에 실패했습니다. 다시 시도해주세요.</p>}

        <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
          >
            {updateMutation.isPending && (
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
            )}
            저장
          </button>
        </div>
      </form>
    </DetailLayout>
  )
}

export default function ExhibitionEditPage() {
  const { id } = useParams<{ id: string }>()
  const exhibitionId = id ? Number(id) : null

  const exhibition = useExhibition(exhibitionId)

  if (exhibitionId === null) {
    return <p className="text-sm text-danger">잘못된 행사 ID입니다.</p>
  }

  if (exhibition.isLoading) {
    return <p className="text-sm text-muted">불러오는 중...</p>
  }

  if (exhibition.isError) {
    return <p className="text-sm text-danger">행사 정보를 불러오지 못했습니다.</p>
  }

  if (!exhibition.data) {
    return <p className="text-sm text-muted">해당 행사를 찾을 수 없습니다.</p>
  }

  return <ExhibitionEditForm key={exhibition.data.id} exhibition={exhibition.data} exhibitionId={exhibitionId} />
}
