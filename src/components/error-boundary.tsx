import { Component, type ReactNode } from "react"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
        <div className="flex min-h-svh flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="size-6 shrink-0 text-destructive"
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <h2 className="font-heading text-base font-medium">
                    出现错误
                  </h2>
                  <p className="break-words font-mono text-sm text-muted-foreground">
                    {error?.message ?? "Unknown error"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="default"
                onClick={() =>
                  this.setState({ hasError: false, error: null })
                }
              >
                重试
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return children
  }
}
