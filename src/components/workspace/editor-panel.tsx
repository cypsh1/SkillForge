import {
  useCallback,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react"
import {
  ExternalLink,
  FileText,
  KeyRound,
  Layers,
  Link2,
  Pencil,
  Settings,
  ShieldCheck,
  Terminal,
} from "lucide-react"
import { SourcesEditor } from "@/components/config-editor/sources-editor"
import { TopicsEditor } from "@/components/config-editor/topics-editor"
import { SchemaViewer } from "@/components/config-editor/schema-viewer"
import { EmptyState } from "@/components/empty-state"
import { FrontmatterForm } from "@/components/skill-editor/frontmatter-form"
import { ValidationPanel } from "@/components/skill-editor/validation-panel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { usePanelSyncApi } from "@/hooks/use-panel-sync"
import { useWorkspace } from "@/hooks/use-workspace"
import { BRIDGE_SECTIONS } from "@/lib/bridge-sections"
import { getRelationCountSummary } from "@/lib/bridge-relations"
import { cn } from "@/lib/utils"
import { validateSkill } from "@/lib/skill-validator"
import type { NavigatorSelection } from "@/types/workspace"
import type { ParsedSkill, SkillFrontmatter, SkillTool } from "@/types/skill"

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
    default:
      return FileText
  }
}

