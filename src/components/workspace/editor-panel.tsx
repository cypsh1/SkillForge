import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import {
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  FileText,
  Layers,
  Settings,
  ShieldCheck,
} from "lucide-react"
import { EmptyState } from "@/components/empty-state"

const SourcesEditor = lazy(() => import("@/components/config-editor/sources-editor").then(m => ({ default: m.SourcesEditor })))
const TopicsEditor = lazy(() => import("@/components/config-editor/topics-editor").then(m => ({ default: m.TopicsEditor })))
const SchemaViewer = lazy(() => import("@/components/config-editor/schema-viewer").then(m => ({ default: m.SchemaViewer })))
const ExtraFileEditor = lazy(() => import("@/components/workspace/extra-file-editors").then(m => ({ default: m.ExtraFileEditor })))
const ValidationPanel = lazy(() => import("@/components/skill-editor/validation-panel").then(m => ({ default: m.ValidationPanel })))
import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import { useWorkspace } from "@/hooks/use-workspace"
import { BRIDGE_SECTIONS } from "@/lib/bridge-sections"
import { getRelationCountSummary } from "@/lib/bridge-relations"
import { getOpenclawMetadata, getOpenclawMetadataKey } from "@/lib/schemas/frontmatter-schema"
import { SectionBlock } from "@/components/workspace/section-block"
import { cn } from "@/lib/utils"
import { validateSkill } from "@/lib/skill-validator"
import { FragmentBlock } from "@/components/workspace/fragment-renderer"
import { serializeDocument } from "@/lib/markdown-engine"
import type { ContentBlock } from "@/types/content-fragment"
import type { NavigatorSelection } from "@/types/workspace"
import type { ParsedSkill, SkillFrontmatter, SkillTool, EnvVarDefinition } from "@/types/skill"

function configEditorKind(filePath: string): "sources" | "topics" | "schema" | null {
  const base = filePath.split("/").pop() ?? filePath
  if (base === "sources.json") return "sources"
  if (base === "topics.json") return "topics"
  if (base === "schema.json") return "schema"
  return null
}

function isSourcesConfig(data: unknown): data is Record<string, unknown> & { sources: unknown[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as { sources?: unknown }).sources)
  )
}

function isTopicsConfig(data: unknown): data is Record<string, unknown> & { topics: unknown[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as { topics?: unknown }).topics)
  )
}

function isSchemaRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null && !Array.isArray(data)
}

function headerIcon(nodeType: NavigatorSelection["nodeType"]) {
  switch (nodeType) {
    case "skill-overview":
      return Layers
    case "skill-md":
      return FileText
    case "config-file":
      return Settings
    case "extra-file":
      return FileText
    default:
      return FileText
  }
}

function bridgeColor(sectionId: string): string {
  return BRIDGE_SECTIONS.find((s) => s.id === sectionId)?.color ?? "#64748b"
}

function normalizeFileList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (typeof item === "string") return item
    if (typeof item === "object" && item !== null) {
      return Object.entries(item)
        .map(([k, v]) => (v ? `${k}: ${v}` : k))
        .join(", ")
    }
    return String(item)
  })
}

function mergeSkillForValidation(
  base: ParsedSkill,
  frontmatter: ParsedSkill["frontmatter"],
  configFiles: Record<string, unknown>,
): ParsedSkill {
  return {
    ...base,
    frontmatter,
    configFiles,
    hasConfig: base.hasConfig || Object.keys(configFiles).length > 0,
  }
}

/** 文件权限路径 → bridge eid（与 demo05 / bridge-relations 键一致） */
function pathToFileEid(path: string): string | null {
  const p = path.trim()
  if (p.includes("config/defaults/")) return "config-defaults"
  if (p.startsWith("references/") || p.includes("/references/")) return "references-dir"
  if (p.startsWith("scripts/") || p.includes("/scripts/")) return "scripts-dir"
  return null
}

function RelationIndicator({ eid, fieldKey }: { eid: string; fieldKey?: string }) {
  const summary = getRelationCountSummary(eid)
  const { forward, alternate, contains } = summary
  if (forward + alternate + contains === 0) return null
  const parts: string[] = []
  if (forward > 0) parts.push(`→${forward}`)
  if (alternate > 0) parts.push(`↔${alternate}`)
  if (contains > 0) parts.push(`⊂${contains}`)
  return (
    <span
      className="ri"
      data-ri={eid}
      data-eid={eid}
      data-field={fieldKey}
      aria-hidden
    >
      {parts.map((p) => (
        <span key={p} className="rp">{p}</span>
      ))}
    </span>
  )
}

function EidText({
  eid,
  fieldKey,
  className,
  children,
}: {
  eid: string
  fieldKey?: string
  className?: string
  children: ReactNode
}) {
  const api = usePanelSyncApi()
  const selectedEid = api?.selectedEid ?? null
  const relatedEids = api?.relatedEids ?? []
  const summary = getRelationCountSummary(eid)
  const hasRel =
    summary.forward > 0 || summary.alternate > 0 || summary.contains > 0

  const isSelected = selectedEid != null && selectedEid === eid
  const isRelated =
    selectedEid != null && !isSelected && relatedEids.includes(eid)
  const isDimmed =
    selectedEid != null && !isSelected && !relatedEids.includes(eid)

  return (
    <span
      className={cn(
        "en",
        className,
        hasRel && "has-rel",
        isSelected && "eid-selected",
        isRelated && "eid-related",
        isDimmed && "eid-dimmed",
      )}
      data-eid={eid}
      data-field={fieldKey}
    >
      {children}
    </span>
  )
}

function ToolsBlock({ tools }: { tools: SkillTool[] }) {
  const { t } = useTranslation()
  if (tools.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("workspace.empty.noTools")}</p>
  }
  return (
    <div>
      {tools.map((tool, i) => {
        const fieldKey = `f-t-${tool.name}`
        return (
        <div key={i} className="tc" data-field={fieldKey}>
          <div className="flex items-start justify-between">
            <div>
              <span className="tn">
                <EidText eid={tool.name} fieldKey={fieldKey}>
                  {tool.name}
                </EidText>
              </span>
              {tool.description ? (
                <span className="td"> — {tool.description}</span>
              ) : null}
            </div>
            <RelationIndicator eid={tool.name} fieldKey={fieldKey} />
          </div>
        </div>
        )
      })}
    </div>
  )
}

