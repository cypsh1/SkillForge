import { useCallback, useEffect, useRef, useState } from "react"

import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import {
  getRelations,
  RELATION_TYPE_LABEL,
  type BridgeRelation,
  type RelationType,
} from "@/lib/bridge-relations"

const REL_ORDER: RelationType[] = ["→", "↔", "⊂"]

function targetElement(ev: MouseEvent): Element | null {
  const n = ev.target
  if (n == null) return null
  if (n instanceof Element) return n
  if (n instanceof Text) return n.parentElement
  return null
}

function groupRelations(rels: BridgeRelation[]): Map<RelationType, BridgeRelation[]> {
  const m = new Map<RelationType, BridgeRelation[]>()
  for (const t of REL_ORDER) m.set(t, [])
  for (const r of rels) {
    const arr = m.get(r.t)
    if (arr) arr.push(r)
  }
  return m
}

/**
 * 关系气泡（data-ri）与实体延迟提示（.en.has-rel），文档级事件委托 + 覆盖层渲染。
 */
export function RelationHover() {
  const api = usePanelSyncApi()
  const selectRelationTarget = api?.selectRelationTarget
  const selectedEid = api?.selectedEid ?? null

  const [bub, setBub] = useState<{
    eid: string
    left: number
    top: number
  } | null>(null)

  const [htip, setHtip] = useState<{ left: number; top: number } | null>(null)

  const htipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHtipEnRef = useRef<Element | null>(null)

  const clearHtipTimer = useCallback(() => {
    if (htipTimerRef.current != null) {
      clearTimeout(htipTimerRef.current)
      htipTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (selectedEid != null) {
      clearHtipTimer()
      setHtip(null)
      lastHtipEnRef.current = null
    }
  }, [selectedEid, clearHtipTimer])

  const onMouseOver = useCallback(
    (e: MouseEvent) => {
      const el = targetElement(e)
      if (!el) return

      const ri = el.closest("[data-ri]")
      if (ri) {
        const eid = ri.getAttribute("data-ri")
        if (eid) {
          const rect = ri.getBoundingClientRect()
          setBub({
            eid,
            left: rect.left,
            top: rect.bottom + 6,
          })
        }
      }

      const en = el.closest(".en.has-rel")
      if (!en || !api) return
      if (api.selectedEid != null) return

      if (lastHtipEnRef.current === en) return

      lastHtipEnRef.current = en
      clearHtipTimer()
      const rect = en.getBoundingClientRect()
      htipTimerRef.current = window.setTimeout(() => {
        setHtip({ left: rect.left + rect.width / 2, top: rect.bottom + 6 })
      }, 400)
    },
    [api, clearHtipTimer],
  )

  const onMouseOut = useCallback(
    (e: MouseEvent) => {
      const el = targetElement(e)
      if (!el) return
      const related = e.relatedTarget as Node | null

      const fromBub = el.closest(".bub")
      if (fromBub && (related == null || !fromBub.contains(related))) {
        setBub(null)
      }

      const fromRi = el.closest("[data-ri]")
      if (fromRi) {
        if (related == null) {
          setBub(null)
        } else if (!fromRi.contains(related)) {
          const toBub = related instanceof Element ? related.closest(".bub") : null
          if (!toBub) setBub(null)
        }
      }

      const fromHtip = el.closest(".htip")
      if (fromHtip && (related == null || !fromHtip.contains(related))) {
        setHtip(null)
      }

      const fromEn = el.closest(".en.has-rel")
      if (fromEn) {
        if (related == null) {
          clearHtipTimer()
          setHtip(null)
          lastHtipEnRef.current = null
        } else if (!fromEn.contains(related)) {
          const toHtip = related instanceof Element ? related.closest(".htip") : null
          if (!toHtip) {
            clearHtipTimer()
            setHtip(null)
            lastHtipEnRef.current = null
          }
        }
      }
    },
    [clearHtipTimer],
  )

  useEffect(() => {
    document.addEventListener("mouseover", onMouseOver)
    document.addEventListener("mouseout", onMouseOut)
    return () => {
      document.removeEventListener("mouseover", onMouseOver)
      document.removeEventListener("mouseout", onMouseOut)
    }
  }, [onMouseOver, onMouseOut])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const el = targetElement(e)
      if (!el) return
      if (el.closest(".en.has-rel")) {
        clearHtipTimer()
        setHtip(null)
      }
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [clearHtipTimer])

  const onDocMouseDown = useCallback(
    (e: MouseEvent) => {
      const el = targetElement(e)
      if (!el) return
      if (el.closest(".bub") || el.closest("[data-ri]")) return
      setBub(null)

      if (!el.closest(".htip") && !el.closest(".en.has-rel")) {
        clearHtipTimer()
        setHtip(null)
      }
    },
    [clearHtipTimer],
  )

  useEffect(() => {
    document.addEventListener("mousedown", onDocMouseDown, true)
    return () => document.removeEventListener("mousedown", onDocMouseDown, true)
  }, [onDocMouseDown])

  const rels = bub ? getRelations(bub.eid) : []
  const grouped = groupRelations(rels)

  return (
    <div className="pointer-events-none absolute inset-0 z-[36] overflow-visible" aria-hidden>
      {bub && rels.length > 0 ? (
        <div
          className="bub vis pointer-events-auto fixed z-[36] min-w-[200px] max-w-[min(360px,calc(100vw-24px))]"
          style={{ left: bub.left, top: bub.top }}
          role="dialog"
          aria-label={`关系：${bub.eid}`}
        >
          <div className="bub-t font-mono text-[11px]">{bub.eid}</div>
          {REL_ORDER.map((t) => {
            const items = grouped.get(t) ?? []
            if (items.length === 0) return null
            return (
              <div key={t} className="bub-g">
                <div className="bub-gl">{RELATION_TYPE_LABEL[t]}</div>
                {items.map((r) => (
                  <button
                    key={`${t}-${r.id}-${r.lb}`}
                    type="button"
                    className="bub-i"
                    onClick={() => {
                      selectRelationTarget?.(r.id)
                      setBub(null)
                    }}
                  >
                    {r.lb}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      ) : null}

      {htip ? (
        <div
          className="htip vis fixed z-[36]"
          style={{ left: htip.left, top: htip.top }}
        >
          点击查看关联关系
        </div>
      ) : null}
    </div>
  )
}
