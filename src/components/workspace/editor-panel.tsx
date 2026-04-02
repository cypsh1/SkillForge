import { useMemo } from "react"
import {
  ExternalLink,
  FileText,
  KeyRound,
  Layers,
  Pencil,
  Settings,
  ShieldCheck,
  Terminal,
} from "lucide-react"
import { SourcesEditor } from "@/components/config-editor/sources-editor"
import { TopicsEditor } from "@/components/config-editor/topics-editor"
import { SchemaViewer } from "@/components/config-editor/schema-viewer"
import { EmptyState } from "@/components/empty-state"
import { FrontmatterEditor } from "@/components/skill-editor/frontmatter-editor"
import { ValidationPanel } from "@/components/skill-editor/validation-panel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useWorkspace } from "@/hooks/use-workspace"
import { validateSkill } from "@/lib/skill-validator"
import type { NavigatorSelection } from "@/types/workspace"
import type { EnvVarDefinition, ParsedSkill, SkillTool } from "@/types/skill"

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
    case "validation":
      return ShieldCheck
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
    case "validation":
      return "验证"
    default:
      return ""
  }
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

function ToolsBlock({ tools }: { tools: SkillTool[] }) {
  if (tools.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">未定义工具</p>
    )
  }
  return (
    <div className="grid gap-3">
      {tools.map((tool, i) => (
        <Card key={i}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-mono">{tool.name}</CardTitle>
            {tool.description ? (
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            ) : null}
          </CardHeader>
          {tool.parameters.length > 0 ? (
            <CardContent className="py-2 px-4">
              <div className="space-y-1">
                {tool.parameters.map((param, j) => (
                  <div key={j} className="flex items-baseline gap-2 text-xs">
                    <code className="font-mono text-primary">{param.name}</code>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      {param.type}
                    </Badge>
                    {param.description ? (
                      <span className="text-muted-foreground">{param.description}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  )
}

function EnvTable({ envVars }: { envVars: EnvVarDefinition[] }) {
  if (envVars.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">未声明环境变量</p>
    )
  }
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">变量名</th>
            <th className="px-3 py-2 text-left font-medium w-20">必需</th>
            <th className="px-3 py-2 text-left font-medium">描述</th>
          </tr>
        </thead>
        <tbody>
          {envVars.map((env, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-3 py-2 font-mono text-xs">{env.name}</td>
              <td className="px-3 py-2">
                <Badge variant={env.required ? "default" : "secondary"} className="text-[10px]">
                  {env.required ? "必需" : "可选"}
                </Badge>
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {env.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionsTree({ skill }: { skill: ParsedSkill }) {
  if (skill.sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">无章节</p>
    )
  }
  return (
    <div className="space-y-1">
      {skill.sections.map((section, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-sm"
          style={{ paddingLeft: `${(section.level - 1) * 16}px` }}
        >
          <span className="text-muted-foreground text-xs font-mono">
            {"#".repeat(section.level)}
          </span>
          <span>{section.title}</span>
          {section.content.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              ({section.content.length} 字符)
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function SkillOverviewPanel({ skill, fm }: { skill: ParsedSkill; fm: ParsedSkill["frontmatter"] }) {
  const configCount = Object.keys(skill.configFiles).length
  return (
    <div className="space-y-6">
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
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-2">
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
          <div className="flex flex-wrap gap-2 pt-2">
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

      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          工具
        </h3>
        <ToolsBlock tools={skill.tools} />
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          环境变量
        </h3>
        <EnvTable envVars={skill.envVars} />
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">文档结构</h3>
        <SectionsTree skill={skill} />
      </div>
    </div>
  )
}

export function EditorPanel() {
  const { state, selectedSkill, editState, updateFrontmatter, updateConfig } = useWorkspace()

  const selection = state.selection

  const skillForValidation = useMemo(() => {
    if (!selectedSkill || !editState) return null
    return mergeSkillForValidation(selectedSkill, editState.frontmatter, editState.configFiles)
  }, [selectedSkill, editState])

  const validationResult = useMemo(() => {
    if (!skillForValidation) return null
    return validateSkill(skillForValidation)
  }, [skillForValidation])

  const HeaderIcon = selection ? headerIcon(selection.nodeType) : FileText
  const titleName =
    selectedSkill?.frontmatter.name ??
    (selection ? selection.skillId : "")
  const segment = selection ? headerSegment(selection) : ""

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <HeaderIcon className="size-4 text-muted-foreground shrink-0" aria-hidden />
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="text-muted-foreground shrink-0">编辑:</span>
          <span className="font-mono truncate">{titleName || "—"}</span>
          {segment ? (
            <>
              <span className="text-muted-foreground shrink-0">/</span>
              <span className="truncate">{segment}</span>
            </>
          ) : null}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
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
            />
          ) : selection.nodeType === "skill-md" ? (
            <div className="min-w-0 lg:max-w-3xl">
              <FrontmatterEditor
                frontmatter={editState.frontmatter}
                onChange={(updated) => updateFrontmatter(selectedSkill.id, updated)}
              />
            </div>
          ) : selection.nodeType === "config-file" ? (
            <ConfigFileEditor
              selection={selection}
              skill={selectedSkill}
              editState={editState}
              updateConfig={updateConfig}
            />
          ) : selection.nodeType === "validation" ? (
            validationResult ? (
              <ValidationPanel result={validationResult} />
            ) : (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  无法运行验证
                </CardContent>
              </Card>
            )
          ) : null}
        </div>
      </ScrollArea>
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