function headerSegment(sel: NavigatorSelection): string {
  switch (sel.nodeType) {
    case "skill-overview":
      return "概览"
    case "skill-md":
      return "SKILL.md"
    case "config-file":
      return sel.filePath ?? "配置"
    default:
      return ""
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

function scriptEidFromSectionTitle(title: string): string | null {
  const m = title.match(/([\w-]+(?:\.py)?)/i)
  if (!m) return null
  return m[1].replace(/\.py$/i, "")
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

function BridgeSectionBlock({
  sectionId,
  title,
  color,
  badge,
  readOnly,
  defaultCollapsed,
  dimmed,
  children,
}: {
  sectionId: string
  title: string
  color: string
  badge?: string
  readOnly?: boolean
  defaultCollapsed?: boolean
  dimmed?: boolean
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false)
  const api = usePanelSyncApi()
  return (
    <div
      data-bridge-section={sectionId}
      className={cn(
        collapsed && "bridge-section-collapsed",
        readOnly && "bridge-section-readonly",
        dimmed && "bridge-dim",
      )}
    >
      <div
        className="bridge-section-header"
        onClick={() => api?.scrollBothToSection(sectionId)}
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
        <span className="text-xs font-semibold">{title}</span>
        {badge && (
          <span className="bridge-badge">
            {badge}
          </span>
        )}
        {readOnly && (
          <span className="text-[9px] px-[5px] py-px rounded-lg inline-flex items-center gap-[3px]" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted-foreground)' }}>
            🔒 只读
          </span>
        )}
      </div>
      <div className="bridge-section-content">{children}</div>
    </div>
  )
}

function ToolsBlock({ tools }: { tools: SkillTool[] }) {
  if (tools.length === 0) {
    return <p className="text-sm text-muted-foreground">未定义工具</p>
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

function SectionsTree({ skill }: { skill: ParsedSkill }) {
  if (skill.sections.length === 0) {
    return <p className="text-sm text-muted-foreground">无章节</p>
  }
  return (
    <div>
      {skill.sections.map((section, i) => {
        const fieldKey = `f-d-${section.title.slice(0, 8).replace(/\s+/g, '-').toLowerCase()}`
        return (
          <div
            key={i}
            className="di"
            data-field={fieldKey}
            style={{ paddingLeft: section.level > 1 ? `${(section.level - 1) * 12}px` : undefined }}
          >
            <span className="dh">{"#".repeat(section.level)}</span>
            <span>{section.title}</span>
          </div>
        )
      })}
    </div>
  )
}

function BasicInfoDisplay({
  fm,
  onEdit,
}: {
  fm: SkillFrontmatter
  onEdit: () => void
}) {
  const rows: { label: string; value: string; field: string; isLink?: boolean }[] = [
    { label: "名称", value: fm.name || "—", field: "f-name" },
    { label: "描述", value: fm.description || "—", field: "f-desc" },
    { label: "版本", value: fm.version || "—", field: "f-ver" },
    { label: "主页", value: fm.homepage || "—", field: "f-home", isLink: !!fm.homepage },
  ]
  return (
    <div className="ecard">
      {rows.map((r) => (
        <div
          key={r.field}
          className="fr"
          data-field={r.field}
        >
          <span className="fl">{r.label}</span>
          {r.isLink ? (
            <a
              href={r.value}
              target="_blank"
              rel="noreferrer"
              className="fv text-blue-400 hover:underline"
            >
              {r.value}
            </a>
          ) : (
            <span className="fv">{r.value}</span>
          )}
        </div>
      ))}
      <div className="flex justify-end pt-1.5">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/50 transition-colors"
          onClick={onEdit}
        >
          <Pencil className="size-3" />
          编辑全部字段
        </button>
      </div>
    </div>
  )
}

function SkillMdPanel({
  skill,
  fm,
  onChange,
}: {
  skill: ParsedSkill
  fm: SkillFrontmatter
  onChange: (updated: SkillFrontmatter) => void
}) {
  const api = usePanelSyncApi()
  const [editingBasic, setEditingBasic] = useState(false)
  const execSections = useMemo(
    () =>
      skill.sections.filter((s) =>
        /脚本|script|pipeline/i.test(s.title),
      ),
    [skill.sections],
  )

  const readList = normalizeFileList(fm.files?.read)
  const writeList = normalizeFileList(fm.files?.write)
  const envRows = fm.env ?? []

  return (
    <div>
      <BridgeSectionBlock
        sectionId="basic"
        title="基本信息"
        color={bridgeColor("basic")}
        dimmed={api?.isSectionDimmed("basic")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → name, description, version, homepage
        </p>
        {editingBasic ? (
          <div className="space-y-2">
            <FrontmatterForm frontmatter={fm} skillId={skill.id} onChange={onChange} />
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setEditingBasic(false)}
              >
                收起编辑
              </button>
            </div>
          </div>
        ) : (
          <BasicInfoDisplay fm={fm} onEdit={() => setEditingBasic(true)} />
        )}
      </BridgeSectionBlock>

      <BridgeSectionBlock
        sectionId="meta"
        title="元数据"
        color={bridgeColor("meta")}
        readOnly
        dimmed={api?.isSectionDimmed("meta")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → metadata.openclaw
        </p>
        <MetaOpenclawView fm={fm} />
      </BridgeSectionBlock>

      <BridgeSectionBlock
        sectionId="env"
        title="环境变量"
        color={bridgeColor("env")}
        badge={`${fm.env?.length ?? 0}`}
        dimmed={api?.isSectionDimmed("env")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → env[]
        </p>
        {envRows.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-3">无环境变量</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="et w-full">
              <thead>
                <tr>
                  <th>变量名</th>
                  <th>必需</th>
                  <th>描述</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {envRows.map((row, i) => {
                  const fieldKey = `f-e-${row.name}`
                  return (
                  <tr
                    key={i}
                    data-field={fieldKey}
                  >
                    <td>
                      <span className="en font-mono text-[10px] font-semibold">
                        <EidText eid={row.name} fieldKey={fieldKey}>
                          {row.name}
                        </EidText>
                      </span>
                    </td>
                    <td>{row.required ? "必需" : "可选"}</td>
                    <td className="ed">{row.description ?? "—"}</td>
                    <td className="rc">
                      <RelationIndicator eid={row.name} fieldKey={fieldKey} />
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </BridgeSectionBlock>

      <BridgeSectionBlock
        sectionId="tools"
        title="工具"
        color={bridgeColor("tools")}
        badge={`${skill.tools.length}`}
        dimmed={api?.isSectionDimmed("tools")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → tools[]
        </p>
        <ToolsBlock tools={skill.tools} />
      </BridgeSectionBlock>

      <BridgeSectionBlock
        sectionId="files"
        title="文件权限"
        color={bridgeColor("files")}
        dimmed={api?.isSectionDimmed("files")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          frontmatter → files {"{ read[], write[] }"}
        </p>
        <div className="ecard">
          <div className="text-[10px] text-muted-foreground mb-0.5">📖 读取</div>
          <div className="text-[10px] font-mono leading-[1.6] pl-1.5" data-field="f-fr">
            {readList.length === 0 ? (
              <span className="text-muted-foreground">无</span>
            ) : (
              readList.map((p, i) => {
                const fileEid = pathToFileEid(p)
                const fieldKey = fileEid ? `f-p-${fileEid}` : `f-p-${p}`
                return (
                  <span key={i}>
                    {i > 0 && <br />}
                    <span
                      data-field={fieldKey}
                    >
                      {fileEid ? (
                        <EidText eid={fileEid} fieldKey={fieldKey}>{p}</EidText>
                      ) : (
                        p
                      )}
                    </span>
                  </span>
                )
              })
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5 mb-0.5">✏️ 写入</div>
          <div className="text-[10px] font-mono leading-[1.6] pl-1.5" data-field="f-fw">
            {writeList.length === 0 ? (
              <span className="text-muted-foreground">无</span>
            ) : (
              writeList.map((p, i) => {
                const fileEid = pathToFileEid(p)
                const fieldKey = fileEid ? `f-p-${fileEid}` : `f-p-${p}`
                return (
                  <span key={i}>
                    {i > 0 && <br />}
                    <span
                      data-field={fieldKey}
                    >
                      {fileEid ? (
                        <EidText eid={fileEid} fieldKey={fieldKey}>{p}</EidText>
                      ) : (
                        p
                      )}
                    </span>
                  </span>
                )
              })
            )}
          </div>
        </div>
      </BridgeSectionBlock>

      <BridgeSectionBlock
        sectionId="exec"
        title="脚本管道"
        color={bridgeColor("exec")}
        badge="执行层"
        dimmed={api?.isSectionDimmed("exec")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          markdown body → 脚本相关章节
        </p>
        {execSections.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-1">无脚本管道章节</p>
        ) : (
          <div className="ecard" style={{ padding: '6px 8px' }}>
            {execSections.map((s, i) => {
              const scriptEid = scriptEidFromSectionTitle(s.title)
              const fieldKey = scriptEid ? `f-x-${scriptEid}` : undefined
              const isRoot = s.level <= 2
              return (
                <div
                  key={i}
                  className={cn("pi", !isRoot && "pi-indent")}
                  data-field={fieldKey}
                >
                  {!isRoot && <span>→</span>}
                  <span className={cn(isRoot && "text-xs font-semibold")}>
                    {scriptEid ? (
                      <EidText eid={scriptEid} fieldKey={fieldKey}>
                        {s.title}
                      </EidText>
                    ) : (
                      s.title
                    )}
                  </span>
                  {scriptEid ? (
                    <span className="ml-auto">
                      <RelationIndicator eid={scriptEid} fieldKey={fieldKey} />
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </BridgeSectionBlock>

      <BridgeSectionBlock
        sectionId="doc"
        title="文档结构"
        color={bridgeColor("doc")}
        badge={`${skill.sections.length} 节`}
        dimmed={api?.isSectionDimmed("doc")}
      >
        <p className="text-[9px] text-dim font-mono pl-3 mb-1.5">
          markdown body → headings
        </p>
        <SectionsTree skill={skill} />
      </BridgeSectionBlock>
    </div>
  )
}

type OpenclawFrontmatterSlice = {
  requires?: { bins?: string[] }
  optionalBins?: string[]
}

function openclawMetadataFromFm(fm: SkillFrontmatter): OpenclawFrontmatterSlice | null {
  const raw = fm.metadata?.openclaw
  if (typeof raw !== "object" || raw === null) return null
  return raw as OpenclawFrontmatterSlice
}

function MetaOpenclawView({ fm }: { fm: SkillFrontmatter }) {
  const oc = openclawMetadataFromFm(fm)
  if (!oc) {
    return <p className="text-sm text-muted-foreground pl-1">无元数据</p>
  }
  const bins = oc.requires?.bins ?? []
  const optionalBins = oc.optionalBins ?? []
  const hasAny = bins.length > 0 || optionalBins.length > 0
  if (!hasAny) {
    return <p className="text-sm text-muted-foreground pl-1">无元数据</p>
  }
  return (
    <div className="ecard">
      {bins.length > 0 && (
        <>
          <div className="text-[10px] text-muted-foreground mb-1">必需依赖</div>
          <div className="text-[10px] font-mono pl-1.5 leading-[1.6]">
            {bins.map((b: string, i: number) => (
              <span key={i}>
                {i > 0 && <br />}
                <EidText eid={b}>{b}</EidText>
              </span>
            ))}
          </div>
        </>
      )}
      {optionalBins.length > 0 && (
        <>
          <div className="text-[10px] text-muted-foreground mt-1.5 mb-1">可选依赖</div>
          <div className="text-[10px] font-mono pl-1.5 leading-[1.6] text-muted-foreground">
            {optionalBins.map((b: string, i: number) => (
              <span key={i}>
                {i > 0 && " · "}
                <EidText eid={b}>{b}</EidText>
              </span>
            ))}
          </div>
        </>
      )}
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
  const { state } = useWorkspace()
  const selection = state.selection

  const configCount = Object.keys(skill.configFiles).length
  const skillId = skill.id

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <CardTitle className="text-2xl font-bold font-mono tracking-tight break-words">
                {fm.name || "—"}
              </CardTitle>
              <p className="text-muted-foreground max-w-2xl text-sm">
                {skill.description || fm.description || "—"}
              </p>
            </div>
            {fm.version ? (
              <Badge variant="secondary" className="text-sm shrink-0">
                v{fm.version}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-1.5">
            {skill.path ? (
              <span className="flex items-center gap-1 min-w-0">
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <code className="text-xs truncate">{skill.path}</code>
              </span>
            ) : null}
            {fm.homepage ? (
              <a
                href={fm.homepage}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                主页
              </a>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 pt-1.5">
            <Badge variant="outline">
              <Terminal className="mr-1 h-3 w-3" />
              {skill.tools.length} 个工具
            </Badge>
            <Badge variant="outline">
              <KeyRound className="mr-1 h-3 w-3" />
              {skill.envVars.length} 个环境变量
            </Badge>
            {configCount > 0 ? (
              <Badge variant="outline">
                <Pencil className="mr-1 h-3 w-3" />
                {configCount} 个配置文件
              </Badge>
            ) : null}
            <Badge variant="outline">{skill.sections.length} 个文档章节</Badge>
          </div>
        </CardHeader>
      </Card>

      <section className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          文件信息
        </h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">路径</dt>
            <dd className="truncate font-mono">{skill.path || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">版本</dt>
            <dd>{fm.version ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">文件数</dt>
            <dd>{1 + configPaths.length}</dd>
          </div>
        </dl>
      </section>

      <Separator />

      <section className="space-y-2">
        <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Link2 className="size-3.5" aria-hidden />
          关联文件
        </h3>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-left text-sm text-primary underline-offset-4 hover:underline"
              onClick={() => onSelect({ skillId, nodeType: "skill-md" })}
            >
              <FileText className="size-3.5 shrink-0" aria-hidden />
              SKILL.md
              {selection?.nodeType === "skill-md" && selection.skillId === skillId && (
                <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
              )}
            </button>
          </li>
          {configPaths.map((path) => (
            <li key={path}>
              <button
                type="button"
                className="inline-flex max-w-full items-center gap-1 truncate text-left text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => onSelect({ skillId, nodeType: "config-file", filePath: path })}
              >
                <FileText className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{path}</span>
                {selection?.nodeType === "config-file" &&
                  selection.skillId === skillId &&
                  selection.filePath === path && (
                    <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
                  )}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {validationResult && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5" />
            配置验证
          </h3>
          <ValidationPanel result={validationResult} />
        </div>
      )}
    </div>
  )
}

export function EditorPanel() {
  const api = usePanelSyncApi()
  const { state, selectedSkill, editState, updateFrontmatter, updateConfig, select } = useWorkspace()

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
  const segment = selection ? headerSegment(selection) : ""

  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 overflow-hidden">
      <div className="flex shrink-0 items-center gap-1.5 border-b px-3.5 h-[34px] min-h-[34px] text-xs text-muted-foreground">
        <HeaderIcon className="size-3 shrink-0" aria-hidden />
        <strong className="text-foreground">可视化编辑</strong>
        <span className="text-[10px] truncate" style={{ color: 'var(--muted-foreground)' }}>
          {titleName || "—"}{segment ? ` / ${segment}` : ""}
        </span>
      </div>

      <div
        ref={api?.editorRef}
        className="flex-1 min-h-0 overflow-y-auto thin-scroll"
        onClick={api ? handleEditorClick : undefined}
      >
        <div className="min-h-full p-2 pr-1.5">
          {!selection ? (
            <EmptyState title="从左侧导航选择一个 Skill 或文件" />
          ) : !selectedSkill || !editState ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Skill 未找到或数据未就绪
              </CardContent>
            </Card>
          ) : selection.nodeType === "skill-overview" ? (
            <SkillOverviewPanel
              skill={selectedSkill}
              fm={editState.frontmatter}
              validationResult={validationResult}
              configPaths={configPaths}
              onSelect={select}
            />
          ) : selection.nodeType === "skill-md" ? (
            <SkillMdPanel
              skill={selectedSkill}
              fm={editState.frontmatter}
              onChange={(updated) => updateFrontmatter(selectedSkill.id, updated)}
            />
          ) : selection.nodeType === "config-file" ? (
            <ConfigFileEditor
              selection={selection}
              skill={selectedSkill}
              editState={editState}
              updateConfig={updateConfig}
            />
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
  const filePath = selection.filePath
  if (!filePath) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          未指定配置文件路径
        </CardContent>
      </Card>
    )
  }

  const raw = editState.configFiles[filePath]
  if (raw === undefined) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          未找到「{filePath}」的配置数据
        </CardContent>
      </Card>
    )
  }

  const kind = configEditorKind(filePath)
  if (!kind) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          暂不支持编辑「{filePath}」
        </CardContent>
      </Card>
    )
  }

  if (kind === "sources") {
    if (!isSourcesConfig(raw)) {
      return (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            sources.json 格式无效，缺少 sources 数组
          </CardContent>
        </Card>
      )
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
      return (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            topics.json 格式无效，缺少 topics 数组
          </CardContent>
        </Card>
      )
    }
    return (
      <TopicsEditor
        data={raw as Parameters<typeof TopicsEditor>[0]["data"]}
        onChange={(newData) => updateConfig(skill.id, filePath, newData)}
      />
    )
  }

  if (!isSchemaRecord(raw)) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          schema.json 应为 JSON 对象
        </CardContent>
      </Card>
    )
  }

  return <SchemaViewer schema={raw} />
}
