import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { RecommendedBannerSlide } from '../../components/RecommendedBannerSlide'
import { ScheduleSection } from '../../components/ScheduleSection'
import { SearchCard } from '../../components/SearchCard'
import { useActiveAds } from '../../features/ads/hooks'
import { useAuthStore } from '../../stores/authStore'

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="1" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function QrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <line x1="14" y1="17" x2="21" y2="17" />
      <line x1="17" y1="14" x2="17" y2="21" />
    </svg>
  )
}

function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}

function ReportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="20" x2="6" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="18" y1="20" x2="18" y2="14" />
    </svg>
  )
}

const VISITOR_PROBLEMS = [
  { no: '01', title: '입구마다 줄서기', body: '예약 확인을 줄 서서 기다리다 보면 박람회 시작도 전에 지칩니다.' },
  { no: '02', title: '뭐부터 봐야할지 모름', body: '넓은 전시장, 수많은 부스 — 관심 있는 곳만 골라보기 어렵습니다.' },
  { no: '03', title: '다녀온 기록이 없음', body: '어떤 부스를 들렀는지, 얼마나 머물렀는지 나중엔 기억이 안 납니다.' },
]

const VISITOR_FEATURES: Array<{ icon: ReactNode; title: string; body: string }> = [
  { icon: <CalendarIcon />, title: '예약·결제', body: '원하는 시간대 슬롯을 골라 예약하고 바로 결제까지 끝내요.' },
  { icon: <QrIcon />, title: 'QR 즉시 입장', body: '모바일 티켓 QR로 줄 서지 않고 바로 입장해요.' },
  { icon: <PulseIcon />, title: '실시간 혼잡도', body: '구역별 혼잡도를 보고 한산한 시간에 맞춰 움직여요.' },
  { icon: <SparkleIcon />, title: 'AI 동선 추천', body: '관심사와 가용 시간에 맞춰 꼭 봐야 할 부스를 추천받아요.' },
  { icon: <ReportIcon />, title: '사후 리포트', body: '다녀온 부스와 체류시간을 한눈에 리포트로 받아봐요.' },
]

const HOW_IT_WORKS = [
  { step: 1, title: '박람회 찾기', body: '관심있는 박람회를 검색하고 둘러보세요.' },
  { step: 2, title: '예약·결제', body: '시간대와 티켓을 골라 예약을 완료하세요.' },
  { step: 3, title: 'QR로 입장', body: '모바일 티켓 QR을 스캔하면 바로 입장합니다.' },
  { step: 4, title: 'AI 동선·리포트', body: '동선 추천을 받고, 다녀온 뒤엔 리포트를 확인하세요.' },
]

