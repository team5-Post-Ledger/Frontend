import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { DatePickerPopover } from './DatePickerPopover'
import { fieldControlClass } from './Field'

type SearchTab = 'exhibition' | 'ai'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
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

export function SearchCard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<SearchTab>('exhibition')
  const [keyword, setKeyword] = useState('')
  const [date, setDate] = useState('')
  const [place, setPlace] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('q', keyword.trim())
    if (date) params.set('date', date)
    if (place.trim()) params.set('venue', place.trim())
    const query = params.toString()
    navigate(query ? `/exhibitions?${query}` : '/exhibitions')
  }

  return (
    <div className="mx-auto w-full max-w-[720px] border border-line bg-white">
      <div className="flex">
        <button
          type="button"
          onClick={() => setActiveTab('exhibition')}
          className={`flex-1 border-b-2 px-4 py-3 text-sm font-bold transition-colors active:bg-surface ${
            activeTab === 'exhibition' ? 'border-primary text-ink' : 'border-transparent text-muted'
          }`}
        >
          박람회 찾기
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex-1 border-b-2 px-4 py-3 text-sm font-bold transition-colors active:bg-surface ${
            activeTab === 'ai' ? 'border-primary text-ink' : 'border-transparent text-muted'
          }`}
        >
          AI에게 물어보세요
        </button>
      </div>

      {activeTab === 'exhibition' ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-3">
          <div className="relative lg:flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
              <SearchIcon />
            </span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="박람회 이름"
              aria-label="키워드"
              className={`${fieldControlClass} pl-9`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:contents">
            <div className="lg:flex-1">
              <DatePickerPopover value={date} onChange={setDate} placeholder="관람일" />
            </div>

            <div className="lg:flex-1">
              <input
                value={place}
                onChange={(event) => setPlace(event.target.value)}
                placeholder="장소(지역, 전시장명)"
                aria-label="장소"
                className={fieldControlClass}
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex h-[42px] w-full shrink-0 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover active:bg-primary-hover lg:w-auto"
          >
            검색
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <span className="flex h-10 w-10 items-center justify-center bg-surface text-primary">
            <SparkleIcon />
          </span>
          <p className="max-w-[420px] text-sm leading-relaxed text-muted">
            궁금한 부스나 세션을 자연어로 물어보면 AI가 근거와 함께 답해드려요.
          </p>
          <Link
            to="/assistant"
            className="flex h-11 items-center justify-center bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover active:bg-primary-hover"
          >
            AI에게 물어보러 가기
          </Link>
        </div>
      )}
    </div>
  )
}
