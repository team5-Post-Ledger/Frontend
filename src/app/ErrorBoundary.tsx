import { Component, type ErrorInfo, type ReactNode } from 'react'
import { SystemPageShell } from '../components/SystemPageShell'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] 렌더 에러:', error, info)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <SystemPageShell
          title="문제가 발생했습니다"
          message="예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
          actions={
            <>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                새로고침
              </button>
              {/* <a>: ErrorBoundary fallback에서 router Link 의존 없이 안전하게 홈 이동 */}
              <a
                href="/"
                className="block w-full border border-line py-2.5 text-center text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
              >
                홈으로
              </a>
            </>
          }
        />
      )
    }

    return this.props.children
  }
}
