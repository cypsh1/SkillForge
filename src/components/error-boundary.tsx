import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  render() {
    const { children, fallback } = this.props
    const { hasError, error } = this.state

    if (hasError) {
      if (fallback !== undefined) {
        return fallback
      }

      return (
        <div style={{ display: 'flex', minHeight: '100svh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: 24, background: 'var(--card)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>出现错误</h2>
            <p style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--muted-foreground)', wordBreak: 'break-word' }}>
              {error?.message ?? "Unknown error"}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ marginTop: 16, padding: '6px 16px', borderRadius: 6, background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', fontSize: 14 }}
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return children
  }
}