function BasicInfoDisplay({ fm }: { fm: SkillFrontmatter }) {
  const { t } = useTranslation()
  const rows: { label: string; value: string; field: string; isLink?: boolean }[] = [
    { label: t("workspace.field.emoji"), value: fm.emoji || "—", field: "f-emoji" },
    { label: t("workspace.field.name"), value: fm.name || "—", field: "f-name" },
    { label: t("workspace.field.description"), value: fm.description || "—", field: "f-desc" },
    { label: t("workspace.field.version"), value: fm.version || "—", field: "f-ver" },
    { label: t("workspace.field.author"), value: fm.author || "—", field: "f-author" },
    { label: t("workspace.field.homepage"), value: fm.homepage || "—", field: "f-home", isLink: !!fm.homepage },
  ]
  return (
    <div className="ecard">
      {rows.map((r) => (
        <div key={r.field} className="fr" data-field={r.field}>
          <span className="fl">{r.label}</span>
          {r.isLink ? (
            <a href={r.value} target="_blank" rel="noreferrer" className="fv" style={{ color: '#3b82f6' }}>
              {r.value}
            </a>
          ) : (
            <span className="fv">{r.value}</span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ===== Helpers for inline editing ===== */

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((s): s is string => typeof s === "string")
  if (typeof val === "string") return val ? [val] : []
  return []
}

function InlineTagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const { t } = useTranslation()
  const [input, setInput] = useState("")
  return (
    <div className="fta">
      {tags.map((tag, i) => (
        <span key={i} className="ftag">
          {tag}
          <span className="ftag-x" onClick={() => onChange(tags.filter((_, j) => j !== i))}>×</span>
        </span>
      ))}
      <input
        className="fti"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            const v = input.trim()
            if (v && !tags.includes(v)) onChange([...tags, v])
            setInput("")
          } else if (e.key === "Backspace" && !input && tags.length > 0) {
            onChange(tags.slice(0, -1))
          }
        }}
        placeholder={placeholder ?? t("workspace.action.inputEnterToAdd")}
      />
    </div>
  )
}

function InlineToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { t } = useTranslation()
  return (
    <div className="ftg" onClick={() => onChange(!value)}>
      <div className={cn("ftg-track", value && "on")} />
      <span className="ftg-lbl">{value ? t("workspace.bool.yes") : t("workspace.bool.no")}</span>
    </div>
  )
}

/* ===== TriggerDisplay — 展示态 ===== */

function TriggerDisplay({ fm }: { fm: SkillFrontmatter }) {
  const { t } = useTranslation()

  // Only collect fields that actually exist in the frontmatter
  const rows: { field: string; label: string; node: React.ReactNode }[] = []

  const triggers = toStringArray(fm.triggers)
  if (triggers.length > 0) {
    rows.push({ field: "f-triggers", label: t("workspace.field.triggers"), node: triggers.map((tag, i) => <span key={i} className="tg-pill">{tag}</span>) })
  }
  const readWhen = toStringArray(fm.read_when)
  if (readWhen.length > 0) {
    rows.push({ field: "f-readwhen", label: t("workspace.field.readWhen"), node: readWhen.map((tag, i) => <span key={i} className="tg-pill">{tag}</span>) })
  }
  if (fm.auto_trigger !== undefined) {
    rows.push({ field: "f-autotrigger", label: t("workspace.field.autoTrigger"), node: fm.auto_trigger ? <span className="bool-on">{t("workspace.bool.yes")}</span> : <span className="bool-off">{t("workspace.bool.no")}</span> })
  }
  if (fm["user-invocable"] !== undefined) {
    rows.push({ field: "f-userinvocable", label: t("workspace.field.userInvocable"), node: fm["user-invocable"] ? <span className="bool-on">{t("workspace.bool.yes")}</span> : <span className="bool-off">{t("workspace.bool.no")}</span> })
  }
  if (fm["disable-model-invocation"] !== undefined) {
    rows.push({ field: "f-disablemodel", label: t("workspace.field.disableModel"), node: fm["disable-model-invocation"] ? <span className="bool-on">{t("workspace.bool.yes")}</span> : <span className="bool-off">{t("workspace.bool.no")}</span> })
  }
  if (fm["command-dispatch"]) {
    rows.push({ field: "f-cmddispatch", label: t("workspace.field.cmdDispatch"), node: <span className="font-mono">{fm["command-dispatch"]}</span> })
  }
  if (fm["command-tool"]) {
    rows.push({ field: "f-cmdtool", label: t("workspace.field.cmdTool"), node: <span className="font-mono">{fm["command-tool"]}</span> })
  }
  if (fm["command-arg-mode"]) {
    rows.push({ field: "f-cmdargmode", label: t("workspace.field.argMode"), node: <span className="font-mono">{fm["command-arg-mode"]}</span> })
  }
  if (fm["allowed-tools"]) {
    rows.push({ field: "f-allowedtools", label: t("workspace.field.allowedTools"), node: <span className="font-mono">{fm["allowed-tools"]}</span> })
  }

  if (rows.length === 0) {
    return <p className="text-[10px] text-muted-foreground pl-1">{t("form.trigger.empty")}</p>
  }

  return (
    <div className="ecard">
      {rows.map(({ field, label, node }) => (
        <div key={field} className="fr" data-field={field}>
          <span className="fl">{label}</span>
          <span className="fv">{node}</span>
        </div>
      ))}
    </div>
  )
}

/* ===== Inline Edit Forms ===== */

type BasicDraft = { emoji: string; name: string; description: string; version: string; author: string; homepage: string; source: string }

function BasicEditForm({ draft, onChange }: { draft: BasicDraft; onChange: (d: BasicDraft) => void }) {
  const { t } = useTranslation()
  const set = (key: keyof BasicDraft, value: string) => onChange({ ...draft, [key]: value })
  return (
    <div className="ecard">
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.emoji")}</span><input className="fi" value={draft.emoji} onChange={(e) => set("emoji", e.target.value)} style={{ maxWidth: 48, textAlign: 'center' }} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.name")}</span><input className="fi" value={draft.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div className="ef-row ef-row-top"><span className="ef-lbl">{t("workspace.field.description")}</span><textarea className="fi ft" value={draft.description} onChange={(e) => set("description", e.target.value)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.version")}</span><input className="fi" value={draft.version} onChange={(e) => set("version", e.target.value)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.author")}</span><input className="fi" value={draft.author} onChange={(e) => set("author", e.target.value)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.homepage")}</span><input className="fi" value={draft.homepage} onChange={(e) => set("homepage", e.target.value)} type="url" /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.source")}</span><input className="fi" value={draft.source} onChange={(e) => set("source", e.target.value)} placeholder="https://..." /></div>
    </div>
  )
}

