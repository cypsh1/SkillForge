import type { ReactNode } from "react"
import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import { SECTION_MAP } from "@/lib/bridge-sections"

const FALLBACK = "#64748b"

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted/50 px-1 py-px font-mono text-[9px] text-muted-foreground">
      {children}
    </kbd>
  )
}

export function ContextBar() {
  const api = usePanelSyncApi()
  if (!api) return null

  const { altHeld, currentSection, editorScrollPct, inspectorScrollPct } = api
  const meta = currentSection ? SECTION_MAP[currentSection.id] : undefined
  const name = meta?.name ?? currentSection?.id ?? "—"
  const pos =
    currentSection && currentSection.total > 0
      ? `(${currentSection.index + 1}/${currentSection.total})`
      : ""
  const leftColor = meta?.color ?? FALLBACK

  return (
    <div className="flex h-7 items-center gap-0 border-t border-border bg-card px-4 text-[10px] text-muted-foreground">
      <div className="flex min-w-0 items-center gap-1">
        <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ backgroundColor: leftColor }} />
        <span className="truncate text-foreground/90">{name}</span>
        {pos ? <span className="shrink-0 font-mono text-[9px] tabular-nums">{pos}</span> : null}
      </div>
      <span className="shrink-0 mx-2 text-border" aria-hidden>
        ·
      </span>
      <div className="flex shrink-0 items-center gap-1 font-mono text-[9px]">
        <span className="text-[8px]">左</span>
        <div className="h-[3px] w-10 overflow-hidden rounded-sm bg-border">
          <div
            className="h-full rounded-sm transition-[width] duration-75"
            style={{ width: `${editorScrollPct}%`, backgroundColor: leftColor }}
          />
        </div>
        <span className="tabular-nums">{editorScrollPct}%</span>
        <span className="mx-0.5 text-muted-foreground/50" aria-hidden>↔</span>
        <span className="text-[8px]">右</span>
        <div className="h-[3px] w-10 overflow-hidden rounded-sm bg-border">
          <div
            className="h-full rounded-sm bg-emerald-500 transition-[width] duration-75"
            style={{ width: `${inspectorScrollPct}%` }}
          />
        </div>
        <span className="tabular-nums">{inspectorScrollPct}%</span>
      </div>
      <span className="shrink-0 mx-2 text-border" aria-hidden>
        ·
      </span>
      {altHeld ? (
        <span className="shrink-0 text-amber-400">⚡ 独立滚动中</span>
      ) : (
        <span className="flex min-w-0 flex-wrap items-center gap-0.5 text-muted-foreground/70">
          <Kbd>Alt</Kbd>
          <span>+</span>
          <Kbd>滚动</Kbd>
          <span>= 独立滚动</span>
        </span>
      )}
    </div>
  )
}
