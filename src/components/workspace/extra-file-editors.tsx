import { useState, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { highlight } from "sugar-high"
import { python } from "sugar-high/presets"
import { SectionBlock } from "@/components/workspace/section-block"
import { FALLBACK_SECTION_COLOR } from "@/lib/bridge-sections"
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

/* ─── 入口路由 ─── */

interface ExtraFileEditorProps {
  file: ExtraFile
  editContent: string
  onUpdate: (content: string) => void
}

export function ExtraFileEditor({ file, editContent, onUpdate }: ExtraFileEditorProps) {
  const baseName = file.path.split("/").pop() ?? "file"
  const sectionId = `xf-${baseName}`

  switch (file.type) {
    case "json":
      return <JsonFileEditor content={editContent} onChange={onUpdate} sectionId={sectionId} />
    case "markdown":
      return <MarkdownFileEditor content={editContent} onChange={onUpdate} />
    case "python":
    case "shell":
      return <CodeFileViewer code={file.content} type={file.type} sectionId={sectionId} />
    default:
      return <CodeFileViewer code={file.content} type="text" sectionId={sectionId} />
  }
}

/* ─── JSON 编辑器：展示态 .fr 行 → 编辑态 .ef-row 表单 ─── */

function isNested(value: unknown): boolean {
  return value !== null && typeof value === "object"
}

function formatJsonValue(value: unknown, tYes: string, tNo: string): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "boolean") return value ? tYes : tNo
  if (isNested(value)) return JSON.stringify(value)
  return String(value)
}

function JsonFileEditor({ content, onChange, sectionId }: { content: string; onChange: (c: string) => void; sectionId: string }) {
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
      } else if (isNested(original)) {
        try { typed = JSON.parse(raw) } catch { typed = raw }
      }
      return { ...prev, [key]: typed }
    })
  }, [])

  if (!parsed) {
    return (
      <SectionBlock title="JSON" readOnly sectionId={sectionId} color={FALLBACK_SECTION_COLOR}>
        <div className="ecard">
          <pre className="sh-code text-xs text-destructive">{content}</pre>
        </div>
      </SectionBlock>
    )
  }

  const entries = Object.entries(editing ? draft : parsed)

  return (
    <SectionBlock
      sectionId={sectionId}
      color={FALLBACK_SECTION_COLOR}
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
            <div key={key} className={`ef-row ${isNested(value) ? "ef-row-top" : ""}`}>
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
              ) : isNested(value) ? (
                <textarea
                  className="fi flex-1"
                  style={{ height: "auto", minHeight: 48, resize: "vertical", lineHeight: 1.4 }}
                  value={JSON.stringify(value, null, 2)}
                  onChange={(e) => handleField(key, e.target.value)}
                  spellCheck={false}
                />
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
    </SectionBlock>
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
      <SectionBlock title={t("workspace.file.content")} readOnly color={FALLBACK_SECTION_COLOR}>
        <div className="ecard">
          <pre className="sh-code whitespace-pre-wrap">{content || t("workspace.empty.emptyContent")}</pre>
        </div>
      </SectionBlock>
    )
  }

  const isPreambleEditing = editingId === "__preamble__"
  const preambleBlocks = isPreambleEditing ? draftBlocks : doc.preamble

  return (
    <div className="space-y-1">
      {hasPreamble && (
        <SectionBlock
          title={t("workspace.file.overview")}
          sectionId="__preamble__"
          color={FALLBACK_SECTION_COLOR}
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
        </SectionBlock>
      )}
      {doc.sections.map((sec, si) => {
        const isEditing = editingId === sec.id
        const blocks = isEditing ? draftBlocks : sec.blocks
        const blockCount = sec.blocks.length
        const badge = blockCount > 0 ? `${blockCount}` : undefined
        return (
          <SectionBlock
            key={sec.id}
            title={sec.heading.text}
            sectionId={sec.id}
            color={FALLBACK_SECTION_COLOR}
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
          </SectionBlock>
        )
      })}
    </div>
  )
}

/* ─── 代码查看器：SectionBlock 容器 + 语法高亮 ─── */

function CodeFileViewer({ code, type, sectionId }: { code: string; type: ExtraFileType; sectionId: string }) {
  const { t } = useTranslation()
  const html = useMemo(() => highlightCode(code, type), [code, type])
  const lineCount = code.split("\n").length
  const langLabel = type === "python" ? "Python" : type === "shell" ? "Shell" : type

  return (
    <SectionBlock
      sectionId={sectionId}
      color={FALLBACK_SECTION_COLOR}
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
    </SectionBlock>
  )
}
