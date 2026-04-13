import { useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { usePanelSyncApi } from "@/hooks/use-panel-sync"

export interface SectionBlockProps {
  sectionId?: string
  title: string
  color?: string
  badge?: string
  readOnly?: boolean
  editable?: boolean
  editing?: boolean
  onEdit?: () => void
  onCancel?: () => void
  onDone?: () => void
  onTitleChange?: (newTitle: string) => void
  defaultCollapsed?: boolean
  dimmed?: boolean
  children: ReactNode
}

export function SectionBlock({
  sectionId,
  title,
  color = "#64748b",
  badge,
  readOnly,
  editable,
  editing,
  onEdit,
  onCancel,
  onDone,
  onTitleChange,
  defaultCollapsed,
  dimmed,
  children,
}: SectionBlockProps) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false)
  const api = usePanelSyncApi()
  const expandTickRef = useRef(api?.editorExpandTick ?? 0)

  useEffect(() => {
    if (!api || api.editorExpandTick === expandTickRef.current) return
    expandTickRef.current = api.editorExpandTick
    setCollapsed(!api.editorAllExpanded)
  }, [api?.editorExpandTick, api?.editorAllExpanded])

  return (
    <div
      data-bridge-section={sectionId}
      style={{ borderLeftColor: `color-mix(in srgb, ${color} 32%, transparent)` }}
      className={cn(
        collapsed && "bridge-section-collapsed",
        readOnly && "bridge-section-readonly",
        editing && "editing",
        dimmed && "bridge-dim",
      )}
    >
      <div
        className="bridge-section-header"
        onClick={() => sectionId && api?.scrollBothToSection(sectionId)}
      >
        <span
          className="bridge-section-caret text-[8px] text-muted-foreground transition-transform"
          style={{ transform: collapsed ? "rotate(-90deg)" : undefined }}
          onClick={(e) => {
            e.stopPropagation()
            setCollapsed(!collapsed)
          }}
        >
          ▼
        </span>
        <span className="bridge-section-dot" style={{ backgroundColor: color }} />
        {editing && onTitleChange ? (
          <input
            className="text-xs font-semibold bg-transparent border-b border-muted-foreground/30 outline-none px-0 py-0 w-auto min-w-[60px]"
            value={title}
            onChange={(e) => { e.stopPropagation(); onTitleChange(e.target.value) }}
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "inherit" }}
          />
        ) : (
          <span className="text-xs font-semibold">{title}</span>
        )}
        {badge && <span className="bridge-badge">{badge}</span>}
        {readOnly && (
          <span
            className="text-[9px] px-[5px] py-px rounded-lg inline-flex items-center gap-[3px]"
            style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted-foreground)" }}
          >
            🔒 {t("workspace.action.readOnly")}
          </span>
        )}
        {editable && !editing && (
          <button type="button" className="eb" onClick={(e) => { e.stopPropagation(); onEdit?.() }}>
            {t("workspace.action.edit")}
          </button>
        )}
        {editing && (
          <span className="eb-group">
            <span className="editing-ind">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg>
              {t("workspace.action.editing")}
            </span>
            <button type="button" className="eb-cancel" onClick={(e) => { e.stopPropagation(); onCancel?.() }}>
              {t("workspace.action.cancel")}
            </button>
            <button type="button" className="eb-done" onClick={(e) => { e.stopPropagation(); onDone?.() }}>
              {t("workspace.action.done")}
            </button>
          </span>
        )}
      </div>
      <div className="bridge-section-content">{children}</div>
    </div>
  )
}
