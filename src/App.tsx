import { useEffect, useState } from "react"
import { Group, Panel, Separator as PanelSeparator } from "react-resizable-panels"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ErrorBoundary } from "@/components/error-boundary"
import { AppHeader } from "@/components/layout/app-header"
import { NavigatorPanel } from "@/components/workspace/navigator-panel"
import { EditorPanel } from "@/components/workspace/editor-panel"
import { InspectorPanel } from "@/components/workspace/inspector-panel"
import { WorkspaceContext, useWorkspaceReducer } from "@/hooks/use-workspace"
import { loadTestSkills } from "@/data/skill-loader"
import { isTauri, loadLocalSkills } from "@/lib/tauri-fs"
import type { ParsedSkill } from "@/types/skill"

function useSkills() {
  const [skills, setSkills] = useState<ParsedSkill[]>(() => {
    if (!isTauri()) return loadTestSkills()
    return []
  })
  const [loading, setLoading] = useState(() => isTauri())

  useEffect(() => {
    if (!isTauri()) return
    let cancelled = false
    loadLocalSkills()
      .then((loaded) => {
        if (cancelled) return
        const finalSkills = loaded.length > 0 ? loaded : loadTestSkills()
        setSkills(finalSkills)
      })
      .catch(() => {
        if (!cancelled) setSkills(loadTestSkills())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return { skills, loading }
}

function WorkspaceShell({ skills }: { skills: ParsedSkill[] }) {
  const workspace = useWorkspaceReducer(skills)

  return (
    <WorkspaceContext.Provider value={workspace}>
      <div className="flex flex-col h-svh">
        <AppHeader />
        <Group orientation="horizontal" className="flex-1" id="skillforge-layout">
          <Panel defaultSize={22} minSize={15} maxSize={35}>
            <NavigatorPanel />
          </Panel>
          <PanelSeparator className="w-1 bg-border hover:bg-primary/20 transition-colors" />
          <Panel defaultSize={50} minSize={30}>
            <EditorPanel />
          </Panel>
          <PanelSeparator className="w-1 bg-border hover:bg-primary/20 transition-colors" />
          <Panel defaultSize={28} minSize={15} maxSize={40}>
            <InspectorPanel />
          </Panel>
        </Group>
      </div>
    </WorkspaceContext.Provider>
  )
}

export default function App() {
  const { skills, loading } = useSkills()

  return (
    <ErrorBoundary>
      <TooltipProvider>
        {loading ? (
          <div className="flex h-svh items-center justify-center">
            <div className="text-sm text-muted-foreground">加载 Skills…</div>
          </div>
        ) : (
          <WorkspaceShell skills={skills} />
        )}
      </TooltipProvider>
    </ErrorBoundary>
  )
}
