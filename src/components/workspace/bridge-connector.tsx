import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import {
  BRIDGE_GUTTER_EXTEND,
  BRIDGE_SECTIONS,
  SECTION_MAP,
} from "@/lib/bridge-sections"

interface BridgeItem {
  id: string
  fillPath: string
  topLine: { x1: number; y1: number; x2: number; y2: number; dashed: boolean }
  bottomLine: { x1: number; y1: number; x2: number; y2: number; dashed: boolean }
  color: string
  name: string
}

interface GapLayout {
  centerX: number
  top: number
}

export function BridgeConnector() {
  const api = usePanelSyncApi()
  const [bridges, setBridges] = useState<BridgeItem[]>([])
  const [gapLayout, setGapLayout] = useState<GapLayout | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [popVisible, setPopVisible] = useState(false)
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    left: number
    top: number
    name: string
  }>({ visible: false, left: 0, top: 0, name: "" })

  const editorRef = api?.editorRef
  const inspectorRef = api?.inspectorRef
  const layoutRef = api?.layoutRef
  const bridgeEnabled = api?.bridgeEnabled ?? false
  const drawTick = api?.drawTick ?? 0

  useEffect(() => {
    if (!api || !layoutRef?.current || !editorRef?.current || !inspectorRef?.current) {
      setBridges([])
      setGapLayout(null)
      return
    }

    const layout = layoutRef.current
    const editor = editorRef.current
    const inspector = inspectorRef.current

    const layoutRect = layout.getBoundingClientRect()
    const editorRect = editor.getBoundingClientRect()
    const inspectorRect = inspector.getBoundingClientRect()

    const gapCenterX = (editorRect.right + inspectorRect.left) / 2 - layoutRect.left
    setGapLayout({ centerX: gapCenterX, top: editorRect.top - layoutRect.top })

    if (!bridgeEnabled) {
      setBridges([])
      return
    }

    const xLeft = editorRect.right - layoutRect.left - BRIDGE_GUTTER_EXTEND
    const xRight = inspectorRect.left - layoutRect.left + BRIDGE_GUTTER_EXTEND

    const matched: { def: (typeof BRIDGE_SECTIONS)[number]; eEl: Element; iEl: Element }[] = []
    const seen = new Set<string>()
    const editorSections = editor.querySelectorAll<HTMLElement>("[data-bridge-section]")
    for (const eEl of editorSections) {
      const id = eEl.getAttribute("data-bridge-section")
      if (!id || seen.has(id)) continue
      seen.add(id)
      const iEl = inspector.querySelector(`[data-bridge-section="${id}"]`)
      if (!iEl) continue
      const def = SECTION_MAP[id] ?? { id, name: id, color: "#64748b", layer: "ops" as const }
      matched.push({ def, eEl, iEl })
    }

    const paired = matched.map(({ def, eEl, iEl }) => ({
      def,
      eRect: eEl.getBoundingClientRect(),
      iRect: iEl.getBoundingClientRect(),
    }))

    const H = layoutRect.height
    const next: BridgeItem[] = []

    for (const { def, eRect, iRect } of paired) {
      const eTop = eRect.top - layoutRect.top
      const eBot = eRect.bottom - layoutRect.top
      const iTop = iRect.top - layoutRect.top
      const iBot = iRect.bottom - layoutRect.top

      if ((eBot < -5 && iBot < -5) || (eTop > H + 5 && iTop > H + 5)) continue

      const topDash = Math.abs(eTop - iTop) > 3
      const botDash = Math.abs(eBot - iBot) > 3

      next.push({
        id: def.id,
        fillPath: `M ${xLeft} ${eTop} L ${xRight} ${iTop} L ${xRight} ${iBot} L ${xLeft} ${eBot} Z`,
        topLine: { x1: xLeft, y1: eTop, x2: xRight, y2: iTop, dashed: topDash },
        bottomLine: { x1: xLeft, y1: eBot, x2: xRight, y2: iBot, dashed: botDash },
        color: def.color,
        name: SECTION_MAP[def.id]?.name ?? def.id,
      })
    }

    setBridges(next)
  }, [api, drawTick, bridgeEnabled, layoutRef, editorRef, inspectorRef])

  useEffect(() => {
    if (!editorRef?.current || !inspectorRef?.current) return
    const editor = editorRef.current
    const inspector = inspectorRef.current

    const clear = () => {
      editor.querySelectorAll(".bridge-highlight").forEach((n) => n.classList.remove("bridge-highlight"))
      inspector.querySelectorAll(".bridge-highlight").forEach((n) => n.classList.remove("bridge-highlight"))
    }

    clear()
    if (hoveredId) {
      editor.querySelector(`[data-bridge-section="${hoveredId}"]`)?.classList.add("bridge-highlight")
      inspector.querySelector(`[data-bridge-section="${hoveredId}"]`)?.classList.add("bridge-highlight")
    }
    return clear
  }, [hoveredId, editorRef, inspectorRef])

  useEffect(() => {
    const editor = editorRef?.current
    const inspector = inspectorRef?.current
    if (!editor || !inspector) return

    const onOver = (e: Event) => {
      const sec = (e.target as HTMLElement).closest?.("[data-bridge-section]")
      setHoveredId(sec?.getAttribute("data-bridge-section") ?? null)
    }
    const onLeave = () => setHoveredId(null)

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
  }, [editorRef, inspectorRef])

  const showPop = useCallback(() => {
    clearTimeout(popTimerRef.current)
    setPopVisible(true)
  }, [])

  const hidePop = useCallback(() => {
    popTimerRef.current = setTimeout(() => setPopVisible(false), 150)
  }, [])

  if (!api) return null

  const { syncEnabled, bridgeEnabled: be, toggleSync, toggleBridge } = api

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 h-full w-full overflow-visible"
          style={{ opacity: be ? 1 : 0, transition: "opacity 0.2s" }}
        >
          {bridges.map((b) => {
            const isHov = hoveredId === b.id
            const isDimmed = api.isSectionDimmed(b.id)
            const fillA = isDimmed ? 0 : isHov ? 0.1 : 0.03
            const lineA = isDimmed ? 0.04 : isHov ? 0.85 : 0.28
            const lineW = isHov ? 1.5 : 0.8
            return (
              <g key={b.id}>
                <path
                  d={b.fillPath}
                  fill={b.color}
                  fillOpacity={fillA}
                  stroke="none"
                  className="cursor-pointer"
                  style={{ pointerEvents: "auto" }}
                  onMouseEnter={() => setHoveredId(b.id)}
                  onMouseMove={(e: ReactMouseEvent) =>
                    setTooltip({ visible: true, left: e.clientX + 12, top: e.clientY - 6, name: b.name })
                  }
                  onMouseLeave={() => {
                    setHoveredId(null)
                    setTooltip((t) => ({ ...t, visible: false }))
                  }}
                  onClick={() => api.scrollBothToSection(b.id)}
                />
                <line
                  x1={b.topLine.x1} y1={b.topLine.y1}
                  x2={b.topLine.x2} y2={b.topLine.y2}
                  stroke={b.color}
                  strokeWidth={lineW}
                  strokeOpacity={lineA}
                  strokeDasharray={b.topLine.dashed ? "4 3" : undefined}
                  style={{ pointerEvents: "none" }}
                />
                <line
                  x1={b.bottomLine.x1} y1={b.bottomLine.y1}
                  x2={b.bottomLine.x2} y2={b.bottomLine.y2}
                  stroke={b.color}
                  strokeWidth={lineW}
                  strokeOpacity={lineA}
                  strokeDasharray={b.bottomLine.dashed ? "4 3" : undefined}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 z-[32] overflow-visible">
        {gapLayout && (
          <div
            className="pointer-events-auto absolute z-30"
            style={{
              left: gapLayout.centerX - 14,
              top: gapLayout.top - 34,
              width: 28,
              height: 28,
            }}
            onMouseEnter={showPop}
            onMouseLeave={hidePop}
          >
            <div className="flex h-full w-full items-center justify-center rounded-md text-muted-foreground/30 transition-all hover:text-muted-foreground/80">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            {popVisible && (
              <div
                className="absolute left-1/2 top-full z-40 mt-1 w-max -translate-x-1/2 rounded-lg p-3 text-xs shadow-lg"
                style={{ background: '#1c1c20', border: '1px solid #333', color: 'var(--foreground)' }}
                onMouseEnter={() => clearTimeout(popTimerRef.current)}
                onMouseLeave={hidePop}
              >
                <div className="mb-2 text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                  面板联动
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-accent" onClick={toggleSync}>
                  <Toggle on={syncEnabled} />
                  <span>滚动同步</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-accent" onClick={toggleBridge}>
                  <Toggle on={be} />
                  <span>桥线连接</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-accent" onClick={api.toggleExpandSync}>
                  <Toggle on={api.expandSyncEnabled} />
                  <span>折叠联动</span>
                </label>
                <div className="mt-2 border-t pt-2 text-[9px] text-muted-foreground">
                  <kbd className="rounded border border-border bg-muted/50 px-1 font-mono text-[9px]">Alt</kbd>
                  {" "}+ 滚动 = 临时独立滚动
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className="pointer-events-none fixed z-[300] rounded-[5px] px-2 py-1 text-[10px] text-muted-foreground shadow-md"
        style={{
          background: '#1c1c20',
          border: '1px solid #333',
          left: tooltip.left,
          top: tooltip.top,
          display: tooltip.visible ? "block" : "none",
        }}
      >
        {tooltip.name} — 点击双面板跳转
      </div>
    </>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className="relative h-[15px] w-7 flex-shrink-0 rounded-full transition-colors"
      style={{ background: on ? "rgba(20,184,166,0.35)" : "var(--border)" }}
    >
      <div
        className="absolute top-[2px] h-[11px] w-[11px] rounded-full transition-all"
        style={{
          left: on ? 14 : 2,
          background: on ? "#14b8a6" : "var(--muted-foreground)",
        }}
      />
    </div>
  )
}
