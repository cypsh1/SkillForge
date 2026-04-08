import { useEffect, useRef } from "react"
import {
  Group,
  Panel,
  Separator as PanelSeparator,
  type PanelImperativeHandle,
} from "react-resizable-panels"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AppHeader } from "@/components/layout/app-header"
import { ArchitectureBar } from "@/components/workspace/architecture-bar"
import { NavigatorPanel } from "@/components/workspace/navigator-panel"
import { EditorPanel } from "@/components/workspace/editor-panel"
import { InspectorPanel } from "@/components/workspace/inspector-panel"
import { BridgeConnector } from "@/components/workspace/bridge-connector"
import { ContextBar } from "@/components/workspace/context-bar"
import { RelationBar } from "@/components/workspace/relation-bar"
import { RelationHover } from "@/components/workspace/relation-hover"
import { WorkspaceContext, useWorkspaceReducer } from "@/hooks/use-workspace"
import { PanelSyncContext, usePanelSync } from "@/hooks/use-panel-sync"

import type { ParsedSkill } from "@/types/skill"

const LAYOUT_GROUP_ID = "skillforge-layout-main"

export default function WorkspaceShell({ skills }: { skills: ParsedSkill[] }) {
  const workspace = useWorkspaceReducer(skills)
  const selectedSkillId = workspace.state.selection?.skillId
  const selectedSkill = selectedSkillId
    ? workspace.state.skills.find((s) => s.id === selectedSkillId) ?? null
    : null
  const editFm = selectedSkillId
    ? workspace.state.editStates[selectedSkillId]?.frontmatter ?? null
    : null
  const panelSync = usePanelSync(selectedSkill, editFm ?? selectedSkill?.frontmatter)
  const inspectorPanelRef = useRef<PanelImperativeHandle>(null)
  const prevNodeTypeRef = useRef<string | null>(null)

  const nodeType = workspace.state.selection?.nodeType
  useEffect(() => {
    const panel = inspectorPanelRef.current
    if (!panel) return

    const prevNodeType = prevNodeTypeRef.current
    prevNodeTypeRef.current = nodeType ?? null

    if (nodeType === "skill-overview") {
      panel.collapse()
    } else {
      panel.expand()
      if (prevNodeType === "skill-overview") {
        panel.resize("50%")
      }
    }
  }, [nodeType])

  return (
    <TooltipProvider>
    <WorkspaceContext.Provider value={workspace}>
      <PanelSyncContext.Provider value={panelSync}>
        <div className="flex flex-col h-svh">
          <AppHeader />
          <div className="flex-1 min-h-0 overflow-hidden">
            <Group
              orientation="horizontal"
              className="h-full"
              id={LAYOUT_GROUP_ID}
            >
              <Panel id="nav" defaultSize="20%" minSize="15%" maxSize="32%">
                <NavigatorPanel />
              </Panel>
              <PanelSeparator className="w-1 bg-border hover:bg-primary/20 transition-colors z-30 relative" />
              <Panel id="right-col" defaultSize="80%">
                <div className="flex flex-col h-full">
                  <ArchitectureBar />
                  <div className="relative flex-1 min-h-0 overflow-hidden" ref={panelSync.layoutRef}>
                    <Group
                      orientation="horizontal"
                      className="h-full"
                      id="skillforge-layout-inner"
                    >
                      <Panel id="editor" defaultSize="50%" minSize="30%">
                        <EditorPanel />
                      </Panel>
                      <PanelSeparator className="w-1 bg-border hover:bg-primary/20 transition-colors z-30 relative" />
                      <Panel
                        id="inspector"
                        defaultSize="50%"
                        minSize="22%"
                        maxSize="65%"
                        collapsible
                        collapsedSize="0%"
                        panelRef={inspectorPanelRef}
                      >
                        <InspectorPanel />
                      </Panel>
                    </Group>
                    <BridgeConnector />
                    <RelationHover />
                  </div>
                  <RelationBar />
                  <ContextBar />
                </div>
              </Panel>
            </Group>
          </div>
        </div>
      </PanelSyncContext.Provider>
    </WorkspaceContext.Provider>
    <Toaster position="bottom-right" duration={2000} />
    </TooltipProvider>
  )
}
