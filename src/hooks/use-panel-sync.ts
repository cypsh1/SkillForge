import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  buildBridgeRelations,
  getRelationStore,
  normalizeEid,
  setRelationStore,
} from "@/lib/bridge-relations"
import type { ParsedSkill, SkillFrontmatter } from "@/types/skill"
import { type BridgeLayerId, LAYER_SECTION_IDS } from "@/lib/bridge-sections"

// ── Types ──────────────────────────────────────────────

export interface PanelSyncApi {
  editorRef: React.RefObject<HTMLDivElement | null>
  inspectorRef: React.RefObject<HTMLDivElement | null>
  layoutRef: React.RefObject<HTMLDivElement | null>

  syncEnabled: boolean
  bridgeEnabled: boolean
  toggleSync: () => void
  toggleBridge: () => void

  altHeld: boolean
  activePanel: "editor" | "inspector" | null

  currentSection: { id: string; index: number; total: number } | null
  editorScrollPct: number
  inspectorScrollPct: number

  selectedEid: string | null
  selectedField: string | null
  hoveredField: string | null
  relatedEids: string[]
  currentLayer: BridgeLayerId | null
  selectRelationTarget: (eid: string | null) => void
  selectFieldKey: (field: string | null) => void
  clearRelationSelection: () => void
  toggleLayer: (layer: BridgeLayerId) => void
  clearLayer: () => void
  isSectionDimmed: (sectionId: string) => boolean
  scrollBothToSection: (sectionId: string) => void

  editorAllExpanded: boolean
  inspectorAllExpanded: boolean
  expandSyncEnabled: boolean
  editorExpandTick: number
  inspectorExpandTick: number
  toggleAllEditor: () => void
  toggleAllInspector: () => void
  toggleExpandSync: () => void

  requestRedraw: () => void
  drawTick: number
}

export const PanelSyncContext = createContext<PanelSyncApi | null>(null)

export function usePanelSyncApi(): PanelSyncApi | null {
  return useContext(PanelSyncContext)
}

// ── Piecewise-linear scroll mapping ────────────────────

function buildAnchors(container: HTMLDivElement): number[] {
  const sections = container.querySelectorAll<HTMLElement>("[data-bridge-section]")
  const anchors: number[] = []
  sections.forEach((s) => anchors.push(s.offsetTop - container.offsetTop))
  if (sections.length > 0) {
    const last = sections[sections.length - 1]
    anchors.push(last.offsetTop - container.offsetTop + last.offsetHeight)
  }
  return anchors
}

function mapScroll(src: number[], tgt: number[], scrollTop: number): number {
  const n = src.length
  if (n < 2) return scrollTop
  if (scrollTop <= src[0]) return tgt[0] + (scrollTop - src[0])
  if (scrollTop >= src[n - 1]) return tgt[n - 1] + (scrollTop - src[n - 1])
  for (let i = 0; i < n - 1; i++) {
    if (scrollTop < src[i + 1]) {
      const span = src[i + 1] - src[i]
      if (span === 0) return tgt[i]
      return tgt[i] + ((scrollTop - src[i]) / span) * (tgt[i + 1] - tgt[i])
    }
  }
  return scrollTop
}

function scrollPct(el: HTMLDivElement): number {
  const max = el.scrollHeight - el.clientHeight
  return max > 0 ? Math.round((el.scrollTop / max) * 100) : 0
}

function detectCurrentSection(
  container: HTMLDivElement,
): { id: string; index: number; total: number } | null {
  const sections = container.querySelectorAll<HTMLElement>("[data-bridge-section]")
  if (sections.length === 0) return null
  const rect = container.getBoundingClientRect()
  const threshold = rect.top + rect.height * 0.33
  let bestId = sections[0].dataset.bridgeSection!
  let bestDist = Infinity
  let bestIdx = 0
  sections.forEach((sec, i) => {
    const sr = sec.getBoundingClientRect()
    const dist = Math.abs(sr.top - threshold)
    if (dist < bestDist) {
      bestDist = dist
      bestId = sec.dataset.bridgeSection!
      bestIdx = i
    }
  })
  return { id: bestId, index: bestIdx, total: sections.length }
}