type TriggerDraft = { triggers: string[]; readWhen: string[]; autoTrigger: boolean; userInvocable: boolean; disableModel: boolean; cmdDispatch: string; cmdTool: string; cmdArgMode: string; allowedTools: string }

function TriggerEditForm({ draft, onChange }: { draft: TriggerDraft; onChange: (d: TriggerDraft) => void }) {
  const { t } = useTranslation()
  const set = <K extends keyof TriggerDraft>(key: K, value: TriggerDraft[K]) => onChange({ ...draft, [key]: value })
  return (
    <div className="ecard">
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.triggers")}</span><InlineTagInput tags={draft.triggers} onChange={(v) => set("triggers", v)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.readWhen")}</span><InlineTagInput tags={draft.readWhen} onChange={(v) => set("readWhen", v)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.autoTrigger")}</span><InlineToggle value={draft.autoTrigger} onChange={(v) => set("autoTrigger", v)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.userInvocable")}</span><InlineToggle value={draft.userInvocable} onChange={(v) => set("userInvocable", v)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.disableModel")}</span><InlineToggle value={draft.disableModel} onChange={(v) => set("disableModel", v)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.cmdDispatch")}</span><input className="fi" value={draft.cmdDispatch} onChange={(e) => set("cmdDispatch", e.target.value)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.cmdTool")}</span><input className="fi" value={draft.cmdTool} onChange={(e) => set("cmdTool", e.target.value)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.argMode")}</span><input className="fi" value={draft.cmdArgMode} onChange={(e) => set("cmdArgMode", e.target.value)} placeholder="positional / keyword" /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.allowedTools")}</span><input className="fi" value={draft.allowedTools} onChange={(e) => set("allowedTools", e.target.value)} placeholder={t("workspace.field.allowedToolsPlaceholder")} /></div>
    </div>
  )
}

type MetaDraft = { requiredBins: string[]; optionalBins: string[]; os: string[]; primaryEnv: string }

function MetaEditForm({ draft, onChange }: { draft: MetaDraft; onChange: (d: MetaDraft) => void }) {
  const { t } = useTranslation()
  const set = <K extends keyof MetaDraft>(key: K, value: MetaDraft[K]) => onChange({ ...draft, [key]: value })
  return (
    <div className="ecard">
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.requiredDeps")}</span><InlineTagInput tags={draft.requiredBins} onChange={(v) => set("requiredBins", v)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.optionalDeps")}</span><InlineTagInput tags={draft.optionalBins} onChange={(v) => set("optionalBins", v)} /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.os")}</span><InlineTagInput tags={draft.os} onChange={(v) => set("os", v)} placeholder="darwin / linux / win32" /></div>
      <div className="ef-row"><span className="ef-lbl">{t("workspace.field.primaryEnv")}</span><input className="fi" value={draft.primaryEnv} onChange={(e) => set("primaryEnv", e.target.value)} /></div>
    </div>
  )
}

function EnvEditForm({ draft, onChange }: { draft: EnvVarDefinition[]; onChange: (d: EnvVarDefinition[]) => void }) {
  const { t } = useTranslation()
  const updateRow = (i: number, field: keyof EnvVarDefinition, value: string | boolean) => {
    onChange(draft.map((row, j) => j === i ? { ...row, [field]: value } : row))
  }
  const removeRow = (i: number) => onChange(draft.filter((_, j) => j !== i))
  const addRow = () => onChange([...draft, { name: "", required: false, description: "" }])

  return (
    <div>
      <table className="et w-full">
        <thead><tr><th>{t("workspace.field.varName")}</th><th>{t("workspace.field.required")}</th><th>{t("workspace.field.description")}</th><th style={{ width: 24 }} /></tr></thead>
        <tbody>
          {draft.map((row, i) => (
            <tr key={i}>
              <td><input className="fi" value={row.name} onChange={(e) => updateRow(i, "name", e.target.value)} style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }} /></td>
              <td><InlineToggle value={row.required ?? false} onChange={(v) => updateRow(i, "required", v)} /></td>
              <td><input className="fi" value={row.description ?? ""} onChange={(e) => updateRow(i, "description", e.target.value)} /></td>
              <td><button type="button" className="et-del" onClick={() => removeRow(i)}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="et-add" onClick={addRow}>{t("workspace.action.addEnvVar")}</div>
    </div>
  )
}

type FilesDraft = { read: string[]; write: string[] }

function FilesEditForm({ draft, onChange }: { draft: FilesDraft; onChange: (d: FilesDraft) => void }) {
  const { t } = useTranslation()
  const updateItem = (key: "read" | "write", index: number, value: string) => {
    onChange({ ...draft, [key]: draft[key].map((v, i) => i === index ? value : v) })
  }
  const removeItem = (key: "read" | "write", index: number) => {
    onChange({ ...draft, [key]: draft[key].filter((_, i) => i !== index) })
  }
  const addItem = (key: "read" | "write") => {
    onChange({ ...draft, [key]: [...draft[key], ""] })
  }

  return (
    <div className="ecard">
      <div className="ef-row" style={{ alignItems: 'flex-start' }}>
        <span className="ef-lbl" style={{ paddingTop: 5 }}>📖 {t("workspace.field.read")}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {draft.read.map((p, i) => (
            <div key={i} className="fl-item">
              <input className="fi" value={p} onChange={(e) => updateItem("read", i, e.target.value)} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }} />
              <button type="button" className="et-del" onClick={() => removeItem("read", i)}>×</button>
            </div>
          ))}
          <div className="fl-add" onClick={() => addItem("read")}>{t("workspace.action.addReadPath")}</div>
        </div>
      </div>
      <div className="ef-row" style={{ alignItems: 'flex-start' }}>
        <span className="ef-lbl" style={{ paddingTop: 5 }}>✏️ {t("workspace.field.write")}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {draft.write.map((p, i) => (
            <div key={i} className="fl-item">
              <input className="fi" value={p} onChange={(e) => updateItem("write", i, e.target.value)} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }} />
              <button type="button" className="et-del" onClick={() => removeItem("write", i)}>×</button>
            </div>
          ))}
          <div className="fl-add" onClick={() => addItem("write")}>{t("workspace.action.addWritePath")}</div>
        </div>
      </div>
    </div>
  )
}

