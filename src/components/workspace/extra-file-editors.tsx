import { useState, useMemo, useCallback, type ReactNode } from "react"
import { highlight } from "sugar-high"
import { python } from "sugar-high/presets"
import { cn } from "@/lib/utils"
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
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false)
  return (
    <div
      className={cn(
        "file-section",
        collapsed && "bridge-section-collapsed",
        readOnly && "bridge-section-readonly",
        editing && "editing",
      )}
    >
      <div className="bridge-section-header">
        <span
          className="bridge-section-caret text-[8px] text-muted-foreground transition-transform"
          style={{ transform: collapsed ? "rotate(-90deg)" : undefined }}
          onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed) }}
        >▼</span>
        <span className="text-xs font-semibold">{title}</span>
        {badge && (
          <span className="tg-pill">{badge}</span>
        )}
        {readOnly && (
          <span className="text-[9px] px-[5px] py-px rounded-lg inline-flex items-center gap-[3px]" style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted-foreground)" }}>
            🔒 只读
          </span>
        )}
        {editable && !editing && (
          <button type="button" className="eb" onClick={(e) => { e.stopPropagation(); onEdit?.() }}>编辑</button>
        )}
        {editing && (
          <span className="eb-group">
            <span className="editing-ind">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg>
              编辑中
            </span>
            <button type="button" className="eb-cancel" onClick={(e) => { e.stopPropagation(); onCancel?.() }}>取消</button>
            <button type="button" className="eb-done" onClick={(e) => { e.stopPropagation(); onDone?.() }}>完成</button>
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

function formatJsonValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "boolean") return value ? "是" : "否"
  return String(value)
}

function JsonFileEditor({ content, onChange }: { content: string; onChange: (c: string) => void }) {
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
      title="数据"
      editable
      editing={editing}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onDone={handleDone}
    >
      {editing ? (
        <div className="space-y-0.5">
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
              <span className="fv">{formatJsonValue(value)}</span>
            </div>
          ))}
        </div>
      )}
    </FileSection>
  )
}

/* ─── Markdown 编辑器：按 ## 解析分段 ─── */

interface MdSection {
  heading: string
  body: string
  isH1: boolean
}

function parseMdFile(content: string): { preamble: string; sections: MdSection[] } {
  const lines = content.split("\n")
  const sections: MdSection[] = []
  let preambleLines: string[] = []
  let current: MdSection | null = null

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/)
    if (h2 && !line.startsWith("###")) {
      if (current) {
        sections.push({ ...current, body: current.body.trimEnd() })
      } else {
        const pre = preambleLines.join("\n").trim()
        const h1 = pre.match(/^#\s+(.+)/)
        const bodyAfterH1 = h1 ? pre.split("\n").slice(1).join("\n").trim() : pre
        if (bodyAfterH1) {
          sections.push({ heading: h1 ? h1[1] : "概述", body: bodyAfterH1, isH1: true })
        }
      }
      current = { heading: h2[1].trim(), body: "", isH1: false }
    } else if (current) {
      current.body += line + "\n"
    } else {
      preambleLines.push(line)
    }
  }

  if (current) {
    sections.push({ ...current, body: current.body.trimEnd() })
  } else if (preambleLines.length > 0) {
    const text = preambleLines.join("\n").trim()
    if (text) {
      const h1 = text.match(/^#\s+(.+)/)
      sections.push({
        heading: h1 ? h1[1] : "内容",
        body: h1 ? text.split("\n").slice(1).join("\n").trim() : text,
        isH1: true,
      })
    }
  }

  const preamble = preambleLines.join("\n")
  return { preamble, sections }
}

function rebuildMdFile(preamble: string, sections: MdSection[]): string {
  let out = ""
  const preambleTrimmed = preamble.trim()

  if (sections.length > 0 && sections[0].isH1) {
    out = `# ${sections[0].heading}\n\n${sections[0].body}`
    for (let i = 1; i < sections.length; i++) {
      out += `\n\n## ${sections[i].heading}\n\n${sections[i].body}`
    }
  } else {
    if (preambleTrimmed && !sections.some((s) => s.isH1)) {
      out = preambleTrimmed
    }
    for (const sec of sections) {
      const prefix = sec.isH1 ? "#" : "##"
      if (out) out += "\n\n"
      out += `${prefix} ${sec.heading}\n\n${sec.body}`
    }
  }

  return out.trimEnd() + "\n"
}

function MarkdownFileEditor({ content, onChange }: { content: string; onChange: (c: string) => void }) {
  const { preamble, sections } = useMemo(() => parseMdFile(content), [content])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState("")

  const handleEdit = useCallback((idx: number) => {
    setDraft(sections[idx].body)
    setEditingIdx(idx)
  }, [sections])

  const handleDone = useCallback(() => {
    if (editingIdx === null) return
    const updated = sections.map((s, i) => (i === editingIdx ? { ...s, body: draft } : s))
    onChange(rebuildMdFile(preamble, updated))
    setEditingIdx(null)
  }, [editingIdx, draft, sections, preamble, onChange])

  const handleCancel = useCallback(() => setEditingIdx(null), [])

  if (sections.length === 0) {
    return (
      <FileSection title="内容" readOnly>
        <div className="ecard">
          <pre className="sh-code whitespace-pre-wrap">{content}</pre>
        </div>
      </FileSection>
    )
  }

  return (
    <div className="space-y-1">
      {sections.map((sec, i) => (
        <FileSection
          key={`${sec.heading}-${i}`}
          title={sec.heading}
          editable
          editing={editingIdx === i}
          onEdit={() => handleEdit(i)}
          onCancel={handleCancel}
          onDone={handleDone}
          defaultCollapsed={i > 3}
        >
          {editingIdx === i ? (
            <textarea
              className="fi ft w-full"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(Math.max(draft.split("\n").length + 2, 6), 30)}
              style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
            />
          ) : (
            <div className="ecard">
              <pre className="sh-code whitespace-pre-wrap">{sec.body || "（空）"}</pre>
            </div>
          )}
        </FileSection>
      ))}
    </div>
  )
}

/* ─── 代码查看器：FileSection 容器 + 语法高亮 ─── */

function CodeFileViewer({ code, type }: { code: string; type: ExtraFileType }) {
  const html = useMemo(() => highlightCode(code, type), [code, type])
  const lineCount = code.split("\n").length
  const langLabel = type === "python" ? "Python" : type === "shell" ? "Shell" : type

  return (
    <FileSection
      title="源代码"
      badge={langLabel}
      readOnly
    >
      <div className="text-[10px] text-muted-foreground mb-1">{lineCount} 行</div>
      <div className="ecard">
        <pre className="sh-code">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </FileSection>
  )
}
