import { useState, useRef, useEffect, useCallback } from "react"
import {
  Check,
  ChevronRight,
  FileJson,
  FileText,
  KeyRound,
  MousePointerClick,
  Pencil,
  Terminal,
  Workflow,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

// ─── Graph: relationships between skill components ───────────────────────────

interface EnvNode {
  id: string
  name: string
  required: boolean
  desc: string
  usedBy: string[]   // tool IDs
}

interface ConfigNode {
  id: string
  name: string
  usedBy: string[]   // tool IDs
}

interface ToolNode {
  id: string
  name: string
  desc: string
  needsEnv: string[]     // env IDs
  readsConfig: string[]  // config IDs
  docSection: string     // markdown section heading
}

const ENV_VARS: EnvNode[] = [
  { id: "env_twitter", name: "TWITTER_BEARER_TOKEN", required: true,  desc: "Twitter API Bearer Token",  usedBy: ["tool_fetch"] },
  { id: "env_openai",  name: "OPENAI_API_KEY",        required: true,  desc: "OpenAI API 密钥",           usedBy: ["tool_score"] },
  { id: "env_discord", name: "DISCORD_WEBHOOK_URL",   required: false, desc: "Discord 通知 Webhook URL",  usedBy: [] },
]

const CONFIG_FILES: ConfigNode[] = [
  { id: "cfg_sources", name: "sources.json", usedBy: ["tool_fetch"] },
  { id: "cfg_topics",  name: "topics.json",  usedBy: ["tool_fetch"] },
]

const TOOLS: ToolNode[] = [
  {
    id: "tool_fetch",
    name: "fetch_tech_news",
    desc: "从多数据源抓取科技新闻",
    needsEnv:    ["env_twitter"],
    readsConfig: ["cfg_sources", "cfg_topics"],
    docSection:  "fetch_tech_news",
  },
  {
    id: "tool_score",
    name: "score_quality",
    desc: "使用 AI 评估新闻质量分数",
    needsEnv:    ["env_openai"],
    readsConfig: [],
    docSection:  "score_quality",
  },
]

// ─── Relationship helpers ─────────────────────────────────────────────────────

function getRelated(nodeId: string): Set<string> {
  const s = new Set<string>([nodeId])
  ENV_VARS.forEach((e) => { if (e.id === nodeId) e.usedBy.forEach((t) => s.add(t)) })
  CONFIG_FILES.forEach((c) => { if (c.id === nodeId) c.usedBy.forEach((t) => s.add(t)) })
  TOOLS.forEach((t) => {
    if (t.id === nodeId) {
      t.needsEnv.forEach((e) => s.add(e))
      t.readsConfig.forEach((c) => s.add(c))
    }
  })
  return s
}

function nodeDimStyle(hoveredNode: string | null, nodeId: string) {
  if (!hoveredNode) return ""
  return getRelated(hoveredNode).has(nodeId) ? "ring-1 ring-primary/50 opacity-100" : "opacity-25"
}

// ─── Architecture Card (Direction B) ─────────────────────────────────────────

function ArchitectureCard({
  hoveredNode,
  onHover,
}: {
  hoveredNode: string | null
  onHover: (id: string | null) => void
}) {
  function NodeChip({
    nodeId,
    label,
    icon: Icon,
    variant = "outline",
  }: {
    nodeId: string
    label: string
    icon: React.ElementType
    variant?: "env" | "config" | "tool" | "outline"
  }) {
    const variantCls = {
      env:    "bg-amber-500/10  border-amber-400/50  text-amber-700  dark:text-amber-300",
      config: "bg-sky-500/10    border-sky-400/50    text-sky-700    dark:text-sky-300",
      tool:   "bg-purple-500/10 border-purple-400/50 text-purple-700 dark:text-purple-300",
      outline: "",
    }[variant]

    return (
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono",
          "cursor-default transition-all duration-150",
          variantCls,
          nodeDimStyle(hoveredNode, nodeId),
        )}
        onMouseEnter={() => onHover(nodeId)}
        onMouseLeave={() => onHover(null)}
      >
        <Icon className="size-3 shrink-0" />
        {label}
      </button>
    )
  }

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <Workflow className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">技能架构</span>
          <span className="text-xs text-muted-foreground ml-1">悬停节点查看关联关系</span>
        </div>

        <div className="flex items-start gap-3">

          {/* ── 输入列 ── */}
          <div className="flex-1 space-y-3 min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">输入</div>

            <div className="space-y-1.5">
              <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                <KeyRound className="size-2.5" /> 环境变量
              </div>
              <div className="flex flex-col gap-1.5">
                {ENV_VARS.map((e) => (
                  <NodeChip key={e.id} nodeId={e.id} label={e.name} icon={KeyRound} variant="env" />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                <FileJson className="size-2.5" /> 配置文件
              </div>
              <div className="flex flex-col gap-1.5">
                {CONFIG_FILES.map((c) => (
                  <NodeChip key={c.id} nodeId={c.id} label={c.name} icon={FileJson} variant="config" />
                ))}
              </div>
            </div>
          </div>

          {/* ── 箭头 ── */}
          <div className="flex items-center self-center pt-4">
            <ChevronRight className="size-5 text-muted-foreground/40" />
          </div>

          {/* ── 工具列 ── */}
          <div className="flex-1 space-y-3 min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">工具</div>
            <div className="flex flex-col gap-1.5">
              {TOOLS.map((t) => (
                <NodeChip key={t.id} nodeId={t.id} label={t.name} icon={Terminal} variant="tool" />
              ))}
            </div>
          </div>

        </div>

        {/* ── Relationship legend ── */}
        {hoveredNode && (() => {
          const related = getRelated(hoveredNode)
          const names: string[] = []
          ENV_VARS.forEach((e) => { if (related.has(e.id) && e.id !== hoveredNode) names.push(e.name) })
          CONFIG_FILES.forEach((c) => { if (related.has(c.id) && c.id !== hoveredNode) names.push(c.name) })
          TOOLS.forEach((t) => { if (related.has(t.id) && t.id !== hoveredNode) names.push(t.name) })
          if (names.length === 0) return null
          return (
            <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground animate-in fade-in duration-150">
              <span className="text-foreground font-medium">
                {[...ENV_VARS, ...CONFIG_FILES, ...TOOLS].find((n) => n.id === hoveredNode)?.name}
              </span>
              {" "}关联：{names.join(" · ")}
            </div>
          )
        })()}
      </CardContent>
    </Card>
  )
}

// ─── Field ↔ Preview linking types ──────────────────────────────────────────

type FieldId = "name" | "description" | "version" | "homepage" | "source" | "env" | "tools" | "body"
type SectionCategory = "basic" | "env" | "tools" | "body"

interface PreviewSegment {
  fieldId: FieldId | null
  text: string
  category: SectionCategory | "delimiter"
}

const catStyles: Record<SectionCategory, {
  dot: string
  sectionBorder: string
  sectionActiveBorder: string
  sectionActiveBg: string
  segBorder: string
  segActiveBorder: string
  segActiveBg: string
  inputRing: string
}> = {
  basic: {
    dot: "bg-blue-400",
    sectionBorder: "border-l-blue-200 dark:border-l-blue-900/50",
    sectionActiveBorder: "border-l-blue-500",
    sectionActiveBg: "bg-blue-500/5",
    segBorder: "border-l-blue-300 dark:border-l-blue-700",
    segActiveBorder: "border-l-blue-500",
    segActiveBg: "bg-blue-500/10",
    inputRing: "ring-2 ring-blue-400/50 ring-offset-1",
  },
  env: {
    dot: "bg-amber-400",
    sectionBorder: "border-l-amber-200 dark:border-l-amber-900/50",
    sectionActiveBorder: "border-l-amber-500",
    sectionActiveBg: "bg-amber-500/5",
    segBorder: "border-l-amber-300 dark:border-l-amber-700",
    segActiveBorder: "border-l-amber-500",
    segActiveBg: "bg-amber-500/10",
    inputRing: "ring-2 ring-amber-400/50 ring-offset-1",
  },
  tools: {
    dot: "bg-purple-400",
    sectionBorder: "border-l-purple-200 dark:border-l-purple-900/50",
    sectionActiveBorder: "border-l-purple-500",
    sectionActiveBg: "bg-purple-500/5",
    segBorder: "border-l-purple-300 dark:border-l-purple-700",
    segActiveBorder: "border-l-purple-500",
    segActiveBg: "bg-purple-500/10",
    inputRing: "ring-2 ring-purple-400/50 ring-offset-1",
  },
  body: {
    dot: "bg-emerald-400",
    sectionBorder: "border-l-emerald-200 dark:border-l-emerald-900/50",
    sectionActiveBorder: "border-l-emerald-500",
    sectionActiveBg: "bg-emerald-500/5",
    segBorder: "border-l-emerald-300 dark:border-l-emerald-700",
    segActiveBorder: "border-l-emerald-500",
    segActiveBg: "bg-emerald-500/10",
    inputRing: "ring-2 ring-emerald-400/50 ring-offset-1",
  },
}

const FIELD_DOM_ID: Partial<Record<FieldId, string>> = {
  name: "df-name",
  description: "df-desc",
  version: "df-version",
  homepage: "df-homepage",
  source: "df-source",
  env: "df-env-section",
  tools: "df-tools-section",
  body: "df-body-section",
}

const SEGMENTS: PreviewSegment[] = [
  { fieldId: null, text: "---\n", category: "delimiter" },
  { fieldId: "name",        text: '"name": "tech-news-digest-cn"\n',   category: "basic" },
  { fieldId: "description", text: '"description": "生成科技新闻摘要，具有统一的数据源模型、质量评分\n  和多格式输出。六源数据收集包括 RSS 源、Twitter/X KOL。"\n', category: "basic" },
  { fieldId: "version",     text: '"version": "3.16.0"\n',              category: "basic" },
  { fieldId: "homepage",    text: '"homepage": "https://github.com/example/tech-news-digest-cn"\n', category: "basic" },
  { fieldId: "source",      text: '"source": "https://github.com/example/tech-news-digest-cn.git"\n', category: "basic" },
  {
    fieldId: "env",
    text: '"env":\n  - "name": "TWITTER_BEARER_TOKEN"\n    "required": true\n    "description": "Twitter API Bearer Token"\n  - "name": "OPENAI_API_KEY"\n    "required": true\n    "description": "OpenAI API 密钥"\n  - "name": "DISCORD_WEBHOOK_URL"\n    "required": false\n    "description": "Discord 通知 Webhook URL"\n',
    category: "env",
  },
  {
    fieldId: "tools",
    text: '"tools":\n  - "name": "fetch_tech_news"\n    "description": "从多数据源抓取科技新闻"\n  - "name": "score_quality"\n    "description": "使用 AI 评估新闻质量分数"\n',
    category: "tools",
  },
  { fieldId: null, text: "---\n", category: "delimiter" },
  {
    fieldId: "body",
    text: "# Overview\n\nA multi-source tech news aggregator...\n\n## Data Sources\n\n- RSS feeds\n- Twitter/X KOLs\n- GitHub releases\n\n## Tools\n\n### fetch_tech_news\n...\n\n### score_quality\n...\n",
    category: "body",
  },
]

const BASIC_FIELDS: FieldId[] = ["name", "description", "version", "homepage", "source"]

// ─── Section wrapper shared component ────────────────────────────────────────

function Section({
  id,
  category,
  isActive,
  children,
}: {
  id?: string
  category: SectionCategory
  isActive: boolean
  children: React.ReactNode
}) {
  const s = catStyles[category]
  return (
    <section
      id={id}
      className={cn(
        "border-l-2 pl-4 transition-all duration-200",
        isActive
          ? cn(s.sectionActiveBorder, s.sectionActiveBg, "-ml-4 px-4 py-2 rounded-r-md")
          : s.sectionBorder,
      )}
    >
      {children}
    </section>
  )
}

// ─── Cross-reference chip (Direction A) ──────────────────────────────────────

function RefChip({
  icon: Icon,
  label,
  nodeId,
  hoveredNode,
  onHover,
  onClick,
  colorClass = "text-muted-foreground hover:text-foreground",
}: {
  icon: React.ElementType
  label: string
  nodeId: string
  hoveredNode: string | null
  onHover: (id: string | null) => void
  onClick?: () => void
  colorClass?: string
}) {
  const isHighlighted = hoveredNode ? getRelated(hoveredNode).has(nodeId) : false
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-mono",
        "transition-all duration-150",
        colorClass,
        isHighlighted && "border-primary/40 bg-primary/5 text-primary",
        !isHighlighted && hoveredNode && !getRelated(hoveredNode).has(nodeId) && "opacity-30",
      )}
      onMouseEnter={() => onHover(nodeId)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      <Icon className="size-2.5 shrink-0" />
      {label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DemoLinkingPage() {
  const [linkedField, setLinkedField]   = useState<FieldId | null>(null)
  const [hoveredNode,  setHoveredNode]  = useState<string | null>(null)
  const [isEditing,    setIsEditing]    = useState(false)

  const segmentRefs = useRef<Map<FieldId, HTMLSpanElement>>(new Map())
  const blurTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Field focus handlers ──────────────────────────────────────────────────
  const handleFocus = useCallback((id: FieldId) => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setLinkedField(id)
  }, [])

  const handleBlur = useCallback(() => {
    blurTimer.current = setTimeout(() => setLinkedField(null), 200)
  }, [])

  const handleSegmentClick = useCallback((id: FieldId | null, isReadonly: boolean) => {
    if (!id) return
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setLinkedField(id)
    if (!isReadonly) setIsEditing(true)
    const domId = FIELD_DOM_ID[id]
    if (domId) {
      setTimeout(() => {
        const el = document.getElementById(domId)
        if (!el) return
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        if (!isReadonly && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
          el.focus()
        }
      }, 60)
    }
  }, [])

  // Scroll preview when linked field changes
  useEffect(() => {
    if (!linkedField) return
    const el = segmentRefs.current.get(linkedField)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [linkedField])

  const isBasicActive = linkedField !== null && BASIC_FIELDS.includes(linkedField)

  // ── Helper: scroll to section ─────────────────────────────────────────────
  function scrollTo(domId: string) {
    document.getElementById(domId)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div className="flex flex-col h-svh bg-background">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">tech-news-digest-cn / SKILL.md</span>
          <Badge variant="outline" className="text-[10px] shrink-0">Demo</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden md:block">聚焦字段 · 点击预览行 · 悬停节点</span>
          <Button size="sm" variant={isEditing ? "default" : "outline"} onClick={() => setIsEditing((v) => !v)}>
            {isEditing ? <Check className="mr-1.5 size-3.5" /> : <Pencil className="mr-1.5 size-3.5" />}
            {isEditing ? "完成" : "编辑"}
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ──────────── Form Editor (left) ──────────── */}
        <ScrollArea className="flex-1 min-w-0 border-r">
          <div className="p-6 space-y-6 max-w-lg mx-auto">

            {/* Direction B: Architecture Card */}
            <ArchitectureCard hoveredNode={hoveredNode} onHover={setHoveredNode} />

            <Separator />

            {/* 基本信息 */}
            <Section category="basic" isActive={isBasicActive}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-1.5 h-4 rounded-full transition-colors", isBasicActive ? catStyles.basic.dot : "bg-blue-200 dark:bg-blue-900")} />
                <h3 className="text-sm font-semibold">基本信息</h3>
                <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">frontmatter</span>
              </div>
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="df-name" className="text-xs text-muted-foreground">名称</Label>
                    <Input id="df-name" defaultValue="tech-news-digest-cn" readOnly={!isEditing}
                      className={cn("h-8 text-sm font-mono transition-shadow", linkedField === "name" && catStyles.basic.inputRing)}
                      onFocus={() => handleFocus("name")} onBlur={handleBlur} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="df-desc" className="text-xs text-muted-foreground">描述</Label>
                    <Textarea id="df-desc" readOnly={!isEditing} rows={3}
                      defaultValue="生成科技新闻摘要，具有统一的数据源模型、质量评分和多格式输出。六源数据收集包括 RSS 源、Twitter/X KOL。"
                      className={cn("text-sm resize-y min-h-[4.5rem] transition-shadow", linkedField === "description" && catStyles.basic.inputRing)}
                      onFocus={() => handleFocus("description")} onBlur={handleBlur} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="df-version" className="text-xs text-muted-foreground">版本</Label>
                      <Input id="df-version" defaultValue="3.16.0" readOnly={!isEditing}
                        className={cn("h-8 text-sm transition-shadow", linkedField === "version" && catStyles.basic.inputRing)}
                        onFocus={() => handleFocus("version")} onBlur={handleBlur} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="df-homepage" className="text-xs text-muted-foreground">主页</Label>
                      <Input id="df-homepage" defaultValue="https://github.com/example" readOnly={!isEditing}
                        className={cn("h-8 text-sm transition-shadow", linkedField === "homepage" && catStyles.basic.inputRing)}
                        onFocus={() => handleFocus("homepage")} onBlur={handleBlur} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="df-source" className="text-xs text-muted-foreground">源码</Label>
                    <Input id="df-source" defaultValue="https://github.com/example/repo.git" readOnly={!isEditing}
                      className={cn("h-8 text-sm transition-shadow", linkedField === "source" && catStyles.basic.inputRing)}
                      onFocus={() => handleFocus("source")} onBlur={handleBlur} />
                  </div>
                </CardContent>
              </Card>
            </Section>

            <Separator />

            {/* Direction A + C: 环境变量，带跨引用注解 */}
            <Section id="df-env-section" category="env" isActive={linkedField === "env"}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-1.5 h-4 rounded-full transition-colors", linkedField === "env" ? catStyles.env.dot : "bg-amber-200 dark:bg-amber-900")} />
                <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                  <KeyRound className="size-3.5" /> 环境变量
                </h3>
                <Badge variant="secondary" className="text-[10px]">{ENV_VARS.length}</Badge>
              </div>
              <Card>
                <CardContent className="pt-3 divide-y">
                  {ENV_VARS.map((env) => {
                    const isNodeActive = hoveredNode ? getRelated(hoveredNode).has(env.id) : false
                    const isNodeDimmed = hoveredNode ? !getRelated(hoveredNode).has(env.id) : false
                    return (
                      <div
                        key={env.id}
                        className={cn(
                          "py-2.5 transition-all duration-150",
                          isNodeDimmed && "opacity-30",
                        )}
                        onMouseEnter={() => setHoveredNode(env.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className={cn(
                            "font-mono text-[11px] text-primary flex-1 min-w-0 truncate transition-all",
                            isNodeActive && "text-amber-600 dark:text-amber-400 font-semibold",
                          )}>
                            {env.name}
                          </code>
                          <Badge variant={env.required ? "default" : "secondary"} className="text-[10px] shrink-0">
                            {env.required ? "必需" : "可选"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[11px] text-muted-foreground flex-1">{env.desc}</span>
                          {/* Direction A: 跨引用 → 哪些 tool 使用了这个变量 */}
                          {env.usedBy.length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-muted-foreground/60">被用于</span>
                              {env.usedBy.map((toolId) => {
                                const tool = TOOLS.find((t) => t.id === toolId)!
                                return (
                                  <RefChip
                                    key={toolId}
                                    nodeId={toolId}
                                    icon={Terminal}
                                    label={tool.name}
                                    hoveredNode={hoveredNode}
                                    onHover={setHoveredNode}
                                    onClick={() => scrollTo("df-tools-section")}
                                    colorClass="text-purple-600 dark:text-purple-400 border-purple-300/50 hover:border-purple-400"
                                  />
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </Section>

            <Separator />

            {/* Direction A + C: 工具，带依赖注解 */}
            <Section id="df-tools-section" category="tools" isActive={linkedField === "tools"}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-1.5 h-4 rounded-full transition-colors", linkedField === "tools" ? catStyles.tools.dot : "bg-purple-200 dark:bg-purple-900")} />
                <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Terminal className="size-3.5" /> 工具
                </h3>
                <span className="text-[11px] text-muted-foreground">只读</span>
              </div>
              <div className="space-y-2">
                {TOOLS.map((tool) => {
                  const isNodeActive = hoveredNode ? getRelated(hoveredNode).has(tool.id) : false
                  const isNodeDimmed = hoveredNode ? !getRelated(hoveredNode).has(tool.id) : false
                  return (
                    <Card
                      key={tool.id}
                      className={cn(
                        "transition-all duration-150",
                        isNodeActive && "ring-1 ring-purple-400/50",
                        isNodeDimmed && "opacity-30",
                      )}
                      onMouseEnter={() => setHoveredNode(tool.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <CardContent className="py-2.5 px-4">
                        <div className={cn("font-mono text-xs font-medium transition-colors", isNodeActive && "text-purple-600 dark:text-purple-400")}>
                          {tool.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{tool.desc}</div>
                        {/* Direction A: 依赖注解 */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-[10px] text-muted-foreground/60 self-center">依赖</span>
                          {tool.needsEnv.map((envId) => {
                            const env = ENV_VARS.find((e) => e.id === envId)!
                            return (
                              <RefChip
                                key={envId}
                                nodeId={envId}
                                icon={KeyRound}
                                label={env.name}
                                hoveredNode={hoveredNode}
                                onHover={setHoveredNode}
                                onClick={() => scrollTo("df-env-section")}
                                colorClass="text-amber-600 dark:text-amber-400 border-amber-300/50 hover:border-amber-400"
                              />
                            )
                          })}
                          {tool.readsConfig.map((cfgId) => {
                            const cfg = CONFIG_FILES.find((c) => c.id === cfgId)!
                            return (
                              <RefChip
                                key={cfgId}
                                nodeId={cfgId}
                                icon={FileJson}
                                label={cfg.name}
                                hoveredNode={hoveredNode}
                                onHover={setHoveredNode}
                                colorClass="text-sky-600 dark:text-sky-400 border-sky-300/50 hover:border-sky-400"
                              />
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </Section>

            <Separator />

            {/* 文档正文 */}
            <Section id="df-body-section" category="body" isActive={linkedField === "body"}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-1.5 h-4 rounded-full transition-colors", linkedField === "body" ? catStyles.body.dot : "bg-emerald-200 dark:bg-emerald-900")} />
                <h3 className="text-sm font-semibold">文档正文</h3>
                <span className="text-[11px] text-muted-foreground">只读 Markdown body</span>
              </div>
              <Card>
                <CardContent className="pt-3 text-xs space-y-1.5 font-mono">
                  {[
                    { h: true,  text: "# Overview" },
                    { h: false, text: "A multi-source tech news aggregator..." },
                    { h: true,  text: "## Data Sources" },
                    { h: false, text: "RSS feeds · Twitter/X KOLs · GitHub..." },
                    { h: true,  text: "## Tools" },
                    { h: true,  text: "### fetch_tech_news" },
                    { h: false, text: "从多数据源抓取科技新闻..." },
                    { h: true,  text: "### score_quality" },
                    { h: false, text: "使用 AI 评估新闻质量分数..." },
                  ].map((line, i) => (
                    <div key={i} className={cn(line.h ? "text-foreground font-semibold mt-1" : "text-muted-foreground")}>
                      {line.text}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </Section>

          </div>
        </ScrollArea>

        {/* ──────────── Preview Panel (right) ──────────── */}
        <div className="w-[340px] shrink-0 flex flex-col min-h-0 bg-background">
          <div className="shrink-0 flex items-center justify-between border-b px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">SKILL.md 预览</span>
            {linkedField ? (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/5 animate-in fade-in duration-150">
                活跃: {linkedField}
              </Badge>
            ) : (
              <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                <MousePointerClick className="size-3" /> 点击行可跳转
              </span>
            )}
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3">
              <pre className="font-mono text-[11px] leading-relaxed">
                {SEGMENTS.map((seg, i) => {
                  if (!seg.fieldId) {
                    return <span key={i} className="text-muted-foreground/40">{seg.text}</span>
                  }
                  const cat = seg.category as SectionCategory
                  const s = catStyles[cat]
                  const isActive = linkedField === seg.fieldId
                  const isReadonly = cat === "tools" || cat === "body"

                  return (
                    <span
                      key={i}
                      ref={(el) => { if (el && seg.fieldId) segmentRefs.current.set(seg.fieldId, el) }}
                      className={cn(
                        "block border-l-2 pl-2 cursor-pointer transition-all duration-150 rounded-r-sm",
                        isActive ? cn(s.segActiveBorder, s.segActiveBg) : cn(s.segBorder, "hover:bg-muted/60"),
                      )}
                      onClick={() => handleSegmentClick(seg.fieldId, isReadonly)}
                      title={isReadonly ? `查看 "${seg.fieldId}" 区块` : `点击聚焦 "${seg.fieldId}" 字段`}
                    >
                      {seg.text}
                    </span>
                  )
                })}
              </pre>
            </div>
          </ScrollArea>
        </div>

      </div>
    </div>
  )
}
