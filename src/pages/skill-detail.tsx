import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import { ArrowLeft, Terminal, KeyRound, Pencil, Layers, ExternalLink, FileText, Download, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getSkillById } from "@/data/skill-loader"
import { ConfigEditor } from "@/components/config-editor/config-editor"
import { ExportButton } from "@/components/config-editor/export-button"
import { FrontmatterForm } from "@/components/skill-editor/frontmatter-form"
import { ValidationPanel } from "@/components/skill-editor/validation-panel"
import { serializeSkillMd } from "@/lib/skill-serializer"
import { validateSkill } from "@/lib/skill-validator"
import { downloadFile } from "@/lib/download"
import type { ParsedSkill, SkillFrontmatter, SkillTool, EnvVarDefinition } from "@/types/skill"

export default function SkillDetailPage() {
  const { skillId } = useParams()
  const navigate = useNavigate()
  const skill = getSkillById(skillId ?? "")

  if (!skill) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/skills")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Button>
        <p className="text-muted-foreground">Skill 未找到：{skillId}</p>
      </div>
    )
  }

  return <SkillDetailContent skill={skill} onBack={() => navigate("/skills")} />
}

function SkillDetailContent({ skill, onBack }: { skill: ParsedSkill; onBack: () => void }) {
  const [editedFrontmatter, setEditedFrontmatter] = useState<SkillFrontmatter>(
    () => structuredClone(skill.frontmatter),
  )

  const markdownBody = useMemo(() => {
    const bodyStart = skill.rawContent.indexOf("---", 3)
    if (bodyStart === -1) return skill.rawContent
    return skill.rawContent.slice(bodyStart + 3).trimStart()
  }, [skill.rawContent])

  const skillMdPreview = useMemo(
    () => serializeSkillMd(editedFrontmatter, markdownBody),
    [editedFrontmatter, markdownBody],
  )

  const validationResult = useMemo(() => validateSkill(skill), [skill])

  const handleExportSkillMd = () => {
    downloadFile("SKILL.md", skillMdPreview, "text/markdown;charset=utf-8")
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
      </div>

      <SkillOverview skill={skill} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="edit-frontmatter">
            <FileText className="mr-1 h-3.5 w-3.5" />
            编辑 SKILL.md
          </TabsTrigger>
          {skill.hasConfig && (
            <TabsTrigger value="config">
              <Pencil className="mr-1 h-3.5 w-3.5" />
              配置编辑
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Skill 验证
            </h3>
            <ValidationPanel result={validationResult} />
          </div>
          <Separator />
          {skill.tools.length > 0 && (
            <>
              <ToolsSection tools={skill.tools} />
              <Separator />
            </>
          )}
          {skill.envVars.length > 0 && (
            <>
              <EnvVarsSection envVars={skill.envVars} />
              <Separator />
            </>
          )}
          <SectionsOverview skill={skill} />
        </TabsContent>

        <TabsContent value="edit-frontmatter" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">编辑 Frontmatter</h3>
            <Button variant="outline" size="sm" onClick={handleExportSkillMd}>
              <Download className="mr-2 h-4 w-4" />
              导出 SKILL.md
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">表单编辑</h4>
              <FrontmatterForm
                frontmatter={editedFrontmatter}
                skillId={skill.id}
                onChange={setEditedFrontmatter}
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">SKILL.md 预览</h4>
              <ScrollArea className="h-[600px] rounded-md border">
                <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                  {skillMdPreview}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        {skill.hasConfig && (
          <TabsContent value="config" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">配置编辑器</h3>
              <div className="flex gap-2">
                {Object.entries(skill.configFiles).map(([path, data]) => (
                  <ExportButton
                    key={path}
                    filename={path.split("/").pop() ?? "config.json"}
                    data={data}
                    label={`导出 ${path.split("/").pop()}`}
                  />
                ))}
              </div>
            </div>
            <ConfigEditor configFiles={skill.configFiles} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function SkillOverview({ skill }: { skill: ParsedSkill }) {
  const fm = skill.frontmatter
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-mono tracking-tight">
            {fm.name}
          </h2>
          <p className="text-muted-foreground max-w-2xl">{skill.description}</p>
        </div>
        {fm.version && (
          <Badge variant="secondary" className="text-sm">
            v{fm.version}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        {skill.path && (
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <code className="text-xs">{skill.path}</code>
          </span>
        )}
        {fm.homepage && (
          <a
            href={fm.homepage}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            主页
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {skill.tools.length > 0 && (
          <Badge variant="outline">
            <Terminal className="mr-1 h-3 w-3" />
            {skill.tools.length} 个工具
          </Badge>
        )}
        {skill.envVars.length > 0 && (
          <Badge variant="outline">
            <KeyRound className="mr-1 h-3 w-3" />
            {skill.envVars.length} 个环境变量
          </Badge>
        )}
        {skill.hasConfig && (
          <Badge variant="outline">
            <Pencil className="mr-1 h-3 w-3" />
            {Object.keys(skill.configFiles).length} 个配置文件
          </Badge>
        )}
        <Badge variant="outline">
          {skill.sections.length} 个文档章节
        </Badge>
      </div>
    </div>
  )
}

function ToolsSection({ tools }: { tools: SkillTool[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Terminal className="h-5 w-5" />
        工具定义
      </h3>
      <div className="grid gap-3">
        {tools.map((tool, i) => (
          <Card key={i}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-mono">{tool.name}</CardTitle>
              {tool.description && (
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              )}
            </CardHeader>
            {tool.parameters.length > 0 && (
              <CardContent className="py-2 px-4">
                <div className="space-y-1">
                  {tool.parameters.map((param, j) => (
                    <div key={j} className="flex items-baseline gap-2 text-xs">
                      <code className="font-mono text-primary">{param.name}</code>
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        {param.type}
                      </Badge>
                      {param.description && (
                        <span className="text-muted-foreground">{param.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function EnvVarsSection({ envVars }: { envVars: EnvVarDefinition[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <KeyRound className="h-5 w-5" />
        环境变量
      </h3>
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
    </div>
  )
}

function SectionsOverview({ skill }: { skill: ParsedSkill }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">文档结构</h3>
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
            {section.content.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({section.content.length} 字符)
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
