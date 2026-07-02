import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useRecommendedExhibitions } from '../features/exhibition/hooks'
import { compareForBanner } from '../features/exhibition/sortForBanner'
import { formatDateRange } from '../lib/format'
import { QueryState } from './QueryState'

const AUTOPLAY_INTERVAL_MS = 5000
const MAX_SLIDES = 8

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setReduced(mql.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return reduced
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function RecommendedBannerSlide() {
  const recommended = useRecommendedExhibitions()

  const slides = useMemo(
    () => [...(recommended.data ?? [])].sort(compareForBanner).slice(0, MAX_SLIDES),
    [recommended.data],
  )

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = useReducedMotion()
  const activeIndex = slides.length > 0 ? ((index % slides.length) + slides.length) % slides.length : 0

  useEffect(() => {
    if (slides.length <= 1 || paused || reducedMotion) return
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, AUTOPLAY_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [slides.length, paused, reducedMotion])

  function goTo(next: number) {
    setIndex(next)
  }

  return (
    <QueryState
      isLoading={recommended.isLoading}
      isError={recommended.isError}
      isEmpty={slides.length === 0}
      emptyMessage="추천할 박람회가 아직 없습니다."
      height={160}
    >
      <div
        className="relative h-[160px] w-full overflow-hidden bg-shell lg:h-[180px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {slides.map((exhibition, i) => (
          <Link
            key={exhibition.id}
            to={`/exhibitions/${exhibition.id}`}
            aria-hidden={i !== activeIndex}
            tabIndex={i === activeIndex ? 0 : -1}
            className={`absolute inset-0 flex flex-col justify-end bg-cover bg-center p-4 transition-opacity duration-500 active:opacity-90 lg:p-6 ${
              i === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            style={exhibition.bannerImageUrl ? { backgroundImage: `url(${exhibition.bannerImageUrl})` } : undefined}
          >
            {exhibition.bannerImageUrl && (
              <div className="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/20 to-transparent" />
            )}
            <div className="relative">
              <div className="line-clamp-1 text-base font-extrabold text-white lg:text-xl">{exhibition.title}</div>
              <div className="mt-1 text-xs text-white/80">
                {formatDateRange(exhibition.startDate, exhibition.endDate)} · {exhibition.venue}
              </div>
            </div>
          </Link>
        ))}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="이전 배너"
              className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-ink/40 text-white transition-colors hover:bg-ink/60 active:bg-ink/80"
            >
              <ArrowLeftIcon />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="다음 배너"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-ink/40 text-white transition-colors hover:bg-ink/60 active:bg-ink/80"
            >
              <ArrowRightIcon />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {slides.map((exhibition, i) => (
                <button
                  key={exhibition.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${i + 1}번째 배너로 이동`}
                  aria-current={i === activeIndex}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${i === activeIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </QueryState>
  )
}
