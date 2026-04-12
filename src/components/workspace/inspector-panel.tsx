import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeftRight, ChevronsDownUp, ChevronsUpDown, Download, FileText, Save } from "lucide-react"
import { highlight } from "sugar-high"

import { ExportButton } from "@/components/config-editor/export-button"
import { SectionBlock } from "@/components/workspace/section-block"
import { parseDocument } from "@/lib/markdown-engine"
import { FragmentBlock } from "@/components/workspace/fragment-renderer"
import type { ParsedDocument, ContentSection } from "@/types/content-fragment"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import { useWorkspace } from "@/hooks/use-workspace"
import { downloadFile } from "@/lib/download"
import { getRelationCountSummary } from "@/lib/bridge-relations"
import { BRIDGE_SECTIONS, SECTION_MAP } from "@/lib/bridge-sections"
import { frontmatterSchema } from "@/lib/schemas/frontmatter-schema"
import { serializeSkillMd } from "@/lib/skill-serializer"
import { toast } from "sonner"
import { isTauri, saveSkillFile, saveSkillConfig, deleteSkillFile } from "@/lib/tauri-fs"
import { writeRemoteSkill, getConnectionStatus } from "@/lib/remote-fs"
import { cn } from "@/lib/utils"
import type { ParsedSkill, SkillFrontmatter } from "@/types/skill"
import { computeChanges } from "@/types/workspace"
import { computeSkillDiff } from "@/lib/skill-differ"
import { DiffViewer } from "@/components/workspace/diff-viewer"

interface PreviewParts {
  basic: string
  trigger: string
  meta: string
  env: string
  tools: string
  files: string
  exec: string
  doc: string
}

function getTopLevelYamlKey(line: string): string | null {
  if (!line.length) return null
  if (line[0] === " " || line[0] === "\t") return null
  if (line.trimStart().startsWith("#")) return null
  const m = line.match(/^"?([a-zA-Z_-]+)"?\s*:/)
  return m ? m[1] : null
}

function parseTopLevelYamlBlocks(fmInner: string): Map<string, string> {
  const lines = fmInner.split(/\r?\n/)
  const acc = new Map<string, string[]>()
  let currentKey: string | null = null
  for (const line of lines) {
    const tk = getTopLevelYamlKey(line)
    if (tk) {
      currentKey = tk
      if (!acc.has(tk)) acc.set(tk, [])
      acc.get(tk)!.push(line)
    } else if (currentKey) {
      acc.get(currentKey)!.push(line)
    }
  }
  return new Map([...acc].map(([k, v]) => [k, v.join("\n")]))
}

function extractFmInnerAndBody(content: string): { fmInner: string; body: string } {
  if (!content.startsWith("---")) {
    return { fmInner: "", body: content }
  }
  const openEnd = content.indexOf("\n")
  if (openEnd === -1) {
    return { fmInner: "", body: content }
  }
  const closeIdx = content.indexOf("\n---", openEnd)
  if (closeIdx === -1) {
    return { fmInner: content.slice(openEnd + 1), body: "" }
  }
  const fmInner = content.slice(openEnd + 1, closeIdx)
  let body = content.slice(closeIdx + 4)
  if (body.startsWith("\r\n")) body = body.slice(2)
  else if (body.startsWith("\n")) body = body.slice(1)
  return { fmInner, body }
}