export default function HomePage() {
  const user = useAuthStore((state) => state.user)
  const ads = useActiveAds()

  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center px-5 py-10 text-center lg:px-8 lg:py-20">
        <span className="mb-5 rounded-full border border-line px-3.5 py-1.5 text-xs text-muted lg:mb-6">
          박람회·전시회 방문객을 위한 올인원 플랫폼
        </span>
        <h1 className="max-w-[640px] text-[28px] font-extrabold leading-[1.2] tracking-tight text-ink lg:text-[44px] lg:leading-[1.15]">
          가까운 박람회를 찾고
          <br />
          예약부터 입장까지 한 번에
        </h1>
        <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-muted lg:mt-5 lg:text-base">
          줄 설 필요 없이 QR 하나로 입장하고, 관심사에 맞는 동선까지 추천받으세요.
        </p>

        <div className="mt-7 w-full lg:mt-8">
          <SearchCard />
        </div>

        <Link to="/exhibitions" className="mt-3 text-xs font-semibold text-primary hover:text-primary-hover">
          박람회 전체보기 →
        </Link>
      </section>

      <section className="border-t border-line px-5 py-10 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-6 flex items-end justify-between gap-3 lg:mb-8">
            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-[.14em] text-muted">추천 박람회</div>
              <h2 className="text-xl font-extrabold tracking-tight text-ink lg:text-[28px]">지금 둘러볼 만한 박람회</h2>
            </div>
            <Link
              to="/exhibitions"
              className="hidden shrink-0 text-sm font-semibold text-primary hover:text-primary-hover sm:inline"
            >
              전체보기 →
            </Link>
          </div>

          <RecommendedBannerSlide />
        </div>
      </section>

      <section className="border-t border-line px-5 py-10 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-6 lg:mb-8">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[.14em] text-muted">일정 탐색</div>
            <h2 className="text-xl font-extrabold tracking-tight text-ink lg:text-[28px]">날짜별로 진행 중인 박람회 찾기</h2>
          </div>

          <ScheduleSection />
        </div>
      </section>

      {ads.data && ads.data.length > 0 && (
        <section className="px-5 pb-10 lg:px-8 lg:pb-16">
          <div className="mx-auto max-w-[1080px]">
            {ads.data.map((ad) => (
              <div
                key={ad.id}
                className="flex flex-col items-start justify-between gap-4 bg-shell px-6 py-7 text-white sm:flex-row sm:items-center lg:px-10 lg:py-9"
              >
                <div>
                  <div className="text-xs font-semibold text-white/55">{ad.advertiserName}</div>
                  <div className="mt-1.5 text-base font-bold leading-snug lg:text-xl">{ad.title}</div>
                </div>
                <span className="shrink-0 border border-white/30 px-4 py-2 text-sm font-semibold text-white">광고</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-line bg-surface px-5 py-10 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-7 max-w-[520px] lg:mb-10">
            <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-muted">이런 점, 불편하셨죠?</div>
            <h2 className="text-xl font-extrabold tracking-tight text-ink lg:text-[28px]">박람회 방문, FairPilot이 도와드려요</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {VISITOR_PROBLEMS.map((problem) => (
              <div key={problem.no} className="border border-line border-t-[3px] border-t-ink bg-white p-6">
                <div className="mb-3.5 font-mono text-[13px] text-muted/60">{problem.no}</div>
                <div className="mb-2 text-base font-bold text-ink">{problem.title}</div>
                <div className="text-sm leading-relaxed text-muted">{problem.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-10 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-7 max-w-[520px] lg:mb-10">
            <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-muted">핵심 기능</div>
            <h2 className="text-xl font-extrabold tracking-tight text-ink lg:text-[28px]">예약부터 사후 리포트까지</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VISITOR_FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-4 border border-line bg-white p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-surface text-primary">
                  {feature.icon}
                </span>
                <div>
                  <div className="mb-1 text-sm font-bold text-ink">{feature.title}</div>
                  <div className="text-xs leading-relaxed text-muted">{feature.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line px-5 py-10 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-9 max-w-[520px] lg:mb-12">
            <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-muted">이용 방법</div>
            <h2 className="text-xl font-extrabold tracking-tight text-ink lg:text-[28px]">4단계로 끝나는 박람회 방문</h2>
          </div>

          <div className="relative flex flex-col lg:flex-row lg:justify-between">
            <div className="absolute bottom-5 left-5 top-5 w-px bg-line lg:bottom-auto lg:left-[8%] lg:right-[8%] lg:top-5 lg:h-px lg:w-auto" />
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="relative flex gap-4 pb-8 last:pb-0 lg:flex-1 lg:flex-col lg:items-center lg:px-2 lg:pb-0 lg:text-center"
              >
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink bg-white text-sm font-bold text-ink">
                  {item.step}
                </span>
                <div className="lg:mt-4">
                  <div className="text-sm font-bold text-ink lg:text-[15px]">{item.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-muted lg:text-[13px]">{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-shell px-5 py-12 text-center text-white lg:py-16">
        <h2 className="text-2xl font-extrabold tracking-tight lg:text-[34px]">지금 바로 시작해보세요</h2>
        {user ? (
          <Link
            to="/exhibitions"
            className="mt-6 inline-flex h-12 items-center justify-center bg-white px-8 text-sm font-bold text-ink transition-colors hover:bg-white/90"
          >
            박람회 둘러보기
          </Link>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link
              to="/signup"
              className="flex h-12 w-full items-center justify-center bg-white px-8 text-sm font-bold text-ink transition-colors hover:bg-white/90 sm:w-auto"
            >
              가입하기
            </Link>
            <Link
              to="/login"
              className="flex h-12 w-full items-center justify-center border border-white/30 px-8 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              로그인
            </Link>
          </div>
        )}
      </section>

      <footer className="border-t border-line bg-white px-5 py-8 text-center lg:px-8">
        <div className="text-base font-extrabold text-primary">FairPilot</div>
        <p className="mx-auto mt-2 max-w-[420px] text-xs leading-relaxed text-muted">
          박람회·전시회 방문객을 위한 예약·입장·동선 추천 올인원 플랫폼
        </p>
        <p className="mt-4 text-[11px] text-muted/70">© 2026 FairPilot. All rights reserved.</p>
      </footer>
    </div>
  )
}
