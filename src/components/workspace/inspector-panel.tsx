import { useCallback, useMemo, useState, type MouseEvent } from "react"
import { Download, FileText, Save } from "lucide-react"

import { ExportButton } from "@/components/config-editor/export-button"
import { JsonPreview } from "@/components/config-editor/json-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import { useWorkspace } from "@/hooks/use-workspace"
import { downloadFile } from "@/lib/download"
import { getRelationCountSummary } from "@/lib/bridge-relations"
import { BRIDGE_SECTIONS, SECTION_MAP } from "@/lib/bridge-sections"
import { serializeSkillMd } from "@/lib/skill-serializer"
import { isTauri, saveSkillFile, saveSkillConfig } from "@/lib/tauri-fs"
import { cn } from "@/lib/utils"
import type { ParsedSkill, SkillFrontmatter } from "@/types/skill"

interface PreviewParts {
  basic: string
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

function splitPreviewInto7(content: string): PreviewParts {
  const { fmInner, body } = extractFmInnerAndBody(content)
  const blocks = parseTopLevelYamlBlocks(fmInner)
  const basicKeys = ["name", "description", "version", "homepage"] as const
  const basicLines = basicKeys
    .map((k) => blocks.get(k) ?? "")
    .filter((s) => s.length > 0)
  const basic = basicLines.length > 0 ? ["---", ...basicLines].join("\n") : ""
  const meta = blocks.get("metadata") ?? ""
  const env = blocks.get("env") ?? ""
  const tools = blocks.get("tools") ?? ""
  const files = blocks.get("files") ?? ""
  const { exec, doc } = splitBodyExecDoc(body)
  return { basic, meta, env, tools, files, exec, doc }
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
}

function wrapBasicFieldLines(html: string): string {
  return html.replace(
    /(<span class="syntax-key">(name|description|version|homepage)<\/span>.*?)(?=\n|$)/g,
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
    basic: [], meta: [], env: [], tools: [], files: [], exec: [], doc: [],
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

  return { basic: [], meta: [], env, tools, files, exec, doc: [] }
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
}: {
  sectionId: string
  title: string
  color: string
  html: string
  badge?: string
  dimmed?: boolean
}) {
  const [open, setOpen] = useState(true)
  const api = usePanelSyncApi()
  return (
    <div
      data-bridge-section={sectionId}
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
        <div
          className="pc"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}

function SectionedPreview({
  content,
  skill,
  fm,
  selectedEid,
  relatedEids,
  isSectionDimmed,
}: {
  content: string
  skill: ParsedSkill | null
  fm: SkillFrontmatter | null
  selectedEid: string | null
  relatedEids: string[]
  isSectionDimmed: (sectionId: string) => boolean
}) {
  const parts = useMemo(() => splitPreviewInto7(content), [content])
  const entityRules = useMemo(() => buildInspectorEntityRules(skill, fm), [skill, fm])
  return (
    <div className="p-2 pl-1.5">
      {BRIDGE_SECTIONS.map((def) => {
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
        if (def.id === "meta") badge = "只读"
        else if (def.id === "env" && skill) badge = `${skill.frontmatter.env?.length ?? 0}`
        else if (def.id === "tools" && skill) badge = `${skill.tools.length}`

        return (
          <PreviewSectionBlock
            key={def.id}
            sectionId={def.id}
            title={SECTION_MAP[def.id]?.name ?? def.id}
            color={def.color}
            dimmed={isSectionDimmed(def.id)}
            badge={badge}
            html={html}
          />
        )
      })}
    </div>
  )
}

export function InspectorPanel() {
  const api = usePanelSyncApi()
  const { state, selectedSkill, editState } = useWorkspace()
  const selection = state.selection
  const selectedEid = api?.selectedEid ?? null
  const relatedEids = api?.relatedEids ?? []

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

  const markdownBody = useMemo(() => {
    if (!selectedSkill) return ""
    const bodyStart = selectedSkill.rawContent.indexOf("---", 3)
    if (bodyStart === -1) return selectedSkill.rawContent
    return selectedSkill.rawContent.slice(bodyStart + 3).trimStart()
  }, [selectedSkill])

  const skillMdPreview = useMemo(() => {
    if (!editState) return ""
    return serializeSkillMd(editState.frontmatter, markdownBody)
  }, [editState, markdownBody])

  const selectedConfigData = useMemo(() => {
    if (!selection || selection.nodeType !== "config-file" || !selection.filePath || !editState) {
      return undefined
    }
    return editState.configFiles[selection.filePath]
  }, [selection, editState])

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const exportSkillMd = () => {
    downloadFile("SKILL.md", skillMdPreview, "text/markdown;charset=utf-8")
  }

  const handleSaveAll = useCallback(async () => {
    if (!selectedSkill || !editState?.dirty) return
    setSaving(true)
    setSaveMsg(null)
    try {
      await saveSkillFile(selectedSkill.path, "SKILL.md", skillMdPreview)
      for (const [path, data] of Object.entries(editState.configFiles)) {
        await saveSkillConfig(selectedSkill.path, path, data)
      }
      setSaveMsg("已保存")
      setTimeout(() => setSaveMsg(null), 2000)
    } catch (err) {
      setSaveMsg(`保存失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }, [selectedSkill, editState, skillMdPreview])

  const showSkillMdChrome = selection?.nodeType === "skill-md"
  const showConfigChrome = selection?.nodeType === "config-file" && Boolean(selection.filePath)
  const showEmptyHint =
    selection &&
    selection.nodeType !== "skill-md" &&
    selection.nodeType !== "config-file"

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l bg-background">
      <div className="flex shrink-0 items-center justify-between gap-1.5 border-b px-3.5 h-[34px] min-h-[34px] text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-1.5">
          <FileText className="size-3 shrink-0" aria-hidden />
          <strong className="text-foreground">源码预览</strong>
          {showSkillMdChrome && (
            <span className="text-[10px] truncate" style={{ marginLeft: 'auto' }}>SKILL.md</span>
          )}
          {showConfigChrome && selection.filePath && (
            <span className="text-[10px] truncate">{selection.filePath.split("/").pop()}</span>
          )}
          {editState?.dirty && (
            <Badge
              variant="outline"
              className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              已修改
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showSkillMdChrome && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-5 gap-1 px-2 text-[11px]"
              onClick={exportSkillMd}
            >
              <Download className="size-3" />
              导出
            </Button>
          )}
          {showConfigChrome && selectedConfigData !== undefined && selection.filePath && (
            <ExportButton
              filename={selection.filePath.split("/").pop() ?? "config.json"}
              data={selectedConfigData}
            />
          )}
          {isTauri() && editState?.dirty && (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              disabled={saving}
              onClick={handleSaveAll}
            >
              <Save className="size-3.5" />
              {saving ? "保存中…" : "保存"}
            </Button>
          )}
          {saveMsg && (
            <span className="text-xs text-muted-foreground">{saveMsg}</span>
          )}
        </div>
      </div>

      {!selectedSkill || !editState ? (
        <div className="p-3 text-sm">
          {!selection && <p className="text-muted-foreground">选择一个节点以查看详情</p>}
          {selection && !selectedSkill && <p className="text-muted-foreground">无法加载 Skill</p>}
        </div>
      ) : (
        <>
          <div
            ref={api?.inspectorRef}
            className="min-h-0 flex-1 overflow-y-auto thin-scroll"
            onClick={api ? handleInspectorClick : undefined}
          >
            {selection?.nodeType === "skill-md" && (
              <SectionedPreview
                content={skillMdPreview}
                skill={selectedSkill}
                fm={editState?.frontmatter ?? null}
                selectedEid={selectedEid}
                relatedEids={relatedEids}
                isSectionDimmed={(sectionId) => api?.isSectionDimmed(sectionId) ?? false}
              />
            )}

            {selection?.nodeType === "config-file" && selection.filePath && (
              <div className="flex min-h-0 flex-col gap-1.5 p-2">
                <p className="shrink-0 truncate text-xs text-muted-foreground">{selection.filePath}</p>
                {selectedConfigData !== undefined ? (
                  <JsonPreview data={selectedConfigData} className="h-auto min-h-[200px]" />
                ) : (
                  <p className="text-sm text-muted-foreground">无此文件数据</p>
                )}
              </div>
            )}

            {showEmptyHint && (
              <div className="p-4 text-sm text-muted-foreground">
                在左侧选择「SKILL.md」或配置文件以查看源码或 JSON 预览。
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
