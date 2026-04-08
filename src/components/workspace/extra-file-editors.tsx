import { useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { highlight } from "sugar-high"
import { python } from "sugar-high/presets"
import { cn } from "@/lib/utils"
import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import { parseDocument, serializeDocument } from "@/lib/markdown-engine"
import { FragmentBlock } from "@/components/workspace/fragment-renderer"
import type { ContentBlock, ParsedDocument } from "@/types/content-fragment"
import type { ExtraFile, ExtraFileType } from "@/types/skill"

const SHELL_PRESET = {
  keywords: new Set([
    "if", "then", "else", "elif", "fi", "for", "in", "do", "done",
    "while", "until", "case", "esac", "function", "return", "local",
    "export", "set", "unset", "echo", "exit", "true", "false",
    "source", "shift", "trap", "readonly", "declare",
  ]),
  onCommentStart: (curr: string): number => (curr === "#" ? 1 : 0),
}

function highlightCode(code: string, type: ExtraFileType): string {
  switch (type) {
    case "python":
      return highlight(code, python)
    case "shell":
      return highlight(code, SHELL_PRESET)
    default:
      return highlight(code)
  }
}

/* ─── FileSection: 复用 bridge-section CSS 的通用区块容器 ─── */

function FileSection({
  title,
  badge,
  readOnly,
  editable,
  editing,
  onEdit,
  onCancel,
  onDone,
  defaultCollapsed,
  sectionId,
  color = "#64748b",
  children,
}: {
  title: string
  badge?: string
  readOnly?: boolean
  editable?: boolean
  editing?: boolean
  onEdit?: () => void
  onCancel?: () => void
  onDone?: () => void
  defaultCollapsed?: boolean
  sectionId?: string
  color?: string
  children: ReactNode
}) {
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
      style={color ? { borderLeftColor: `color-mix(in srgb, ${color} 32%, transparent)` } : undefined}
      className={cn(
        collapsed && "bridge-section-collapsed",
        readOnly && "bridge-section-readonly",
        editing && "editing",
      )}
    >
      <div
        className="bridge-section-header"
        onClick={() => sectionId && api?.scrollBothToSection(sectionId)}
      >
        <span
          className="bridge-section-caret text-[8px] text-muted-foreground transition-transform"
          style={{ transform: collapsed ? "rotate(-90deg)" : undefined }}
          onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed) }}
        >▼</span>
        <span className="bridge-section-dot" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold">{title}</span>
        {badge && (
          <span className="bridge-badge">{badge}</span>
        )}
        {readOnly && (
          <span className="text-[9px] px-[5px] py-px rounded-lg inline-flex items-center gap-[3px]" style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted-foreground)" }}>
            🔒 {t("workspace.action.readOnly")}
          </span>
        )}
        {editable && !editing && (
          <button type="button" className="eb" onClick={(e) => { e.stopPropagation(); onEdit?.() }}>{t("workspace.action.edit")}</button>
        )}
        {editing && (
          <span className="eb-group">
            <span className="editing-ind">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg>
              {t("workspace.action.editing")}
            </span>
            <button type="button" className="eb-cancel" onClick={(e) => { e.stopPropagation(); onCancel?.() }}>{t("workspace.action.cancel")}</button>
            <button type="button" className="eb-done" onClick={(e) => { e.stopPropagation(); onDone?.() }}>{t("workspace.action.done")}</button>
          </span>
        )}
      </div>
      <div className="bridge-section-content">{children}</div>
    </div>
  )
}

/* ─── 入口路由 ─── */

interface ExtraFileEditorProps {
  file: ExtraFile
  editContent: string
  onUpdate: (content: string) => void
}

export function ExtraFileEditor({ file, editContent, onUpdate }: ExtraFileEditorProps) {
  switch (file.type) {
    case "json":
      return <JsonFileEditor content={editContent} onChange={onUpdate} />
    case "markdown":
      return <MarkdownFileEditor content={editContent} onChange={onUpdate} />
    case "python":
    case "shell":
      return <CodeFileViewer code={file.content} type={file.type} />
    default:
      return <CodeFileViewer code={file.content} type="text" />
  }
}

/* ─── JSON 编辑器：展示态 .fr 行 → 编辑态 .ef-row 表单 ─── */

function formatJsonValue(value: unknown, tYes: string, tNo: string): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "boolean") return value ? tYes : tNo
  return String(value)
}