// ── Hook ───────────────────────────────────────────────

export function usePanelSync(
  skill?: ParsedSkill | null,
  fm?: SkillFrontmatter | null,
): PanelSyncApi {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const inspectorRef = useRef<HTMLDivElement | null>(null)
  const layoutRef = useRef<HTMLDivElement | null>(null)

  const [syncEnabled, setSyncEnabled] = useState(true)
  const [bridgeEnabled, setBridgeEnabled] = useState(true)
  const [altHeld, setAltHeld] = useState(false)
  const [activePanel, setActivePanel] = useState<"editor" | "inspector" | null>(null)
  const [currentSection, setCurrentSection] = useState<{
    id: string
    index: number
    total: number
  } | null>(null)
  const [editorScrollPct, setEditorScrollPct] = useState(0)
  const [inspectorScrollPct, setInspectorScrollPct] = useState(0)
  const [drawTick, setDrawTick] = useState(0)
  const [selectedEid, setSelectedEid] = useState<string | null>(null)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [hoveredField, setHoveredField] = useState<string | null>(null)
  const [currentLayer, setCurrentLayer] = useState<BridgeLayerId | null>(null)
  const [editorAllExpanded, setEditorAllExpanded] = useState(true)
  const [inspectorAllExpanded, setInspectorAllExpanded] = useState(true)
  const [expandSyncEnabled, setExpandSyncEnabled] = useState(false)
  const [editorExpandTick, setEditorExpandTick] = useState(0)
  const [inspectorExpandTick, setInspectorExpandTick] = useState(0)

  const relationStoreVersion = useMemo(() => {
    const relations = buildBridgeRelations(skill ?? null, fm ?? null)
    setRelationStore(relations)
    return JSON.stringify(Object.keys(relations).sort())
  }, [skill, fm])

  const relatedEids = useMemo(() => {
    if (selectedEid == null) return []
    const store = getRelationStore()
    const rels = store[selectedEid]
    if (!rels?.length) return []
    return rels.map((r) => r.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEid, relationStoreVersion])

  const selectRelationTarget = useCallback((eid: string | null) => {
    if (eid == null) {
      setSelectedEid(null)
      return
    }
    const next = normalizeEid(eid)
    setSelectedEid(next === "" ? null : next)
  }, [])

  const selectFieldKey = useCallback((field: string | null) => {
    if (field == null) {
      setSelectedField(null)
      return
    }
    const next = field.trim()
    setSelectedField(next === "" ? null : next)
  }, [])

  const clearRelationSelection = useCallback(() => {
    setSelectedEid(null)
    setSelectedField(null)
  }, [])

  const toggleLayer = useCallback((layer: BridgeLayerId) => {
    setCurrentLayer((prev) => (prev === layer ? null : layer))
  }, [])

  const clearLayer = useCallback(() => {
    setCurrentLayer(null)
  }, [])

  const isSectionDimmed = useCallback(
    (sectionId: string) => {
      if (!currentLayer) return false
      return !LAYER_SECTION_IDS[currentLayer].includes(sectionId)
    },
    [currentLayer],
  )

  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const eAnchorsRef = useRef<number[]>([])
  const pAnchorsRef = useRef<number[]>([])
  const rafRef = useRef(0)
  const needSyncRef = useRef(false)
  const activePanelRef = useRef(activePanel)
  const syncEnabledRef = useRef(syncEnabled)
  const altHeldRef = useRef(altHeld)

  activePanelRef.current = activePanel
  syncEnabledRef.current = syncEnabled
  altHeldRef.current = altHeld

  const rebuildAnchors = useCallback(() => {
    if (editorRef.current) eAnchorsRef.current = buildAnchors(editorRef.current)
    if (inspectorRef.current) pAnchorsRef.current = buildAnchors(inspectorRef.current)
  }, [])

  const frame = useCallback(() => {
    rafRef.current = 0
    const eSc = editorRef.current
    const pSc = inspectorRef.current
    if (!eSc || !pSc) return

    eAnchorsRef.current = buildAnchors(eSc)
    pAnchorsRef.current = buildAnchors(pSc)

    if (needSyncRef.current && syncEnabledRef.current && !altHeldRef.current) {
      needSyncRef.current = false
      if (activePanelRef.current === "editor") {
        pSc.scrollTop = mapScroll(eAnchorsRef.current, pAnchorsRef.current, eSc.scrollTop)
      } else if (activePanelRef.current === "inspector") {
        eSc.scrollTop = mapScroll(pAnchorsRef.current, eAnchorsRef.current, pSc.scrollTop)
      }
    } else {
      needSyncRef.current = false
    }

    setEditorScrollPct(scrollPct(eSc))
    setInspectorScrollPct(scrollPct(pSc))
    setCurrentSection(detectCurrentSection(activePanelRef.current === "inspector" ? pSc : eSc))
    setDrawTick((t) => t + 1)
  }, [])

  const scheduleFrame = useCallback(() => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(frame)
    }
  }, [frame])

  const requestRedraw = useCallback(() => {
    rebuildAnchors()
    scheduleFrame()
  }, [rebuildAnchors, scheduleFrame])

  const scrollBothToSection = useCallback(
    (sectionId: string) => {
      const eSc = editorRef.current
      const pSc = inspectorRef.current
      if (!eSc || !pSc) return

      for (const container of [eSc, pSc]) {
        const el = container.querySelector(`[data-bridge-section="${sectionId}"]`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" })
          el.classList.add("bridge-highlight")
        }
      }

      clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = setTimeout(() => {
        for (const container of [eSc, pSc]) {
          container.querySelectorAll(".bridge-highlight").forEach((n) =>
            n.classList.remove("bridge-highlight"),
          )
        }
      }, 1200)

      setTimeout(() => rebuildAnchors(), 300)
    },
    [rebuildAnchors],
  )

  // Scroll handlers
  useEffect(() => {
    const eSc = editorRef.current
    const pSc = inspectorRef.current
    if (!eSc || !pSc) return

    const onEditorScroll = () => {
      if (activePanelRef.current === "editor") needSyncRef.current = true
      scheduleFrame()
    }
    const onInspectorScroll = () => {
      if (activePanelRef.current === "inspector") needSyncRef.current = true
      scheduleFrame()
    }

    eSc.addEventListener("scroll", onEditorScroll, { passive: true })
    pSc.addEventListener("scroll", onInspectorScroll, { passive: true })
    return () => {
      eSc.removeEventListener("scroll", onEditorScroll)
      pSc.removeEventListener("scroll", onInspectorScroll)
    }
  }, [scheduleFrame])

  // Pointer tracking
  useEffect(() => {
    const eSc = editorRef.current
    const pSc = inspectorRef.current
    if (!eSc || !pSc) return

    const enterE = () => setActivePanel("editor")
    const leaveE = () => setActivePanel((p) => (p === "editor" ? null : p))
    const enterP = () => setActivePanel("inspector")
    const leaveP = () => setActivePanel((p) => (p === "inspector" ? null : p))

    eSc.addEventListener("pointerenter", enterE)
    eSc.addEventListener("pointerleave", leaveE)
    pSc.addEventListener("pointerenter", enterP)
    pSc.addEventListener("pointerleave", leaveP)
    return () => {
      eSc.removeEventListener("pointerenter", enterE)
      eSc.removeEventListener("pointerleave", leaveE)
      pSc.removeEventListener("pointerenter", enterP)
      pSc.removeEventListener("pointerleave", leaveP)
    }
  }, [])

  // Alt key
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltHeld(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltHeld(false)
    }
    document.addEventListener("keydown", down)
    document.addEventListener("keyup", up)
    return () => {
      document.removeEventListener("keydown", down)
      document.removeEventListener("keyup", up)
    }
  }, [])

  // Escape clears relation + field selection (demo05 parity)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      clearRelationSelection()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [clearRelationSelection])

  // Field hover tracking via event delegation
  useEffect(() => {
    const editor = editorRef.current
    const inspector = inspectorRef.current
    if (!editor || !inspector) return

    const onOver = (e: Event) => {
      const el = (e.target as HTMLElement).closest?.("[data-field]")
      setHoveredField(el?.getAttribute("data-field") ?? null)
    }
    const onLeave = () => setHoveredField(null)

    for (const c of [editor, inspector]) {
      c.addEventListener("mouseover", onOver)
      c.addEventListener("mouseleave", onLeave)
    }
    return () => {
      for (const c of [editor, inspector]) {
        c.removeEventListener("mouseover", onOver)
        c.removeEventListener("mouseleave", onLeave)
      }
    }
  }, [])

  // DOM-based field highlight (fa/fm) — centralised for all sections
  useEffect(() => {
    const editor = editorRef.current
    const inspector = inspectorRef.current
    if (!editor || !inspector) return

    const clear = () => {
      for (const c of [editor, inspector]) {
        c.querySelectorAll(".fa").forEach((el) => el.classList.remove("fa"))
        c.querySelectorAll(".fm").forEach((el) => el.classList.remove("fm"))
      }
    }

    clear()

    const field = hoveredField ?? selectedField
    if (!field) return clear

    for (const [container, panel] of [
      [editor, "editor"],
      [inspector, "inspector"],
    ] as const) {
      const els = container.querySelectorAll(`[data-field="${field}"]`)
      const cls = activePanel === panel ? "fa" : "fm"
      els.forEach((el) => el.classList.add(cls))
    }

    return clear
  }, [selectedField, hoveredField, activePanel])

  // Resize observer
  useEffect(() => {
    const layout = layoutRef.current
    if (!layout) return
    const ro = new ResizeObserver(() => requestRedraw())
    ro.observe(layout)
    return () => ro.disconnect()
  }, [requestRedraw])

  // Initial anchor build
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rebuildAnchors()
        scheduleFrame()
      })
    })
    return () => cancelAnimationFrame(timer)
  }, [rebuildAnchors, scheduleFrame])

  return {
    editorRef,
    inspectorRef,
    layoutRef,
    syncEnabled,
    bridgeEnabled,
    toggleSync: useCallback(() => setSyncEnabled((v) => !v), []),
    toggleBridge: useCallback(() => setBridgeEnabled((v) => !v), []),
    altHeld,
    activePanel,
    currentSection,
    editorScrollPct,
    inspectorScrollPct,
    selectedEid,
    selectedField,
    hoveredField,
    relatedEids,
    currentLayer,
    selectRelationTarget,
    selectFieldKey,
    clearRelationSelection,
    toggleLayer,
    clearLayer,
    isSectionDimmed,
    scrollBothToSection,
    editorAllExpanded,
    inspectorAllExpanded,
    expandSyncEnabled,
    editorExpandTick,
    inspectorExpandTick,
    toggleAllEditor: useCallback(() => {
      setEditorAllExpanded((v) => {
        const next = !v
        setEditorExpandTick((t) => t + 1)
        if (expandSyncEnabled) {
          setInspectorAllExpanded(next)
          setInspectorExpandTick((t) => t + 1)
        }
        return next
      })
    }, [expandSyncEnabled]),
    toggleAllInspector: useCallback(() => {
      setInspectorAllExpanded((v) => {
        const next = !v
        setInspectorExpandTick((t) => t + 1)
        if (expandSyncEnabled) {
          setEditorAllExpanded(next)
          setEditorExpandTick((t) => t + 1)
        }
        return next
      })
    }, [expandSyncEnabled]),
    toggleExpandSync: useCallback(() => setExpandSyncEnabled((v) => !v), []),
    requestRedraw,
    drawTick,
  }
}
