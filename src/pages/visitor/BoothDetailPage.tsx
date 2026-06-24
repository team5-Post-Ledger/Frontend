import { Link, useParams } from 'react-router'
import { DetailLayout } from '../../components/DetailLayout'
import { useBoothsByExhibition } from '../../features/booth/hooks'
import { useExhibitors } from '../../features/exhibitor/hooks'

export default function BoothDetailPage() {
  const { id, boothId } = useParams<{ id: string; boothId: string }>()
  const exhibitionId = id ? Number(id) : null
  const boothIdNum = boothId ? Number(boothId) : null

  const booths = useBoothsByExhibition(exhibitionId)
  const exhibitors = useExhibitors()

  if (exhibitionId === null || boothIdNum === null) {
    return <p className="p-6 text-sm text-danger">잘못된 부스 경로입니다.</p>
  }

  if (booths.isLoading) {
    return <p className="p-6 text-sm text-muted">불러오는 중...</p>
  }

  const booth = booths.data?.find((item) => item.id === boothIdNum)

  if (booths.isError || !booth) {
    return (
      <div className="p-6">
        <p className="text-sm text-danger">부스를 찾을 수 없습니다.</p>
        <Link to={`/exhibitions/${exhibitionId}/booths`} className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
          부스 목록으로 →
        </Link>
      </div>
    )
  }

  const exhibitor = exhibitors.data?.find((item) => item.id === booth.exhibitorId)

  return (
    <div className="p-5 lg:p-8">
      <Link
        to={`/exhibitions/${exhibitionId}/booths`}
        className="mb-4 inline-block text-xs font-semibold text-muted transition-colors hover:text-primary"
      >
        ← 부스 목록
      </Link>

      <DetailLayout
        title={booth.name}
        subtitle={booth.description}
        attributes={[
          { label: '위치', value: `${booth.floor}F · (${booth.posX}, ${booth.posY})` },
          {
            label: '태그',
            value:
              booth.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {booth.tags.map((tag) => (
                    <span key={tag} className="bg-surface px-1.5 py-0.5 text-[10.5px] text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                '-'
              ),
          },
          { label: '참가기업', value: exhibitor?.companyName ?? '-' },
        ]}
      >
        {exhibitor && (
          <div className="border border-line bg-white p-4">
            <div className="mb-1 text-xs font-semibold text-muted">참가기업 소개</div>
            <div className="text-sm font-bold text-ink">{exhibitor.companyName}</div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{exhibitor.intro}</p>
          </div>
        )}
      </DetailLayout>
    </div>
  )
}