function JsonFileEditor({ content, onChange }: { content: string; onChange: (c: string) => void }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({})

  const parsed = useMemo(() => {
    try { return JSON.parse(content) as Record<string, unknown> }
    catch { return null }
  }, [content])

  const handleEdit = useCallback(() => {
    if (parsed) setDraft(structuredClone(parsed))
    setEditing(true)
  }, [parsed])

  const handleDone = useCallback(() => {
    onChange(JSON.stringify(draft, null, 2))
    setEditing(false)
  }, [draft, onChange])

  const handleCancel = useCallback(() => setEditing(false), [])

  const handleField = useCallback((key: string, raw: string) => {
    setDraft((prev) => {
      const original = prev[key]
      let typed: unknown = raw
      if (typeof original === "number") {
        const n = Number(raw)
        if (!Number.isNaN(n)) typed = n
      } else if (typeof original === "boolean") {
        typed = raw === "true"
      }
      return { ...prev, [key]: typed }
    })
  }, [])

  if (!parsed) {
    return (
      <FileSection title="JSON" readOnly>
        <div className="ecard">
          <pre className="sh-code text-xs text-destructive">{content}</pre>
        </div>
      </FileSection>
    )
  }

  const entries = Object.entries(editing ? draft : parsed)

  return (
    <FileSection
      title={t("workspace.file.data")}
      editable
      editing={editing}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onDone={handleDone}
    >
      {editing ? (
        <div className="ecard">
          {entries.map(([key, value]) => (
            <div key={key} className="ef-row">
              <label className="ef-lbl">{key}</label>
              {typeof value === "boolean" ? (
                <button
                  type="button"
                  className={`ftg ${value ? "ftg-on" : ""}`}
                  onClick={() => handleField(key, String(!value))}
                  aria-label={key}
                >
                  <span className="ftg-dot" />
                </button>
              ) : (
                <input
                  className="fi flex-1"
                  value={String(value ?? "")}
                  onChange={(e) => handleField(key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="ecard">
          {entries.map(([key, value]) => (
            <div key={key} className="fr">
              <span className="fl">{key}</span>
              <span className="fv">{formatJsonValue(value, t("workspace.bool.yes"), t("workspace.bool.no"))}</span>
            </div>
          ))}
        </div>
      )}
    </FileSection>
  )
}

/* ─── Markdown 编辑器：remark AST → 内容片段 → 类型化组件 ─── */

function MarkdownFileEditor({ content, onChange }: { content: string; onChange: (c: string) => void }) {
  const { t } = useTranslation()
  const doc = useMemo(() => parseDocument(content), [content])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftBlocks, setDraftBlocks] = useState<ContentBlock[]>([])

  const startEdit = useCallback((id: string, blocks: ContentBlock[]) => {
    setDraftBlocks(blocks.map((b) => ({ ...b })))
    setEditingId(id)
  }, [])

  const updateBlock = useCallback((index: number, updated: ContentBlock) => {
    setDraftBlocks((prev) => prev.map((b, i) => (i === index ? updated : b)))
  }, [])

  const handleDone = useCallback(() => {
    if (!editingId) return
    const updatedDoc: ParsedDocument = {
      ...doc,
      preamble: editingId === "__preamble__" ? draftBlocks : doc.preamble,
      sections: doc.sections.map((sec) =>
        sec.id === editingId ? { ...sec, blocks: draftBlocks } : sec,
      ),
    }
    onChange(serializeDocument(updatedDoc))
    setEditingId(null)
  }, [editingId, draftBlocks, doc, onChange])

  const handleCancel = useCallback(() => setEditingId(null), [])

  const hasPreamble = doc.preamble.length > 0
  const hasSections = doc.sections.length > 0

  if (!hasPreamble && !hasSections) {
    return (
      <FileSection title={t("workspace.file.content")} readOnly>
        <div className="ecard">
          <pre className="sh-code whitespace-pre-wrap">{content || t("workspace.empty.emptyContent")}</pre>
        </div>
      </FileSection>
    )
  }

  const isPreambleEditing = editingId === "__preamble__"
  const preambleBlocks = isPreambleEditing ? draftBlocks : doc.preamble

  return (
    <div className="space-y-1">
      {hasPreamble && (
        <FileSection
          title={t("workspace.file.overview")}
          sectionId="__preamble__"
          editable
          editing={isPreambleEditing}
          onEdit={() => startEdit("__preamble__", doc.preamble)}
          onCancel={handleCancel}
          onDone={handleDone}
        >
          <div className="space-y-2">
            {preambleBlocks.map((block, i) => (
              <FragmentBlock
                key={i}
                block={block}
                editing={isPreambleEditing}
                onUpdate={(updated) => updateBlock(i, updated)}
                fieldId={`__preamble__-b${i}`}
              />
            ))}
          </div>
        </FileSection>
      )}
      {doc.sections.map((sec, si) => {
        const isEditing = editingId === sec.id
        const blocks = isEditing ? draftBlocks : sec.blocks
        const blockCount = sec.blocks.length
        const badge = blockCount > 0 ? `${blockCount}` : undefined
        return (
          <FileSection
            key={sec.id}
            title={sec.heading.text}
            sectionId={sec.id}
            badge={badge}
            editable={blockCount > 0}
            editing={isEditing}
            onEdit={() => startEdit(sec.id, sec.blocks)}
            onCancel={handleCancel}
            onDone={handleDone}
            defaultCollapsed={si > 4}
          >
            {blocks.length > 0 ? (
              <div className="space-y-2">
                {blocks.map((block, bi) => (
                  <FragmentBlock
                    key={bi}
                    block={block}
                    editing={isEditing}
                    onUpdate={(updated) => updateBlock(bi, updated)}
                    fieldId={`${sec.id}-b${bi}`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">{t("workspace.empty.emptySection")}</p>
            )}
          </FileSection>
        )
      })}
    </div>
  )
}

/* ─── 代码查看器：FileSection 容器 + 语法高亮 ─── */

function CodeFileViewer({ code, type }: { code: string; type: ExtraFileType }) {
  const { t } = useTranslation()
  const html = useMemo(() => highlightCode(code, type), [code, type])
  const lineCount = code.split("\n").length
  const langLabel = type === "python" ? "Python" : type === "shell" ? "Shell" : type

  return (
    <FileSection
      title={t("workspace.file.sourceCode")}
      badge={langLabel}
      readOnly
    >
      <div className="text-[10px] text-muted-foreground mb-1">{t("workspace.file.lineCount", { count: lineCount })}</div>
      <div className="ecard">
        <pre className="sh-code">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </FileSection>
  )
}