function splitBodyExecDoc(body: string): { exec: string; doc: string } {
  const trimmed = body.trimEnd()
  if (!trimmed) return { exec: "", doc: "" }
  const parts = trimmed.split(/(?=^##[^\n#])/m)
  const execChunks: string[] = []
  const docChunks: string[] = []
  for (const part of parts) {
    if (!part.trim()) continue
    const firstLine = part.split("\n")[0] ?? ""
    const hm = firstLine.match(/^##\s+(.+)/)
    if (hm && /脚本|script|pipeline/i.test(hm[1])) {
      execChunks.push(part)
    } else {
      docChunks.push(part)
    }
  }
  return {
    exec: execChunks.join("\n\n").trimEnd(),
    doc: docChunks.join("\n\n").trimEnd(),
  }
}

function splitPreviewInto8(content: string): PreviewParts {
  const { fmInner, body } = extractFmInnerAndBody(content)
  const blocks = parseTopLevelYamlBlocks(fmInner)
  const basicKeysExtended = ["name", "description", "version", "homepage", "emoji", "author"] as const
  const basicLines = basicKeysExtended
    .map((k) => blocks.get(k) ?? "")
    .filter((s) => s.length > 0)
  const basic = basicLines.length > 0 ? ["---", ...basicLines].join("\n") : ""
  const triggerKeys = [
    "triggers",
    "read_when",
    "auto_trigger",
    "user-invocable",
    "disable-model-invocation",
    "command-dispatch",
    "command-tool",
    "command-arg-mode",
    "allowed-tools",
  ] as const
  const triggerLines = triggerKeys
    .map((k) => blocks.get(k) ?? "")
    .filter((s) => s.length > 0)
  const trigger = triggerLines.length > 0 ? triggerLines.join("\n") : ""
  const meta = blocks.get("metadata") ?? ""
  const env = blocks.get("env") ?? ""
  const tools = blocks.get("tools") ?? ""
  const files = blocks.get("files") ?? ""
  const { exec, doc } = splitBodyExecDoc(body)
  return { basic, trigger, meta, env, tools, files, exec, doc }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

type InspectorEntityRule = { re: RegExp; eid: string; fieldKey?: string }

const BASIC_FIELD_MAP: Record<string, string> = {
  name: "f-name",
  description: "f-desc",
  version: "f-ver",
  homepage: "f-home",
  emoji: "f-emoji",
  author: "f-author",
}

function wrapBasicFieldLines(html: string): string {
  return html.replace(
    /(<span class="syntax-key">(name|description|version|homepage|emoji|author)<\/span>.*?)(?=\n|$)/g,
    (_match, line, key) => {
      const field = BASIC_FIELD_MAP[key]
      if (!field) return line
      return `<span data-field="${field}" class="pf">${line}</span>`
    },
  )
}

function wrapYamlListBlocks(
  text: string,
  fieldKeyForBlock: (block: string) => string | null,
): string {
  const lines = text.split(/\r?\n/)
  if (lines.length === 0) return ""

  const out: string[] = []
  let block: string[] = []

  const flush = () => {
    if (block.length === 0) return
    const content = block.join("\n")
    const fieldKey = fieldKeyForBlock(content)
    const html = highlightYaml(content)
    out.push(fieldKey ? `<div class="pf" data-field="${fieldKey}">${html}</div>` : html)
    block = []
  }

  out.push(highlightYaml(lines[0] ?? ""))
  for (const line of lines.slice(1)) {
    if (/^\s*-\s/.test(line)) {
      flush()
      block = [line]
      continue
    }
    if (block.length > 0) {
      block.push(line)
    } else {
      out.push(highlightYaml(line))
    }
  }
  flush()
  return out.join("\n")
}

function wrapYamlNamedBlocks(
  text: string,
  fieldMap: Record<string, string>,
): string {
  const lines = text.split(/\r?\n/)
  if (lines.length === 0) return ""

  const out: string[] = []
  let block: string[] = []
  let currentName: string | null = null

  const flush = () => {
    if (block.length === 0) return
    const content = block.join("\n")
    const html = highlightYaml(content)
    const fieldKey = currentName ? fieldMap[currentName] : undefined
    out.push(fieldKey ? `<div class="pf" data-field="${fieldKey}">${html}</div>` : html)
    block = []
    currentName = null
  }

  out.push(highlightYaml(lines[0] ?? ""))
  for (const line of lines.slice(1)) {
    // handle both  read:  and  "read":
    const match = line.match(/^(\s*)(?:"(read|write)"|(read|write)):\s*$/)
    if (match) {
      flush()
      currentName = match[2] ?? match[3] ?? null
      block = [line]
      continue
    }
    if (block.length > 0) {
      block.push(line)
    } else {
      out.push(highlightYaml(line))
    }
  }
  flush()
  return out.join("\n")
}

function scriptTitleToEid(title: string): string | null {
  const m = title.match(/([\w-]+(?:\.py)?)/i)
  if (!m) return null
  return m[1].replace(/\.py$/i, "")
}

function docFieldKey(title: string): string {
  return `f-d-${title.slice(0, 8).replace(/\s+/g, "-").toLowerCase()}`
}

function wrapMarkdownHeadingBlocks(
  text: string,
  fieldKeyForTitle: (title: string) => string | null,
): string {
  const trimmed = text.trimEnd()
  if (!trimmed) return ""

  const chunks = trimmed.split(/(?=^#{1,6}\s+.+$)/m).filter((chunk) => chunk.trim().length > 0)
  return chunks
    .map((chunk) => {
      const title = chunk.match(/^#{1,6}\s+(.+)$/m)?.[1]?.trim()
      const html = highlightYaml(chunk)
      const fieldKey = title ? fieldKeyForTitle(title) : null
      return fieldKey ? `<div class="pf" data-field="${fieldKey}">${html}</div>` : html
    })
    .join("\n")
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function buildInspectorEntityRules(
  skill: ParsedSkill | null,
  fm: SkillFrontmatter | null,
): Record<keyof PreviewParts, InspectorEntityRule[]> {
  const empty: Record<keyof PreviewParts, InspectorEntityRule[]> = {
    basic: [],
    trigger: [],
    meta: [],
    env: [],
    tools: [],
    files: [],
    exec: [],
    doc: [],
  }
  if (!skill || !fm) return empty

  const env: InspectorEntityRule[] = (fm.env ?? []).map((e) => ({
    re: new RegExp(`\\b${escapeRegExp(e.name)}\\b`, "g"),
    eid: e.name,
    fieldKey: `f-e-${e.name}`,
  }))

  const tools: InspectorEntityRule[] = skill.tools.map((t) => ({
    re: new RegExp(`\\b${escapeRegExp(t.name)}\\b`, "g"),
    eid: t.name,
    fieldKey: `f-t-${t.name}`,
  }))

  const filesSeen = new Set<string>()
  const files: InspectorEntityRule[] = []
  const addFileRule = (pattern: string, eid: string, fieldKey?: string) => {
    if (filesSeen.has(eid)) return
    filesSeen.add(eid)
    files.push({ re: new RegExp(escapeRegExp(pattern), "g"), eid, fieldKey })
  }
  const allPaths = [
    ...(Array.isArray(fm.files?.read) ? fm.files!.read : []),
    ...(Array.isArray(fm.files?.write) ? fm.files!.write : []),
  ]
  for (const item of allPaths) {
    const p = typeof item === "string" ? item : String(item)
    if (p.includes("config/defaults/")) addFileRule("config/defaults/", "config-defaults", "f-p-config-defaults")
    if (p.startsWith("references/") || p.includes("/references/")) addFileRule("references/", "references-dir", "f-p-references-dir")
    if (p.startsWith("scripts/") || p.includes("/scripts/")) addFileRule("scripts/", "scripts-dir", "f-p-scripts-dir")
    const basename = p.split("/").pop()
    if (basename?.endsWith(".json")) addFileRule(basename, basename)
  }

  const exec: InspectorEntityRule[] = []
  const execSeen = new Set<string>()
  for (const s of skill.sections) {
    if (!/脚本|script|pipeline/i.test(s.title)) continue
    const m = s.title.match(/(?:###?\s+)?([\w-]+(?:\.py)?)/i)
    if (!m) continue
    const raw = m[1].replace(/\.py$/i, "")
    if (execSeen.has(raw)) continue
    execSeen.add(raw)
    exec.push({
      re: new RegExp(`\\b${escapeRegExp(raw)}(?:\\.py)?\\b`, "g"),
      eid: raw,
      fieldKey: `f-x-${raw}`,
    })
  }

  return { basic: [], trigger: [], meta: [], env, tools, files, exec, doc: [] }
}

function classForBridgeEid(
  eid: string,
  selectedEid: string | null,
  relatedEids: string[],
): string {
  const s = getRelationCountSummary(eid)
  const hasRel = s.forward + s.alternate + s.contains > 0
  const isSelected = selectedEid != null && selectedEid === eid
  const isRelated = selectedEid != null && !isSelected && relatedEids.includes(eid)
  const isDimmed = selectedEid != null && !isSelected && !relatedEids.includes(eid)
  return [
    "en",
    hasRel ? "has-rel" : "",
    isSelected ? "eid-selected" : "",
    isRelated ? "eid-related" : "",
    isDimmed ? "eid-dimmed" : "",
  ]
    .filter(Boolean)
    .join(" ")
}

function wrapInspectorTextWithEntities(
  text: string,
  rules: InspectorEntityRule[],
  selectedEid: string | null,
  relatedEids: string[],
): string {
  let out = text
  for (const { re, eid, fieldKey } of rules) {
    const cls = classForBridgeEid(eid, selectedEid, relatedEids)
    const fieldAttr = fieldKey ?? eid
    out = out.replace(re, (m) => {
      return `<span class="${cls}" data-eid="${eid}" data-field="${fieldAttr}">${m}</span>`
    })
  }
  return out
}

function injectInspectorBridgeEntities(
  html: string,
  sectionKey: keyof PreviewParts,
  selectedEid: string | null,
  relatedEids: string[],
  allRules: Record<keyof PreviewParts, InspectorEntityRule[]>,
): string {
  const rules = allRules[sectionKey]
  if (!rules.length) return html
  const sorted = [...rules].sort((a, b) => b.re.source.length - a.re.source.length)
  const parts = html.split(/(<[^>]+>)/)
  return parts
    .map((part) => (
      part.startsWith("<")
        ? part
        : wrapInspectorTextWithEntities(
            part,
            sorted,
            selectedEid,
            relatedEids,
          )
    ))
    .join("")
}

function highlightYaml(text: string): string {
  if (!text) return ""
  return escapeHtml(text)
    // match both plain key (name:) and quoted key ("name":)
    .replace(/^(\s*)(?:"([\w-]+)"|([\w-]+))(:)/gm, (_, indent, qKey, pKey, colon) => {
      const key = qKey ?? pKey
      return `${indent}<span class="syntax-key">${key}</span>${colon}`
    })
    .replace(/:\s*"([^"]*)"/g, ": <span class=\"syntax-value\">\"$1\"</span>")
    .replace(/:\s*'([^']*)'/g, ": <span class=\"syntax-value\">'$1'</span>")
    .replace(/:\s*(true|false)\b/g, ": <span class=\"syntax-bool\">$1</span>")
    .replace(/^(#{1,6}\s+.*)$/gm, "<span class=\"syntax-heading\">$1</span>")
    .replace(/^(---)\s*$/gm, "<span class=\"syntax-dim\">$1</span>")
}

function buildSectionHtml(
  sectionKey: keyof PreviewParts,
  raw: string,
  skill: ParsedSkill | null,
): string {
  if (!raw) return ""

  switch (sectionKey) {
    case "basic": {
      return wrapBasicFieldLines(highlightYaml(raw))
    }
    case "env": {
      return wrapYamlListBlocks(raw, (block) => {
        // handle both  name: MY_VAR  and  "name": "MY_VAR"
        const name = block.match(/(?:"name"|name):\s*["']?([^"'\n]+?)["']?\s*$/m)?.[1]?.trim()
        return name ? `f-e-${name}` : null
      })
    }
    case "tools": {
      return wrapYamlListBlocks(raw, (block) => {
        const m = block.match(/^\s*-\s*["']?([\w.-]+)/m)
        return m ? `f-t-${m[1]}` : null
      })
    }
    case "files": {
      return wrapYamlNamedBlocks(raw, { read: "f-fr", write: "f-fw" })
    }
    case "exec": {
      return wrapMarkdownHeadingBlocks(raw, (title) => {
        const eid = scriptTitleToEid(title)
        return eid ? `f-x-${eid}` : null
      })
    }
    case "doc": {
      return wrapMarkdownHeadingBlocks(raw, (title) => {
        if (!skill) return null
        const matched = skill.sections.find((section) => section.title === title)
        return matched ? docFieldKey(matched.title) : null
      })
    }
    case "trigger":
    case "meta":
    default:
      return highlightYaml(raw)
  }
}

function PreviewSectionBlock({
  sectionId,
  title,
  color,
  html,
  badge,
  dimmed,
  children,
}: {
  sectionId: string
  title: string
  color: string
  html?: string
  badge?: string
  dimmed?: boolean
  children?: ReactNode
}) {
  const [open, setOpen] = useState(true)
  const api = usePanelSyncApi()
  const expandTickRef = useRef(api?.inspectorExpandTick ?? 0)
  useEffect(() => {
    if (!api || api.inspectorExpandTick === expandTickRef.current) return
    expandTickRef.current = api.inspectorExpandTick
    setOpen(api.inspectorAllExpanded)
  }, [api?.inspectorExpandTick, api?.inspectorAllExpanded])
  return (
    <div
      data-bridge-section={sectionId}
      style={{ borderLeftColor: `color-mix(in srgb, ${color} 32%, transparent)` }}
      className={cn(
        !open && "bridge-section-collapsed",
        dimmed && "bridge-dim",
      )}
    >
      <div
        className="bridge-section-header"
        onClick={() => api?.scrollBothToSection(sectionId)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            api?.scrollBothToSection(sectionId)
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span
          className="bridge-section-caret text-[8px] text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation()
              e.preventDefault()
              setOpen((v) => !v)
            }
          }}
          role="button"
          tabIndex={0}
        >
          ▼
        </span>
        <span className="bridge-section-dot" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold">{title}</span>
        {badge && (
          <span className="bridge-badge">
            {badge}
          </span>
        )}
      </div>
      <div className="bridge-section-content">
        {children ? (
          <div className="pc">{children}</div>
        ) : html ? (
          <div
            className="pc"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : null}
      </div>
    </div>
  )
}

function SectionedPreview({
  content,
  skill,
  fm,
  bodyDocument,
  selectedEid,
  relatedEids,
  isSectionDimmed,
}: {
  content: string
  skill: ParsedSkill | null
  fm: SkillFrontmatter | null
  bodyDocument: ParsedDocument | null
  selectedEid: string | null
  relatedEids: string[]
  isSectionDimmed: (sectionId: string) => boolean
}) {
  const { t } = useTranslation()
  const parts = useMemo(() => splitPreviewInto8(content), [content])
  const entityRules = useMemo(() => buildInspectorEntityRules(skill, fm), [skill, fm])

  const { bodyExecSections, bodyDocSections } = useMemo(() => {
    if (!bodyDocument) return { bodyExecSections: [] as ContentSection[], bodyDocSections: [] as ContentSection[] }
    const execPattern = /脚本|script|pipeline/i
    const exec = bodyDocument.sections.filter(s => execPattern.test(s.heading.text))
    const doc = bodyDocument.sections.filter(s => !execPattern.test(s.heading.text))
    return { bodyExecSections: exec, bodyDocSections: doc }
  }, [bodyDocument])

  return (
    <div className="p-2 pl-1.5" style={{ paddingBottom: 32 }}>
      {/* Front 6 frontmatter sections — keep existing YAML highlight rendering */}
      {BRIDGE_SECTIONS.filter(def => def.id !== "exec" && def.id !== "doc").map((def) => {
        const key = def.id as keyof PreviewParts
        const raw = parts[key] ?? ""
        let html = buildSectionHtml(key, raw, skill)
        html = injectInspectorBridgeEntities(
          html,
          key,
          selectedEid,
          relatedEids,
          entityRules,
        )
        let badge: string | undefined
        if (def.id === "meta") badge = t("workspace.action.readOnly")
        else if (def.id === "env" && skill) badge = `${skill.frontmatter.env?.length ?? 0}`
        else if (def.id === "tools" && skill) badge = `${skill.tools.length}`

        return (
          <PreviewSectionBlock
            key={def.id}
            sectionId={def.id}
            title={t(`workspace.bridge.section.${def.id}`, { defaultValue: SECTION_MAP[def.id]?.name ?? def.id })}
            color={def.color}
            dimmed={isSectionDimmed(def.id)}
            badge={badge}
            html={html}
          />
        )
      })}

      {/* exec sections — FragmentBlock read-only */}
      {bodyExecSections.map((section) => (
        <PreviewSectionBlock
          key={`exec-${section.id}`}
          sectionId={`exec-${section.id}`}
          title={section.heading.text}
          color={SECTION_MAP["exec"]?.color ?? "#14b8a6"}
          dimmed={isSectionDimmed("exec")}
        >
          {section.blocks.map((block, i) => (
            <FragmentBlock key={i} block={block} editing={false}
              fieldId={`f-x-${section.id}-${i}`} onUpdate={() => {}} />
          ))}
        </PreviewSectionBlock>
      ))}

      {/* doc sections — FragmentBlock read-only */}
      {bodyDocSections.map((section) => (
        <PreviewSectionBlock
          key={`doc-${section.id}`}
          sectionId={`doc-${section.id}`}
          title={section.heading.text}
          color={SECTION_MAP["doc"]?.color ?? "#14b8a6"}
          dimmed={isSectionDimmed("doc")}
          badge={`${section.blocks.length}`}
        >
          {section.blocks.map((block, i) => (
            <FragmentBlock key={i} block={block} editing={false}
              fieldId={`f-doc-${section.id}-${i}`} onUpdate={() => {}} />
          ))}
        </PreviewSectionBlock>
      ))}
    </div>
  )
}

function ExtraFileSourcePreview({ doc }: { doc: ParsedDocument }) {
  const { t } = useTranslation()
  const api = usePanelSyncApi()
  const expandTickRef = useRef(api?.inspectorExpandTick ?? 0)
  const [collapsedSet, setCollapsedSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!api || api.inspectorExpandTick === expandTickRef.current) return
    expandTickRef.current = api.inspectorExpandTick
    setCollapsedSet(api.inspectorAllExpanded ? new Set() : new Set(
      ["__preamble__", ...doc.sections.map((s) => s.id)]
    ))
  }, [api?.inspectorExpandTick, api?.inspectorAllExpanded, doc.sections])

  const toggle = useCallback((id: string) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div className="p-2 pl-1.5" style={{ paddingBottom: 32 }}>
      {doc.preamble.length > 0 && (
        <div data-bridge-section="__preamble__"
          style={{ borderLeftColor: "color-mix(in srgb, #64748b 32%, transparent)" }}
          className={collapsedSet.has("__preamble__") ? "bridge-section-collapsed" : undefined}>
          <div className="bridge-section-header" onClick={() => api?.scrollBothToSection("__preamble__")}>
            <span
              className="bridge-section-caret text-[8px] text-muted-foreground"
              style={{ transform: collapsedSet.has("__preamble__") ? "rotate(-90deg)" : undefined }}
              onClick={(e) => { e.stopPropagation(); toggle("__preamble__") }}
            >▼</span>
            <span className="bridge-section-dot" style={{ backgroundColor: "#64748b" }} />
            <span className="text-xs font-semibold text-muted-foreground">{t("workspace.file.overview")}</span>
          </div>
          <div className="bridge-section-content">
            <div className="pc">
              {doc.preamble.map((block, i) => (
                <div key={i} data-field={`__preamble__-b${i}`}>
                  <pre className="whitespace-pre-wrap" style={{ margin: 0 }}>{block.raw}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {doc.sections.map((sec) => {
        const isCollapsed = collapsedSet.has(sec.id)
        return (
          <div key={sec.id} data-bridge-section={sec.id}
            style={{ borderLeftColor: "color-mix(in srgb, #64748b 32%, transparent)" }}
            className={isCollapsed ? "bridge-section-collapsed" : undefined}>
            <div className="bridge-section-header" onClick={() => api?.scrollBothToSection(sec.id)}>
              <span
                className="bridge-section-caret text-[8px] text-muted-foreground"
                style={{ transform: isCollapsed ? "rotate(-90deg)" : undefined }}
                onClick={(e) => { e.stopPropagation(); toggle(sec.id) }}
              >▼</span>
              <span className="bridge-section-dot" style={{ backgroundColor: "#64748b" }} />
              <span className="text-xs font-semibold">{sec.heading.text}</span>
              {sec.blocks.length > 0 && (
                <span className="bridge-badge">{sec.blocks.length}</span>
              )}
            </div>
            <div className="bridge-section-content">
              <div className="pc">
                <pre className="whitespace-pre-wrap" style={{ margin: 0 }}>{sec.heading.raw}</pre>
                {sec.blocks.map((block, bi) => (
                  <div key={bi} data-field={`${sec.id}-b${bi}`}>
                    <pre className="whitespace-pre-wrap" style={{ margin: 0 }}>{block.raw}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BodyOnlyPreview({
  bodyDocument,
  isSectionDimmed,
}: {
  bodyDocument: ParsedDocument | null
  isSectionDimmed: (sectionId: string) => boolean
}) {
  const { t } = useTranslation()
  const { bodyExecSections, bodyDocSections } = useMemo(() => {
    if (!bodyDocument) return { bodyExecSections: [] as ContentSection[], bodyDocSections: [] as ContentSection[] }
    const execPattern = /脚本|script|pipeline/i
    const exec = bodyDocument.sections.filter(s => execPattern.test(s.heading.text))
    const doc = bodyDocument.sections.filter(s => !execPattern.test(s.heading.text))
    return { bodyExecSections: exec, bodyDocSections: doc }
  }, [bodyDocument])

  return (
    <div className="p-2 pl-1.5" style={{ paddingBottom: 32 }}>
      <div className="mb-2 px-3 py-2 rounded text-xs"
        style={{ background: "rgba(59,130,246,0.08)", color: "#60a5fa" }}>
        ℹ️ {t("workspace.hint.noFrontmatter")}
      </div>
      {bodyExecSections.map((section) => (
        <PreviewSectionBlock key={`exec-${section.id}`} sectionId={`exec-${section.id}`}
          title={section.heading.text} color={SECTION_MAP["exec"]?.color ?? "#8b5cf6"}
          dimmed={isSectionDimmed("exec")}>
          {section.blocks.map((block, i) => (
            <FragmentBlock key={i} block={block} editing={false}
              fieldId={`f-x-${section.id}-${i}`} onUpdate={() => {}} />
          ))}
        </PreviewSectionBlock>
      ))}
      {bodyDocSections.map((section) => (
        <PreviewSectionBlock key={`doc-${section.id}`} sectionId={`doc-${section.id}`}
          title={section.heading.text} color={SECTION_MAP["doc"]?.color ?? "#14b8a6"}
          dimmed={isSectionDimmed("doc")} badge={`${section.blocks.length}`}>
          {section.blocks.map((block, i) => (
            <FragmentBlock key={i} block={block} editing={false}
              fieldId={`f-doc-${section.id}-${i}`} onUpdate={() => {}} />
          ))}
        </PreviewSectionBlock>
      ))}
    </div>
  )
}

function BrokenFmPreview({
  rawFrontmatter,
  bodyDocument,
  isSectionDimmed,
}: {
  rawFrontmatter: string | null
  bodyDocument: ParsedDocument | null
  isSectionDimmed: (sectionId: string) => boolean
}) {
  const { t } = useTranslation()
  const { bodyExecSections, bodyDocSections } = useMemo(() => {
    if (!bodyDocument) return { bodyExecSections: [] as ContentSection[], bodyDocSections: [] as ContentSection[] }
    const execPattern = /脚本|script|pipeline/i
    const exec = bodyDocument.sections.filter(s => execPattern.test(s.heading.text))
    const doc = bodyDocument.sections.filter(s => !execPattern.test(s.heading.text))
    return { bodyExecSections: exec, bodyDocSections: doc }
  }, [bodyDocument])

  return (
    <div className="p-2 pl-1.5" style={{ paddingBottom: 32 }}>
      <div className="mb-2 px-3 py-2 rounded text-xs"
        style={{ background: "rgba(239,68,68,0.08)", color: "#f87171" }}>
        ⚠️ {t("workspace.hint.brokenFrontmatter")}
      </div>
      {rawFrontmatter && (
        <PreviewSectionBlock sectionId="broken-fm" title={t("workspace.hint.brokenFrontmatterTitle")} color="#ef4444">
          <pre className="whitespace-pre-wrap text-[10px]">{rawFrontmatter}</pre>
        </PreviewSectionBlock>
      )}
      {bodyExecSections.map((section) => (
        <PreviewSectionBlock key={`exec-${section.id}`} sectionId={`exec-${section.id}`}
          title={section.heading.text} color={SECTION_MAP["exec"]?.color ?? "#8b5cf6"}
          dimmed={isSectionDimmed("exec")}>
          {section.blocks.map((block, i) => (
            <FragmentBlock key={i} block={block} editing={false}
              fieldId={`f-x-${section.id}-${i}`} onUpdate={() => {}} />
          ))}
        </PreviewSectionBlock>
      ))}
      {bodyDocSections.map((section) => (
        <PreviewSectionBlock key={`doc-${section.id}`} sectionId={`doc-${section.id}`}
          title={section.heading.text} color={SECTION_MAP["doc"]?.color ?? "#14b8a6"}
          dimmed={isSectionDimmed("doc")} badge={`${section.blocks.length}`}>
          {section.blocks.map((block, i) => (
            <FragmentBlock key={i} block={block} editing={false}
              fieldId={`f-doc-${section.id}-${i}`} onUpdate={() => {}} />
          ))}
        </PreviewSectionBlock>
      ))}
    </div>
  )
}

export function InspectorPanel() {
  const { t } = useTranslation()
  const api = usePanelSyncApi()
  const { state, selectedSkill, editState, markSaved } = useWorkspace()
  const selection = state.selection
  const selectedEid = api?.selectedEid ?? null
  const relatedEids = api?.relatedEids ?? []
  const [diffOpen, setDiffOpen] = useState(false)

  const handleInspectorClick = useCallback(
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

  const skillMdPreview = useMemo(() => {
    if (!editState) return ""
    return serializeSkillMd(
      editState.frontmatter,
      editState.markdownBody,
      editState.frontmatterStatus,
    )
  }, [editState])

  const previewBodyDoc = useMemo(() => {
    if (!editState?.markdownBody) return selectedSkill?.bodyDocument ?? null
    return parseDocument(editState.markdownBody)
  }, [editState?.markdownBody, selectedSkill?.bodyDocument])

  const selectedConfigData = useMemo(() => {
    if (!selection || selection.nodeType !== "config-file" || !selection.filePath || !editState) {
      return undefined
    }
    return editState.configFiles[selection.filePath]
  }, [selection, editState])

  const [saving, setSaving] = useState(false)

  const exportSkillMd = () => {
    downloadFile("SKILL.md", skillMdPreview, "text/markdown;charset=utf-8")
  }

  const hasValidationErrors = useMemo(() => {
    if (!editState?.frontmatter) return false
    return !frontmatterSchema.safeParse(editState.frontmatter).success
  }, [editState?.frontmatter])

  const handleSaveAll = useCallback(async () => {
    if (!selectedSkill || !editState?.dirty) return

    // Validate frontmatter before saving
    const validation = frontmatterSchema.safeParse(editState.frontmatter)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      const field = firstError?.path?.join(".") ?? ""
      toast.error(`${t("workspace.action.validationFailed")}: ${field ? `${field} — ` : ""}${firstError?.message ?? ""}`)
      return
    }

    setSaving(true)
    try {
      await saveSkillFile(selectedSkill.path, "SKILL.md", skillMdPreview)
      for (const [path, data] of Object.entries(editState.configFiles)) {
        await saveSkillConfig(selectedSkill.path, path, data)
      }
      for (const [path, content] of Object.entries(editState.extraFiles)) {
        await saveSkillFile(selectedSkill.path, path, content)
      }
      for (const dp of editState.deletedConfigPaths) {
        await deleteSkillFile(selectedSkill.path, dp)
      }
      for (const dp of editState.deletedExtraPaths) {
        await deleteSkillFile(selectedSkill.path, dp)
      }
      markSaved(selectedSkill.id, skillMdPreview)

      // SSH write-back: if skill came from SSH, push changes to remote
      if (selectedSkill.origin?.type === "ssh") {
        try {
          const connStatus = await getConnectionStatus()
          if (connStatus?.connected) {
            const remoteFiles: Array<{ path: string; content: string }> = [
              { path: "SKILL.md", content: skillMdPreview },
            ]
            for (const [path, data] of Object.entries(editState.configFiles)) {
              remoteFiles.push({ path, content: JSON.stringify(data, null, 2) })
            }
            for (const [path, content] of Object.entries(editState.extraFiles)) {
              remoteFiles.push({ path, content })
            }
            await writeRemoteSkill(selectedSkill.id, remoteFiles)
            toast.success(t("workspace.ssh.syncSuccess"))
          } else {
            toast.info(t("workspace.ssh.savedLocal"))
          }
        } catch {
          toast.info(t("workspace.ssh.savedLocal"))
        }
      } else {
        toast.success(t("workspace.action.saved"))
      }
    } catch (err) {
      toast.error(`${t("workspace.action.saveFailed")}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }, [selectedSkill, editState, skillMdPreview, markSaved, t])

  const showSkillMdChrome = selection?.nodeType === "skill-md"
  const showConfigChrome = selection?.nodeType === "config-file" && Boolean(selection.filePath)
  const showExtraChrome = selection?.nodeType === "extra-file" && Boolean(selection.filePath)

  const extraFile = showExtraChrome && selection.filePath
    ? selectedSkill?.extraFiles[selection.filePath]
    : null
  const extraContent = showExtraChrome && selection.filePath && editState
    ? (editState.extraFiles[selection.filePath] ?? extraFile?.content ?? "")
    : ""
  const extraDoc = useMemo<ParsedDocument | null>(() => {
    if (!extraContent || extraFile?.type !== "markdown") return null
    return parseDocument(extraContent)
  }, [extraContent, extraFile?.type])

  const showEmptyHint =
    selection &&
    selection.nodeType !== "skill-md" &&
    selection.nodeType !== "config-file" &&
    selection.nodeType !== "extra-file"

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l bg-background">
      <div className="flex shrink-0 items-center justify-between gap-1.5 border-b px-3.5 h-[34px] min-h-[34px] text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-1.5">
          <FileText className="size-3.5 shrink-0" aria-hidden />
          <strong className="text-foreground">{t("workspace.panelTitle.sourcePreview")}</strong>
          {showSkillMdChrome && (
            <span className="text-[10px] truncate" style={{ marginLeft: 'auto' }}>SKILL.md</span>
          )}
          {showConfigChrome && selection.filePath && (
            <span className="text-[10px] truncate">{selection.filePath.split("/").pop()}</span>
          )}
          {showExtraChrome && selection.filePath && (
            <span className="text-[10px] truncate">{selection.filePath.split("/").pop()}</span>
          )}
          {editState?.dirty && (() => {
            const changes = computeChanges(editState)
            const label = changes.totalCount > 0
              ? t("workspace.action.modifiedCount", { count: changes.totalCount })
              : t("workspace.action.modified")
            const tooltip = changes.areas.map((a) =>
              a === "frontmatter" ? t("workspace.changes.frontmatter")
              : a === "body" ? t("workspace.changes.body")
              : a.split("/").pop() ?? a
            ).join(", ")
            return (
              <button type="button" onClick={() => setDiffOpen(true)} title={tooltip}>
                <Badge
                  variant="outline"
                  className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 cursor-pointer hover:bg-amber-500/20 transition-colors"
                >
                  {label}
                </Badge>
              </button>
            )
          })()}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {api && (
            <button
              type="button"
              className="shrink-0 p-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              onClick={api.toggleAllInspector}
              title={api.inspectorAllExpanded ? t("workspace.action.collapseAll") : t("workspace.action.expandAll")}
            >
              {api.inspectorAllExpanded ? <ChevronsDownUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
            </button>
          )}
          {showSkillMdChrome && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 gap-1 px-2 text-[11px]"
              onClick={exportSkillMd}
            >
              <Download className="size-3.5" />
              {t("workspace.action.export")}
            </Button>
          )}
          {showConfigChrome && selectedConfigData !== undefined && selection.filePath && (
            <ExportButton
              filename={selection.filePath.split("/").pop() ?? "config.json"}
              data={selectedConfigData}
            />
          )}
          {editState?.dirty && (
            <button
              type="button"
              className="shrink-0 p-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setDiffOpen(true)}
              title={t("workspace.diff.viewDiff")}
            >
              <ArrowLeftRight className="size-3.5" />
            </button>
          )}
          {isTauri() && editState?.dirty && (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              disabled={saving || hasValidationErrors}
              onClick={handleSaveAll}
              title={hasValidationErrors ? t("workspace.action.validationFailed") : undefined}
            >
              <Save className="size-3.5" />
              {saving ? t("workspace.action.saving") : t("workspace.action.save")}
            </Button>
          )}
        </div>
      </div>

      {!selectedSkill || !editState ? (
        <div className="p-3 text-sm">
          {!selection && <p className="text-muted-foreground">{t("workspace.empty.selectNode")}</p>}
          {selection && !selectedSkill && <p className="text-muted-foreground">{t("workspace.empty.cannotLoadSkill")}</p>}
        </div>
      ) : (
        <>
          <div
            ref={api?.inspectorRef}
            className="min-h-0 flex-1 overflow-y-auto thin-scroll"
            onClick={api ? handleInspectorClick : undefined}
          >
            {selection?.nodeType === "skill-md" && editState && (
              editState.frontmatterStatus === "valid" ? (
                <SectionedPreview
                  content={skillMdPreview}
                  skill={selectedSkill}
                  fm={editState.frontmatter}
                  bodyDocument={previewBodyDoc}
                  selectedEid={selectedEid}
                  relatedEids={relatedEids}
                  isSectionDimmed={(sectionId) => api?.isSectionDimmed(sectionId) ?? false}
                />
              ) : editState.frontmatterStatus === "missing" ? (
                <BodyOnlyPreview
                  bodyDocument={previewBodyDoc}
                  isSectionDimmed={(sectionId) => api?.isSectionDimmed(sectionId) ?? false}
                />
              ) : (
                <BrokenFmPreview
                  rawFrontmatter={editState.rawFrontmatter}
                  bodyDocument={previewBodyDoc}
                  isSectionDimmed={(sectionId) => api?.isSectionDimmed(sectionId) ?? false}
                />
              )
            )}

            {selection?.nodeType === "config-file" && selection.filePath && (
              selectedConfigData !== undefined ? (
                <ConfigFilePreview data={selectedConfigData} filePath={selection.filePath} />
              ) : (
                <p className="p-3 text-sm text-muted-foreground">{t("workspace.empty.noFileData")}</p>
              )
            )}

            {showExtraChrome && extraContent && (
              extraDoc ? (
                <ExtraFileSourcePreview doc={extraDoc} />
              ) : (
                <div className="p-2 pl-1.5" style={{ paddingBottom: 32 }}>
                  <SectionBlock
                    sectionId={`xf-${selection.filePath?.split("/").pop() ?? "file"}`}
                    title={selection.filePath?.split("/").pop() ?? t("workspace.field.file")}
                    color="#64748b"
                    badge={extraFile?.type}
                  >
                    <div className="pc">
                      <pre className="sh-code whitespace-pre-wrap" style={{ lineHeight: 1.45 }}>
                        <code dangerouslySetInnerHTML={{ __html: highlight(extraContent) }} />
                      </pre>
                    </div>
                  </SectionBlock>
                </div>
              )
            )}

            {showEmptyHint && (
              <div className="p-4 text-sm text-muted-foreground">
                {t("workspace.empty.selectToPreview")}
              </div>
            )}
          </div>
        </>
      )}
      {editState?.dirty && (
        <DiffViewer
          open={diffOpen}
          onOpenChange={setDiffOpen}
          diffs={diffOpen ? computeSkillDiff(editState) : []}
          skillName={selectedSkill?.frontmatter.name ?? ""}
        />
      )}
    </div>
  )
}

/* ─── Config file structured preview ─── */

const CONFIG_COLOR = "#06b6d4"

function configPreviewKind(filePath: string): "sources" | "topics" | "schema" | null {
  const base = filePath.split("/").pop() ?? filePath
  if (base === "sources.json") return "sources"
  if (base === "topics.json") return "topics"
  if (base === "schema.json") return "schema"
  return null
}

function ConfigFilePreview({ data, filePath }: { data: unknown; filePath: string }) {
  const kind = configPreviewKind(filePath)
  if (kind === "sources" && data && typeof data === "object" && "sources" in data) {
    return <SourcesPreview data={data as { sources: SourcePreviewItem[] }} />
  }
  if (kind === "topics" && data && typeof data === "object" && "topics" in data) {
    return <TopicsPreview data={data as { topics: TopicPreviewItem[] }} />
  }
  // schema and unknown: formatted JSON in SectionBlock
  return <SchemaJsonPreview data={data} filePath={filePath} />
}

interface SourcePreviewItem {
  id: string; type: string; name: string; enabled: boolean
  priority: boolean; topics: string[]; url?: string; note?: string
  [key: string]: unknown
}

function SourcesPreview({ data }: { data: { sources: SourcePreviewItem[] } }) {
  const { t } = useTranslation()
  const sources = data.sources
  const enabledCount = sources.filter(s => s.enabled).length

  return (
    <div className="p-2 pl-1.5" style={{ paddingBottom: 32 }}>
      <SectionBlock
        sectionId="cfg-sources"
        title={t("workspace.configEditor.sourcesCount", { count: sources.length })}
        color={CONFIG_COLOR}
        badge={`${enabledCount}/${sources.length}`}
        readOnly
      >
        <div className="pc">
          {sources.map(src => (
            <div key={src.id} className="pf" style={{ fontSize: 11, lineHeight: 1.6 }}>
              <span style={{ color: "var(--muted-foreground)", marginRight: 6 }}>{src.type}</span>
              <strong>{src.name || src.id}</strong>
              {src.url && (
                <span style={{ color: "var(--muted-foreground)", fontSize: 10, marginLeft: 6 }}>{src.url}</span>
              )}
              <span style={{ float: "right", fontSize: 10, color: "var(--muted-foreground)" }}>
                {src.enabled
                  ? <span style={{ color: "#10b981" }}>✓</span>
                  : <span style={{ opacity: 0.35 }}>—</span>}
                {src.priority && <span style={{ color: "#f59e0b", marginLeft: 4 }}>★</span>}
              </span>
            </div>
          ))}
        </div>
      </SectionBlock>
    </div>
  )
}

interface TopicPreviewItem {
  id: string; emoji: string; label: string; description: string
  search: { queries: string[]; [key: string]: unknown }
  display: { max_items: number; style: string; [key: string]: unknown }
  [key: string]: unknown
}

function TopicsPreview({ data }: { data: { topics: TopicPreviewItem[] } }) {
  const { t } = useTranslation()

  return (
    <div className="p-2 pl-1.5" style={{ paddingBottom: 32 }}>
      <SectionBlock
        sectionId="cfg-topics"
        title={t("workspace.configEditor.topicsCount", { count: data.topics.length })}
        color={CONFIG_COLOR}
        badge={`${data.topics.length}`}
        readOnly
      >
        <div className="pc">
          {data.topics.map(topic => (
            <div key={topic.id} className="pf" style={{ fontSize: 11, lineHeight: 1.8 }}>
              <span style={{ marginRight: 4 }}>{topic.emoji}</span>
              <strong>{topic.label}</strong>
              <span style={{ color: "var(--muted-foreground)", fontSize: 10, marginLeft: 8 }}>
                {topic.description.length > 60 ? topic.description.slice(0, 60) + "…" : topic.description}
              </span>
              <span style={{ float: "right" }}>
                {topic.search.queries?.length > 0 && (
                  <span className="bridge-badge">{topic.search.queries.length}q</span>
                )}
                <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginLeft: 4 }}>{topic.display.style}</span>
              </span>
            </div>
          ))}
        </div>
      </SectionBlock>
    </div>
  )
}

function SchemaJsonPreview({ data, filePath }: { data: unknown; filePath: string }) {
  const formatted = useMemo(() => {
    try { return JSON.stringify(data, null, 2) }
    catch { return "// JSON serialize failed" }
  }, [data])

  return (
    <div className="p-2 pl-1.5" style={{ paddingBottom: 32 }}>
      <SectionBlock
        sectionId="cfg-schema"
        title={filePath.split("/").pop() ?? "config"}
        color={CONFIG_COLOR}
        readOnly
      >
        <div className="pc">
          <pre className="sh-code whitespace-pre-wrap" style={{ lineHeight: 1.45, margin: 0 }}>
            <code>{formatted}</code>
          </pre>
        </div>
      </SectionBlock>
    </div>
  )
}
