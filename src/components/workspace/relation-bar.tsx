import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import {
  getRelationStore,
  getRelations,
  type BridgeRelation,
} from "@/lib/bridge-relations"

function findIncomingLabel(targetId: string): string | null {
  for (const rels of Object.values(getRelationStore())) {
    for (const r of rels) {
      if (r.id === targetId) return r.lb
    }
  }
  return null
}

function entityTitle(eid: string): string {
  return findIncomingLabel(eid) ?? eid
}

export function RelationBar() {
  const api = usePanelSyncApi()
  if (!api) return null

  const { selectedEid, clearRelationSelection, selectRelationTarget } = api
  if (selectedEid == null) return null

  const rows: BridgeRelation[] = getRelations(selectedEid)
  if (rows.length === 0) return null

  const title = entityTitle(selectedEid)

  return (
    <div className="rel-bar" role="region" aria-label="关系路径">
      <div className="rel-bar-hd">
        <span className="rel-nm">{title}</span>
        <button
          type="button"
          className="rel-clear"
          onClick={() => clearRelationSelection()}
        >
          ✕ 清除
        </button>
      </div>
      <div className="rel-bar-rows">
        {rows.map((r) => (
          <div key={`${r.t}-${r.id}-${r.lb}`} className="rel-row">
            <span className="rel-type">{r.t}</span>
            <button
              type="button"
              className="rel-target"
              onMouseEnter={() => {
                const q = `.en[data-eid="${CSS.escape(r.id)}"]`
                document.querySelectorAll<HTMLElement>(q).forEach((el) => {
                  el.classList.remove("flash")
                  void el.offsetWidth
                  el.classList.add("flash")
                })
              }}
              onMouseLeave={() => {
                document.querySelectorAll<HTMLElement>(".en.flash").forEach((el) => {
                  el.classList.remove("flash")
                })
              }}
              onClick={() => selectRelationTarget(r.id)}
            >
              {r.lb}
            </button>
            <span className="rel-desc">{r.d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
