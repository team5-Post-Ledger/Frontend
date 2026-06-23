export interface StepperStep {
  key: string
  label: string
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export function Stepper({ steps, currentStep }: { steps: StepperStep[]; currentStep: number }) {
  return (
    <div className="flex items-start">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.key} className={isLast ? 'flex flex-col items-center' : 'flex flex-1 flex-col items-center'}>
            <div className="flex w-full items-center">
              <span
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold',
                  isCompleted ? 'bg-primary text-white' : isCurrent ? 'border-2 border-primary bg-white text-primary' : 'border border-line bg-white text-muted',
                ].join(' ')}
              >
                {isCompleted ? <CheckIcon /> : index + 1}
              </span>
              {!isLast && <div className={`mx-2 h-0.5 flex-1 ${isCompleted ? 'bg-primary' : 'bg-line'}`} />}
            </div>
            <span className={`mt-1.5 text-xs font-semibold ${isCurrent ? 'text-ink' : 'text-muted'}`}>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function StepperNav({
  onPrev,
  onNext,
  isFirstStep,
  isLastStep,
  isNextDisabled,
  isLoading,
  prevLabel = '이전',
  nextLabel,
}: {
  onPrev?: () => void
  onNext?: () => void
  isFirstStep?: boolean
  isLastStep?: boolean
  isNextDisabled?: boolean
  isLoading?: boolean
  prevLabel?: string
  nextLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstStep}
        className="px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink disabled:invisible"
      >
        {prevLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled || isLoading}
        className="flex h-11 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-default disabled:bg-muted"
      >
        {isLoading && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />}
        {nextLabel ?? (isLastStep ? '완료' : '다음')}
      </button>
    </div>
  )
}
