import { ErrorBoundary } from './ErrorBoundary'
import { ScrollToTop } from './ScrollToTop'
import { AppRouter } from './router'

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <AppRouter />
    </ErrorBoundary>
  )
}
