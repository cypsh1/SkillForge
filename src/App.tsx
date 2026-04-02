import { Group, Panel, Separator as PanelSeparator } from "react-resizable-panels"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ErrorBoundary } from "@/components/error-boundary"
import { AppHeader } from "@/components/layout/app-header"
import { NavigatorPanel } from "@/components/workspace/navigator-panel"
import { EditorPanel } from "@/components/workspace/editor-panel"
import { InspectorPanel } from "@/components/workspace/inspector-panel"
import { WorkspaceContext, useWorkspaceReducer } from "@/hooks/use-workspace"
import { loadTestSkills } from "@/data/skill-loader"

const skills = loadTestSkills()

export default function App() {
  const workspace = useWorkspaceReducer(skills)

  return (
    <ErrorBoundary>
      <TooltipProvider>
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
      </TooltipProvider>
    </ErrorBoundary>
  )
}
