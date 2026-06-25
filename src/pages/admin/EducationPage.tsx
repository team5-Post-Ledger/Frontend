import { useNavigate } from 'react-router'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { useEducationGuides } from '../../features/education/hooks'
import type { EducationGuide } from '../../types'

function classifyGuideType(guide: EducationGuide): { label: string; className: string } {
  if (guide.quizQuestions && guide.quizQuestions.length > 0) {
    return { label: '영상+퀴즈', className: 'bg-primary text-white' }
  }
  if (guide.videoUrl) {
    return { label: '영상', className: 'bg-accent text-ink' }
  }
  return { label: '텍스트만', className: 'border border-line bg-white text-muted' }
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export default function EducationPage() {
  const navigate = useNavigate()
  const guides = useEducationGuides()

  const data = guides.data ?? []

  const columns: DataTableColumn<EducationGuide>[] = [
    { key: 'title', header: '제목', sortable: true },
    {
      key: 'type',
      header: '유형',
      render: (row) => {
        const type = classifyGuideType(row)
        return <span className={`px-2.5 py-1 text-[11px] font-bold ${type.className}`}>{type.label}</span>
      },
    },
    {
      key: 'isRequired',
      header: '필수 여부',
      align: 'center',
      render: (row) => (
        <span className={`px-2.5 py-1 text-[11px] font-bold ${row.isRequired ? 'bg-ink text-white' : 'bg-line text-muted'}`}>
          {row.isRequired ? '필수' : '선택'}
        </span>
      ),
    },
    {
      key: 'quizPassScore',
      header: '통과기준',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.quizPassScore ?? -1,
      render: (row) => (row.quizPassScore !== null ? `${row.quizPassScore}점` : '-'),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">LMS 관리</h1>
          <p className="mt-1 text-sm text-muted">
            STAFF·EXHIBITOR 교육 가이드를 관리합니다. 총 <b className="text-ink">{data.length.toLocaleString()}</b>건
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/education/new/edit')}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          <PlusIcon />
          새 가이드
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(row) => row.id}
        isLoading={guides.isLoading}
        isError={guides.isError}
        emptyMessage="등록된 가이드가 없습니다. 새 가이드를 추가해보세요."
        pageSize={10}
        onRowClick={(row) => navigate(`/admin/education/${row.id}/edit`)}
      />
    </div>
  )
}