function SkillMdPanel({
  skill,
  fm,
  onChange,
  onBodyChange,
}: {
  skill: ParsedSkill
  fm: SkillFrontmatter
  onChange: (updated: SkillFrontmatter) => void
  onBodyChange: (body: string) => void
}) {
  const { t } = useTranslation()
  const api = usePanelSyncApi()

  const readList = normalizeFileList(fm.files?.read)
  const writeList = normalizeFileList(fm.files?.write)
  const envRows = fm.env ?? []
  const triggers = toStringArray(fm.triggers)

  // --- Per-section editing state ---
  const [editingBasic, setEditingBasic] = useState(false)
  const [editingTrigger, setEditingTrigger] = useState(false)
  const [editingMeta, setEditingMeta] = useState(false)
  const [editingEnv, setEditingEnv] = useState(false)
  const [editingFiles, setEditingFiles] = useState(false)

  const [basicDraft, setBasicDraft] = useState<BasicDraft>({ emoji: "", name: "", description: "", version: "", author: "", homepage: "", source: "" })
  const [triggerDraft, setTriggerDraft] = useState<TriggerDraft>({ triggers: [], readWhen: [], autoTrigger: false, userInvocable: true, disableModel: false, cmdDispatch: "", cmdTool: "", cmdArgMode: "", allowedTools: "" })
  const [metaDraft, setMetaDraft] = useState<MetaDraft>({ requiredBins: [], optionalBins: [], os: [], primaryEnv: "" })
  const [envDraft, setEnvDraft] = useState<EnvVarDefinition[]>([])
  const [filesDraft, setFilesDraft] = useState<FilesDraft>({ read: [], write: [] })

  // --- Start edit: snapshot fm fields to draft ---
  const startEditBasic = useCallback(() => {
    setBasicDraft({ emoji: fm.emoji ?? "", name: fm.name ?? "", description: fm.description ?? "", version: fm.version ?? "", author: fm.author ?? "", homepage: fm.homepage ?? "", source: fm.source ?? "" })
    setEditingBasic(true)
  }, [fm])

  const startEditTrigger = useCallback(() => {
    setTriggerDraft({
      triggers: [...toStringArray(fm.triggers)],
      readWhen: [...toStringArray(fm.read_when)],
      autoTrigger: fm.auto_trigger ?? false,
      userInvocable: fm["user-invocable"] ?? true,
      disableModel: fm["disable-model-invocation"] ?? false,
      cmdDispatch: fm["command-dispatch"] ?? "",
      cmdTool: fm["command-tool"] ?? "",
      cmdArgMode: fm["command-arg-mode"] ?? "",
      allowedTools: fm["allowed-tools"] ?? "",
    })
    setEditingTrigger(true)
  }, [fm])

  const startEditMeta = useCallback(() => {
    const oc = getOpenclawMetadata(fm.metadata)
    setMetaDraft({
      requiredBins: [...(oc?.requires?.bins ?? [])],
      optionalBins: [...(oc?.optionalBins ?? [])],
      os: [...(oc?.os ?? [])],
      primaryEnv: oc?.primaryEnv ?? "",
    })
    setEditingMeta(true)
  }, [fm])

  const startEditEnv = useCallback(() => {
    setEnvDraft(structuredClone(fm.env ?? []))
    setEditingEnv(true)
  }, [fm])

  const startEditFiles = useCallback(() => {
    setFilesDraft({ read: normalizeFileList(fm.files?.read), write: normalizeFileList(fm.files?.write) })
    setEditingFiles(true)
  }, [fm])

  // --- Save: merge draft back to fm ---
  const saveBasic = useCallback(() => {
    onChange({ ...fm, emoji: basicDraft.emoji || undefined, name: basicDraft.name, description: basicDraft.description || undefined, version: basicDraft.version || undefined, author: basicDraft.author || undefined, homepage: basicDraft.homepage || undefined, source: basicDraft.source || undefined })
    setEditingBasic(false)
  }, [fm, basicDraft, onChange])

  const saveTrigger = useCallback(() => {
    onChange({
      ...fm,
      triggers: triggerDraft.triggers.length > 0 ? triggerDraft.triggers : undefined,
      read_when: triggerDraft.readWhen.length > 0 ? triggerDraft.readWhen : undefined,
      auto_trigger: triggerDraft.autoTrigger || undefined,
      "user-invocable": fm["user-invocable"] !== undefined ? triggerDraft.userInvocable : (triggerDraft.userInvocable === false ? false : undefined),
      "disable-model-invocation": triggerDraft.disableModel || undefined,
      "command-dispatch": triggerDraft.cmdDispatch || undefined,
      "command-tool": triggerDraft.cmdTool || undefined,
      "command-arg-mode": triggerDraft.cmdArgMode || undefined,
      "allowed-tools": triggerDraft.allowedTools || undefined,
    })
    setEditingTrigger(false)
  }, [fm, triggerDraft, onChange])

  const saveMeta = useCallback(() => {
    const metaKey = getOpenclawMetadataKey(fm.metadata)
    const currentOc = ((fm.metadata?.[metaKey] ?? {}) as Record<string, unknown>)
    const updatedOc = {
      ...currentOc,
      requires: { ...((currentOc.requires as Record<string, unknown>) ?? {}), bins: metaDraft.requiredBins.length > 0 ? metaDraft.requiredBins : undefined },
      optionalBins: metaDraft.optionalBins.length > 0 ? metaDraft.optionalBins : undefined,
      os: metaDraft.os.length > 0 ? metaDraft.os : undefined,
      primaryEnv: metaDraft.primaryEnv || undefined,
    }
    onChange({ ...fm, metadata: { ...(fm.metadata ?? {}), [metaKey]: updatedOc } })
    setEditingMeta(false)
  }, [fm, metaDraft, onChange])

  const saveEnv = useCallback(() => {
    onChange({ ...fm, env: envDraft.filter((r) => r.name.trim()) })
    setEditingEnv(false)
  }, [fm, envDraft, onChange])

  const saveFiles = useCallback(() => {
    onChange({ ...fm, files: { read: filesDraft.read.filter((p) => p.trim()), write: filesDraft.write.filter((p) => p.trim()) } })
    setEditingFiles(false)
  }, [fm, filesDraft, onChange])

  return (
    <div>
      {/* ====== basic ====== */}
      <SectionBlock
        sectionId="basic"
        title={t("workspace.section.basicInfo")}
        color={bridgeColor("basic")}
        editable
        editing={editingBasic}
        onEdit={startEditBasic}
        onCancel={() => setEditingBasic(false)}
        onDone={saveBasic}
        dimmed={api?.isSectionDimmed("basic")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → name, description, version, emoji, author, homepage
        </p>
        {editingBasic ? (
          <BasicEditForm draft={basicDraft} onChange={setBasicDraft} />
        ) : (
          <BasicInfoDisplay fm={fm} />
        )}
      </SectionBlock>

      {/* ====== trigger ====== */}
      <SectionBlock
        sectionId="trigger"
        title={t("workspace.section.trigger")}
        color={bridgeColor("trigger")}
        badge={triggers.length > 0 ? t("workspace.section.triggerCount", { count: triggers.length }) : undefined}
        editable
        editing={editingTrigger}
        onEdit={startEditTrigger}
        onCancel={() => setEditingTrigger(false)}
        onDone={saveTrigger}
        dimmed={api?.isSectionDimmed("trigger")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → triggers, read_when, auto_trigger, command-*
        </p>
        {editingTrigger ? (
          <TriggerEditForm draft={triggerDraft} onChange={setTriggerDraft} />
        ) : (
          <TriggerDisplay fm={fm} />
        )}
      </SectionBlock>

      {/* ====== meta ====== */}
      <SectionBlock
        sectionId="meta"
        title={t("workspace.section.metadata")}
        color={bridgeColor("meta")}
        editable
        editing={editingMeta}
        onEdit={startEditMeta}
        onCancel={() => setEditingMeta(false)}
        onDone={saveMeta}
        dimmed={api?.isSectionDimmed("meta")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → metadata.openclaw
        </p>
        {editingMeta ? (
          <MetaEditForm draft={metaDraft} onChange={setMetaDraft} />
        ) : (
          <MetaOpenclawView fm={fm} />
        )}
      </SectionBlock>

      {/* ====== env ====== */}
      <SectionBlock
        sectionId="env"
        title={t("workspace.section.envVars")}
        color={bridgeColor("env")}
        badge={`${fm.env?.length ?? 0}`}
        editable
        editing={editingEnv}
        onEdit={startEditEnv}
        onCancel={() => setEditingEnv(false)}
        onDone={saveEnv}
        dimmed={api?.isSectionDimmed("env")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → env[]
        </p>
        {editingEnv ? (
          <EnvEditForm draft={envDraft} onChange={setEnvDraft} />
        ) : envRows.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-3">{t("workspace.empty.noEnvVars")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="et w-full">
              <thead><tr><th>{t("workspace.field.varName")}</th><th>{t("workspace.field.required")}</th><th>{t("workspace.field.description")}</th><th /></tr></thead>
              <tbody>
                {envRows.map((row, i) => {
                  const fieldKey = `f-e-${row.name}`
                  return (
                    <tr key={i} data-field={fieldKey}>
                      <td><span className="en font-mono text-[10px] font-semibold"><EidText eid={row.name} fieldKey={fieldKey}>{row.name}</EidText></span></td>
                      <td>{row.required ? t("workspace.field.required") : t("workspace.field.optional")}</td>
                      <td className="ed">{row.description ?? "—"}</td>
                      <td className="rc"><RelationIndicator eid={row.name} fieldKey={fieldKey} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>

      {/* ====== tools (readonly) ====== */}
      <SectionBlock
        sectionId="tools"
        title={t("workspace.section.tools")}
        color={bridgeColor("tools")}
        badge={`${skill.tools.length}`}
        readOnly
        dimmed={api?.isSectionDimmed("tools")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → tools[]
        </p>
        <ToolsBlock tools={skill.tools} />
      </SectionBlock>

      {/* ====== files ====== */}
      <SectionBlock
        sectionId="files"
        title={t("workspace.section.filePerms")}
        color={bridgeColor("files")}
        editable
        editing={editingFiles}
        onEdit={startEditFiles}
        onCancel={() => setEditingFiles(false)}
        onDone={saveFiles}
        dimmed={api?.isSectionDimmed("files")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → files {"{ read[], write[] }"}
        </p>
        {editingFiles ? (
          <FilesEditForm draft={filesDraft} onChange={setFilesDraft} />
        ) : (
          <div className="ecard">
            <div className="fr" data-field="f-fr" style={{ alignItems: 'flex-start' }}>
              <span className="fl">📖 {t("workspace.field.read")}</span>
              <span className="fv" style={{ fontSize: 10 }}>
                {readList.length === 0 ? (
                  <span className="text-muted-foreground">{t("workspace.field.none")}</span>
                ) : (
                  readList.map((p, i) => {
                    const fileEid = pathToFileEid(p)
                    const fieldKey = fileEid ? `f-p-${fileEid}` : `f-p-${p}`
                    return (
                      <span key={i}>
                        {i > 0 && <br />}
                        <span data-field={fieldKey}>
                          {fileEid ? <EidText eid={fileEid} fieldKey={fieldKey}>{p}</EidText> : p}
                        </span>
                      </span>
                    )
                  })
                )}
              </span>
            </div>
            <div className="fr" data-field="f-fw" style={{ alignItems: 'flex-start' }}>
              <span className="fl">✏️ {t("workspace.field.write")}</span>
              <span className="fv" style={{ fontSize: 10 }}>
                {writeList.length === 0 ? (
                  <span className="text-muted-foreground">{t("workspace.field.none")}</span>
                ) : (
                  writeList.map((p, i) => {
                    const fileEid = pathToFileEid(p)
                    const fieldKey = fileEid ? `f-p-${fileEid}` : `f-p-${p}`
                    return (
                      <span key={i}>
                        {i > 0 && <br />}
                        <span data-field={fieldKey}>
                          {fileEid ? <EidText eid={fileEid} fieldKey={fieldKey}>{p}</EidText> : p}
                        </span>
                      </span>
                    )
                  })
                )}
              </span>
            </div>
          </div>
        )}
      </SectionBlock>

      <BodySectionsRenderer skill={skill} onBodyChange={onBodyChange} />
    </div>
  )
}

function MetaOpenclawView({ fm }: { fm: SkillFrontmatter }) {
  const { t } = useTranslation()
  const oc = getOpenclawMetadata(fm.metadata)
  if (!oc) {
    return <p className="text-sm text-muted-foreground pl-1">{t("workspace.empty.noMetadata")}</p>
  }
  const bins = oc.requires?.bins ?? []
  const optionalBins = oc.optionalBins ?? []
  const os = oc.os ?? []
  const hasAny = bins.length > 0 || optionalBins.length > 0 || os.length > 0
  if (!hasAny) {
    return <p className="text-sm text-muted-foreground pl-1">{t("workspace.empty.noMetadata")}</p>
  }
  return (
    <div className="ecard">
      <div className="fr" data-field="f-meta-bins">
        <span className="fl">{t("workspace.field.requiredDeps")}</span>
        <span className="fv">
          {bins.length > 0
            ? bins.map((b, i) => <span key={i}><EidText eid={b}>{b}</EidText>{i < bins.length - 1 && <br />}</span>)
            : <span className="text-muted-foreground">—</span>}
        </span>
      </div>
      <div className="fr" data-field="f-meta-optbins">
        <span className="fl">{t("workspace.field.optionalDeps")}</span>
        <span className="fv text-muted-foreground">
          {optionalBins.length > 0
            ? optionalBins.map((b, i) => <span key={i}>{i > 0 && " · "}<EidText eid={b}>{b}</EidText></span>)
            : <span className="text-muted-foreground">—</span>}
        </span>
      </div>
      {os.length > 0 && (
        <div className="fr" data-field="f-meta-os">
          <span className="fl">{t("workspace.field.os")}</span>
          <span className="fv">
            {os.map((o, i) => <span key={i} className="tg-pill">{o}</span>)}
          </span>
        </div>
      )}
    </div>
  )
}

function BodySectionsRenderer({
  skill,
  onBodyChange,
}: {
  skill: ParsedSkill
  onBodyChange: (body: string) => void
}) {
  const { t } = useTranslation()
  const api = usePanelSyncApi()

  const { bodyExecSections, bodyDocSections } = useMemo(() => {
    const execPattern = /脚本|script|pipeline/i
    const exec = skill.bodyDocument.sections.filter(s => execPattern.test(s.heading.text))
    const doc = skill.bodyDocument.sections.filter(s => !execPattern.test(s.heading.text))
    return { bodyExecSections: exec, bodyDocSections: doc }
  }, [skill.bodyDocument])

  const [editingDocSections, setEditingDocSections] = useState<Set<string>>(new Set())
  const [draftBlocks, setDraftBlocks] = useState<Record<string, ContentBlock[]>>({})

  const startEditDoc = useCallback((secId: string, blocks: ContentBlock[]) => {
    setDraftBlocks(prev => ({ ...prev, [secId]: structuredClone(blocks) }))
    setEditingDocSections(prev => new Set(prev).add(secId))
  }, [])

  const cancelEditDoc = useCallback((secId: string) => {
    setEditingDocSections(prev => { const n = new Set(prev); n.delete(secId); return n })
  }, [])

  const saveDocSection = useCallback((secId: string) => {
    const updatedSections = skill.bodyDocument.sections.map(s =>
      s.id === secId && draftBlocks[secId] ? { ...s, blocks: draftBlocks[secId] } : s
    )
    const updatedDoc = { ...skill.bodyDocument, sections: updatedSections }
    const newBody = serializeDocument(updatedDoc)
    onBodyChange(newBody)
    setEditingDocSections(prev => { const n = new Set(prev); n.delete(secId); return n })
  }, [skill.bodyDocument, draftBlocks, onBodyChange])

  return (
    <>
      {bodyExecSections.length === 0 ? (
        <SectionBlock sectionId="exec" title={t("workspace.section.scriptPipeline")}
          color={bridgeColor("exec")} readOnly dimmed={api?.isSectionDimmed("exec")}>
          <p className="text-sm text-muted-foreground pl-1">{t("workspace.empty.noExecSections")}</p>
        </SectionBlock>
      ) : (
        bodyExecSections.map((section) => (
          <SectionBlock
            key={section.id}
            sectionId={`exec-${section.id}`}
            title={section.heading.text}
            color={bridgeColor("exec")}
            badge={`${section.blocks.length}`}
            readOnly
            dimmed={api?.isSectionDimmed("exec")}
          >
            {section.blocks.map((block, i) => (
              <FragmentBlock key={i} block={block} editing={false}
                fieldId={`f-x-${section.id}-${i}`}
                onUpdate={() => {}} />
            ))}
          </SectionBlock>
        ))
      )}

      {bodyDocSections.length === 0 ? (
        <SectionBlock sectionId="doc" title={t("workspace.section.docStructure")}
          color={bridgeColor("doc")} readOnly dimmed={api?.isSectionDimmed("doc")}>
          <p className="text-sm text-muted-foreground pl-1">{t("workspace.empty.noSections")}</p>
        </SectionBlock>
      ) : (
        bodyDocSections.map((section) => {
          const isEditing = editingDocSections.has(section.id)
          const blocks = isEditing ? (draftBlocks[section.id] ?? section.blocks) : section.blocks
          return (
            <SectionBlock
              key={section.id}
              sectionId={`doc-${section.id}`}
              title={section.heading.text}
              color={bridgeColor("doc")}
              badge={`${section.blocks.length}`}
              editable
              editing={isEditing}
              onEdit={() => startEditDoc(section.id, section.blocks)}
              onCancel={() => cancelEditDoc(section.id)}
              onDone={() => saveDocSection(section.id)}
              dimmed={api?.isSectionDimmed("doc")}
            >
              {blocks.map((block, i) => (
                <FragmentBlock
                  key={i}
                  block={block}
                  editing={isEditing}
                  fieldId={`f-doc-${section.id}-${i}`}
                  onUpdate={(updated) => {
                    if (!isEditing) return
                    setDraftBlocks(prev => {
                      const arr = [...(prev[section.id] ?? section.blocks)]
                      arr[i] = updated
                      return { ...prev, [section.id]: arr }
                    })
                  }}
                />
              ))}
            </SectionBlock>
          )
        })
      )}
    </>
  )
}

function DocOnlySkillPanel({
  skill,
  onBodyChange,
}: {
  skill: ParsedSkill
  onBodyChange: (body: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="mb-3 px-3 py-2 rounded text-xs"
        style={{ background: "rgba(59,130,246,0.08)", color: "#60a5fa" }}>
        ℹ️ {t("workspace.hint.noFrontmatter")}
      </div>
      <BodySectionsRenderer skill={skill} onBodyChange={onBodyChange} />
    </div>
  )
}

function BrokenFmSkillPanel({
  skill,
  rawFrontmatter,
  onBodyChange,
}: {
  skill: ParsedSkill
  rawFrontmatter: string | null
  onBodyChange: (body: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="mb-3 px-3 py-2 rounded text-xs"
        style={{ background: "rgba(239,68,68,0.08)", color: "#f87171" }}>
        ⚠️ {t("workspace.hint.brokenFrontmatter")}
      </div>
      {rawFrontmatter && (
        <SectionBlock sectionId="broken-fm" title="Frontmatter (原始)" color="#ef4444">
          <pre className="sh-code whitespace-pre-wrap text-[10px]">{rawFrontmatter}</pre>
        </SectionBlock>
      )}
      <BodySectionsRenderer skill={skill} onBodyChange={onBodyChange} />
    </div>
  )
}

function SkillOverviewPanel({
  skill,
  fm,
  validationResult,
  configPaths,
  onSelect,
}: {
  skill: ParsedSkill
  fm: ParsedSkill["frontmatter"]
  validationResult: ReturnType<typeof validateSkill> | null
  configPaths: string[]
  onSelect: (sel: NavigatorSelection) => void
}) {
  const { t } = useTranslation()
  const { state } = useWorkspace()
  const selection = state.selection
  const skillId = skill.id
  const configCount = Object.keys(skill.configFiles).length

  return (
    <div className="space-y-2">
      <div className="ecard">
        <div className="fr" data-field="ov-emoji">
          <span className="fl">{t("workspace.field.emoji")}</span>
          <span className="fv">{fm.emoji || "—"}</span>
        </div>
        <div className="fr" data-field="ov-name">
          <span className="fl">{t("workspace.field.name")}</span>
          <span className="fv font-semibold">{fm.name || "—"}</span>
        </div>
        <div className="fr" data-field="ov-desc">
          <span className="fl">{t("workspace.field.description")}</span>
          <span className="fv">{skill.description || fm.description || "—"}</span>
        </div>
        <div className="fr" data-field="ov-ver">
          <span className="fl">{t("workspace.field.version")}</span>
          <span className="fv">{fm.version ? `v${fm.version}` : "—"}</span>
        </div>
        <div className="fr" data-field="ov-author">
          <span className="fl">{t("workspace.field.author")}</span>
          <span className="fv">{fm.author || "—"}</span>
        </div>
        {fm.homepage ? (
          <div className="fr" data-field="ov-home">
            <span className="fl">{t("workspace.field.homepage")}</span>
            <a
              href={fm.homepage}
              target="_blank"
              rel="noreferrer"
              className="fv"
              style={{ color: "#3b82f6" }}
            >
              {fm.homepage}
            </a>
          </div>
        ) : null}
      </div>

      <div className="ecard">
        <div className="fr">
          <span className="fl">{t("workspace.field.toolCount")}</span>
          <span className="fv">{skill.tools.length}</span>
        </div>
        <div className="fr">
          <span className="fl">{t("workspace.field.envVarCount")}</span>
          <span className="fv">{skill.envVars.length}</span>
        </div>
        {configCount > 0 ? (
          <div className="fr">
            <span className="fl">{t("workspace.field.configCount")}</span>
            <span className="fv">{configCount}</span>
          </div>
        ) : null}
        <div className="fr">
          <span className="fl">{t("workspace.field.docCount")}</span>
          <span className="fv">{skill.sections.length}</span>
        </div>
      </div>

      <div className="ecard">
        <div className="fr">
          <span className="fl">{t("workspace.field.path")}</span>
          <span className="fv font-mono text-[10px]">{skill.path || "—"}</span>
        </div>
        <div className="fr">
          <span className="fl">{t("workspace.field.fileCount")}</span>
          <span className="fv">{1 + configPaths.length + Object.keys(skill.extraFiles).length}</span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-1.5 pl-1">{t("workspace.file.relatedFiles")}</h3>
        <div className="space-y-0.5">
          <button
            type="button"
            className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs text-primary hover:bg-muted/50 transition-colors"
            onClick={() => onSelect({ skillId, nodeType: "skill-md" })}
          >
            <FileText className="size-3.5 shrink-0" aria-hidden />
            <span>SKILL.md</span>
            {selection?.nodeType === "skill-md" && selection.skillId === skillId && (
              <ExternalLink className="ml-auto size-3 shrink-0 opacity-70" aria-hidden />
            )}
          </button>
          {configPaths.map((path) => (
            <button
              key={path}
              type="button"
              className="flex w-full min-w-0 items-center gap-1.5 rounded px-2 py-1 text-xs text-primary hover:bg-muted/50 transition-colors truncate"
              onClick={() => onSelect({ skillId, nodeType: "config-file", filePath: path })}
            >
              <FileText className="size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{path}</span>
              {selection?.nodeType === "config-file" &&
                selection.skillId === skillId &&
                selection.filePath === path && (
                  <ExternalLink className="ml-auto size-3 shrink-0 opacity-70" aria-hidden />
                )}
            </button>
          ))}
        </div>
      </div>

      {validationResult ? (
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5 pl-1">
            <ShieldCheck className="size-5" />
            {t("workspace.file.configValidation")}
          </h3>
          <Suspense fallback={<div className="text-sm text-muted-foreground">{t("workspace.file.loadingValidation")}</div>}>
            <ValidationPanel result={validationResult} />
          </Suspense>
        </div>
      ) : null}
    </div>
  )
}

export function EditorPanel() {
  const { t } = useTranslation()
  const api = usePanelSyncApi()
  const { state, selectedSkill, editState, updateFrontmatter, updateConfig, updateExtraFile, updateSkillBody, select } = useWorkspace()

  const handleEditorClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!api) return
      let el: HTMLElement | null = e.target as HTMLElement
      const root = e.currentTarget
      let eid: string | null = null
      let field: string | null = null
      while (el && el !== root) {
        if (!eid) eid = el.getAttribute("data-eid")
        if (!field) field = el.getAttribute("data-field")
        if (eid && field) break
        el = el.parentElement
      }

      if (eid || field) {
        api.selectFieldKey(field)
        api.selectRelationTarget(eid)
      } else {
        api.clearRelationSelection()
      }
    },
    [api],
  )

  const selection = state.selection

  const skillForValidation = useMemo(() => {
    if (!selectedSkill || !editState) return null
    return mergeSkillForValidation(selectedSkill, editState.frontmatter, editState.configFiles)
  }, [selectedSkill, editState])

  const validationResult = useMemo(() => {
    if (!skillForValidation) return null
    return validateSkill(skillForValidation)
  }, [skillForValidation])

  const configPaths = useMemo(() => {
    if (!selectedSkill) return []
    const keys = new Set([
      ...Object.keys(selectedSkill.configFiles),
      ...Object.keys(editState?.configFiles ?? {}),
    ])
    return [...keys].sort()
  }, [selectedSkill, editState?.configFiles])

  const HeaderIcon = selection ? headerIcon(selection.nodeType) : FileText
  const titleName =
    selectedSkill?.frontmatter.name ??
    (selection ? selection.skillId : "")
  const segmentLabel = !selection
    ? ""
    : selection.nodeType === "skill-overview"
      ? t("workspace.panelTitle.overview")
      : selection.nodeType === "skill-md"
        ? "SKILL.md"
        : selection.filePath ??
          (selection.nodeType === "config-file"
            ? t("workspace.panelTitle.config")
            : selection.nodeType === "extra-file"
              ? t("workspace.panelTitle.fileViewer")
              : "")

  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-1.5 border-b px-3.5 h-[34px] min-h-[34px] text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-1.5">
          <HeaderIcon className="size-3.5 shrink-0" aria-hidden />
          <strong className="text-foreground">
            {selection?.nodeType === "skill-overview"
              ? t("workspace.panelTitle.overview")
              : t("workspace.panelTitle.editor")}
          </strong>
          <span className="text-[10px] truncate" style={{ color: 'var(--muted-foreground)' }}>
            {titleName || "—"}{segmentLabel ? ` / ${segmentLabel}` : ""}
          </span>
        </div>
        {api && (
          <button
            type="button"
            className="shrink-0 p-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            onClick={api.toggleAllEditor}
            title={api.editorAllExpanded ? t("workspace.action.collapseAll") : t("workspace.action.expandAll")}
          >
            {api.editorAllExpanded ? <ChevronsDownUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
          </button>
        )}
      </div>

      <div
        ref={api?.editorRef}
        className="flex-1 min-h-0 overflow-y-auto thin-scroll"
        onClick={api ? handleEditorClick : undefined}
      >
        <div className="min-h-full p-2 pr-1.5" style={{ paddingBottom: 32 }}>
          {!selection ? (
            <EmptyState title={t("workspace.empty.selectSkill")} />
          ) : !selectedSkill || !editState ? (
            <p className="p-3 text-sm text-muted-foreground">{t("workspace.empty.skillNotFound")}</p>
          ) : selection.nodeType === "skill-overview" ? (
            <SkillOverviewPanel
              skill={selectedSkill}
              fm={editState.frontmatter}
              validationResult={validationResult}
              configPaths={configPaths}
              onSelect={select}
            />
          ) : selection.nodeType === "skill-md" ? (
            editState.frontmatterStatus === "valid" ? (
              <SkillMdPanel
                skill={selectedSkill}
                fm={editState.frontmatter}
                onChange={(updated) => updateFrontmatter(selectedSkill.id, updated)}
                onBodyChange={(body) => updateSkillBody(selectedSkill.id, body)}
              />
            ) : editState.frontmatterStatus === "missing" ? (
              <DocOnlySkillPanel
                skill={selectedSkill}
                onBodyChange={(body) => updateSkillBody(selectedSkill.id, body)}
              />
            ) : (
              <BrokenFmSkillPanel
                skill={selectedSkill}
                rawFrontmatter={editState.rawFrontmatter}
                onBodyChange={(body) => updateSkillBody(selectedSkill.id, body)}
              />
            )
          ) : selection.nodeType === "config-file" ? (
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">{t("workspace.file.loadingEditor")}</div>}>
              <ConfigFileEditor
                selection={selection}
                skill={selectedSkill}
                editState={editState}
                updateConfig={updateConfig}
              />
            </Suspense>
          ) : selection.nodeType === "extra-file" && selection.filePath ? (
            (() => {
              const file = selectedSkill.extraFiles[selection.filePath]
              if (!file) return <EmptyState title={t("workspace.empty.fileNotFound", { path: selection.filePath })} />
              const editContent = editState.extraFiles[selection.filePath] ?? file.content
              return (
                <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">{t("workspace.file.loadingEditor")}</div>}>
                  <ExtraFileEditor
                    key={selection.filePath}
                    file={file}
                    editContent={editContent}
                    onUpdate={(content) => updateExtraFile(selectedSkill.id, selection.filePath!, content)}
                  />
                </Suspense>
              )
            })()
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ConfigFileEditor({
  selection,
  skill,
  editState,
  updateConfig,
}: {
  selection: NavigatorSelection
  skill: ParsedSkill
  editState: { configFiles: Record<string, unknown>; frontmatter: ParsedSkill["frontmatter"]; dirty: boolean }
  updateConfig: (skillId: string, path: string, data: unknown) => void
}) {
  const { t } = useTranslation()
  const filePath = selection.filePath
  if (!filePath) {
    return <p className="p-3 text-sm text-muted-foreground">{t("workspace.empty.configPathMissing")}</p>
  }

  const raw = editState.configFiles[filePath]
  if (raw === undefined) {
    return <p className="p-3 text-sm text-muted-foreground">{t("workspace.empty.configDataMissing", { path: filePath })}</p>
  }

  const kind = configEditorKind(filePath)
  if (!kind) {
    return <p className="p-3 text-sm text-muted-foreground">{t("workspace.empty.configUnsupported", { path: filePath })}</p>
  }

  if (kind === "sources") {
    if (!isSourcesConfig(raw)) {
      return <p className="p-3 text-sm text-muted-foreground">{t("workspace.empty.sourcesInvalid")}</p>
    }
    return (
      <SourcesEditor
        data={raw as Parameters<typeof SourcesEditor>[0]["data"]}
        onChange={(newData) => updateConfig(skill.id, filePath, newData)}
      />
    )
  }

  if (kind === "topics") {
    if (!isTopicsConfig(raw)) {
      return <p className="p-3 text-sm text-muted-foreground">{t("workspace.empty.topicsInvalid")}</p>
    }
    return (
      <TopicsEditor
        data={raw as Parameters<typeof TopicsEditor>[0]["data"]}
        onChange={(newData) => updateConfig(skill.id, filePath, newData)}
      />
    )
  }

  if (!isSchemaRecord(raw)) {
    return <p className="p-3 text-sm text-muted-foreground">{t("workspace.empty.schemaInvalid")}</p>
  }

  return (
    <SchemaRawEditor
      schema={raw}
      onChange={(newData) => updateConfig(skill.id, filePath, newData)}
    />
  )
}

function SchemaRawEditor({
  schema,
  onChange,
}: {
  schema: Record<string, unknown>
  onChange: (data: unknown) => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [parseError, setParseError] = useState<string | null>(null)

  const handleEdit = () => {
    setDraft(JSON.stringify(schema, null, 2))
    setParseError(null)
    setEditing(true)
  }

  const handleDone = () => {
    try {
      const parsed = JSON.parse(draft) as unknown
      onChange(parsed)
      setEditing(false)
      setParseError(null)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON")
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setParseError(null)
  }

  return (
    <SectionBlock
      sectionId="cfg-schema"
      title={t("workspace.file.schema")}
      editable
      editing={editing}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onDone={handleDone}
    >
      {editing ? (
        <div className="space-y-1">
          {parseError && (
            <p className="text-[10px] text-destructive px-1">{parseError}</p>
          )}
          <div className="ecard">
            <textarea
              className="fi w-full font-mono text-[11px] resize-y leading-relaxed"
              style={{ minHeight: "300px" }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>
      ) : (
        <SchemaViewer schema={schema} />
      )}
    </SectionBlock>
  )
}
