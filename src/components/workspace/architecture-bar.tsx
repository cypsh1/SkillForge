import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import { useWorkspace } from "@/hooks/use-workspace"
import { BRIDGE_LAYERS, LAYER_SECTION_IDS, type BridgeLayerId } from "@/lib/bridge-sections"
import { getOpenclawMetadata } from "@/lib/schemas/frontmatter-schema"
import { cn } from "@/lib/utils"
import type { ParsedSkill, SkillFrontmatter } from "@/types/skill"

function hasLayerContent(
  layerId: BridgeLayerId,
  skill: ParsedSkill,
  fm: SkillFrontmatter,
): boolean {
  const sectionIds = LAYER_SECTION_IDS[layerId] ?? []
  if (sectionIds.length === 0) return false
  return sectionIds.some((sid) => {
    switch (sid) {
      case "basic":
        return true
      case "trigger":
        return !!(
          fm.triggers?.length ||
          fm.read_when?.length ||
          fm.auto_trigger ||
          fm["command-dispatch"]
        )
      case "meta": {
        const oc = getOpenclawMetadata(fm.metadata)
        return !!(
          oc?.requires?.bins?.length ||
          oc?.optionalBins?.length ||
          oc?.os?.length
        )
      }
      case "env":
        return (fm.env?.length ?? 0) > 0
      case "tools":
        return skill.tools.length > 0
      case "files":
        return !!(
          (Array.isArray(fm.files?.read) && fm.files!.read.length > 0) ||
          (Array.isArray(fm.files?.write) && fm.files!.write.length > 0)
        )
      case "exec":
        return skill.sections.some((s) => /脚本|script|pipeline/i.test(s.title))
      case "doc":
        return skill.sections.length > 0
      default:
        return false
    }
  })
}

export function ArchitectureBar() {
  const { t } = useTranslation()
  const api = usePanelSyncApi()
  const { state, selectedSkill, editState } = useWorkspace()

  const nodeType = state.selection?.nodeType
  const fm = editState?.frontmatter ?? selectedSkill?.frontmatter

  const enabledSet = useMemo(() => {
    const set = new Set<BridgeLayerId>()
    if (!selectedSkill || !fm) {
      BRIDGE_LAYERS.forEach((l) => set.add(l.id))
      return set
    }
    for (const l of BRIDGE_LAYERS) {
      if (hasLayerContent(l.id, selectedSkill, fm)) set.add(l.id)
    }
    return set
  }, [selectedSkill, fm])

  const handleClick = useCallback(
    (layerId: BridgeLayerId) => {
      if (!api) return
      api.toggleLayer(layerId)
      const firstSection = LAYER_SECTION_IDS[layerId]?.[0]
      if (firstSection && api.currentLayer !== layerId) {
        requestAnimationFrame(() => api.scrollBothToSection(firstSection))
      }
    },
    [api],
  )

  if (!api || nodeType !== "skill-md") return null

  const { currentLayer } = api

  return (
    <div className="arch-bar">
      <span className="arch-label">{t("workspace.bridge.logicLayer")}</span>
      {BRIDGE_LAYERS.filter((l) => enabledSet.has(l.id)).map((layer, idx, arr) => (
          <div key={layer.id} className="flex items-center">
            <button
              type="button"
              className={cn("arch-chip", currentLayer === layer.id && "on")}
              data-l={layer.id}
              onClick={() => handleClick(layer.id)}
            >
              <span>{layer.icon}</span>
              <span>{t(`workspace.bridge.layer.${layer.id}`)}</span>
            </button>
            {idx < arr.length - 1 ? <span className="arch-arrow">→</span> : null}
          </div>
      ))}
    </div>
  )
}
