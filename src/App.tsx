import { lazy, Suspense, useEffect, useState } from "react"
import { ErrorBoundary } from "@/components/error-boundary"

import type { ParsedSkill } from "@/types/skill"

const WorkspaceShell = lazy(() => import("@/components/workspace-shell"))

function isTauriEnv(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window
}

function LoadingScreen() {
  return (
    <div className="flex h-svh items-center justify-center">
      <div className="text-sm text-muted-foreground">加载 Skills…</div>
    </div>
  )
}

function useSkills() {
  const [skills, setSkills] = useState<ParsedSkill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        if (isTauriEnv()) {
          const { loadLocalSkills } = await import("@/lib/tauri-fs")
          const loaded = await loadLocalSkills()
          if (!cancelled && loaded.length > 0) {
            setSkills(loaded)
            return
          }
        }
        const { loadTestSkills } = await import("@/data/skill-loader")
        if (!cancelled) setSkills(loadTestSkills())
      } catch {
        try {
          const { loadTestSkills } = await import("@/data/skill-loader")
          if (!cancelled) setSkills(loadTestSkills())
        } catch {
          /* no test data available */
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { skills, loading }
}

export default function App() {
  const { skills, loading } = useSkills()

  return (
    <ErrorBoundary>
      {loading ? (
        <LoadingScreen />
      ) : (
        <Suspense fallback={<LoadingScreen />}>
          <WorkspaceShell skills={skills} />
        </Suspense>
      )}
    </ErrorBoundary>
  )
}
