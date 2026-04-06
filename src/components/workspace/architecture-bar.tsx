import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import { BRIDGE_LAYERS } from "@/lib/bridge-sections"
import { cn } from "@/lib/utils"

export function ArchitectureBar() {
  const api = usePanelSyncApi()
  if (!api) return null

  const { currentLayer, toggleLayer } = api

  return (
    <div className="arch-bar">
      <span className="arch-label">逻辑层:</span>
      {BRIDGE_LAYERS.map((layer, idx) => (
        <div key={layer.id} className="flex items-center">
            <button
            type="button"
            className={cn("arch-chip", currentLayer === layer.id && "on")}
            data-l={layer.id}
            onClick={() => toggleLayer(layer.id)}
          >
            <span>{layer.icon}</span>
            <span>{layer.name}</span>
          </button>
          {idx < BRIDGE_LAYERS.length - 1 ? <span className="arch-arrow">→</span> : null}
        </div>
      ))}
    </div>
  )
}
