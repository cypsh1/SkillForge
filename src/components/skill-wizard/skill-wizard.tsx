import { useMemo, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  FolderPlus,
  Plus,
  Settings,
  Terminal,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { downloadFile } from "@/lib/download"
import { serializeSkillMd } from "@/lib/skill-serializer"
import { createLocalSkillBundle, isTauri } from "@/lib/tauri-fs"
import { cn } from "@/lib/utils"
import type { SkillFrontmatter } from "@/types/skill"

export interface WizardData {
  template: "blank" | "basic-tool" | "configurable" | "clone" | null
  name: string
  description: string
  version: string
  author: string
  homepage: string
  tools: Array<{ name: string; description: string }>
  envVars: Array<{ name: string; description: string; required: boolean }>
}

const STEPS = ["模板", "基本信息", "工具", "环境变量", "预览与创建"]

const TEMPLATES: Array<{
  id: Exclude<WizardData["template"], null>
  title: string
  desc: string
  icon: typeof FileText
}> = [
  { id: "blank", title: "空白技能", desc: "只包含 SKILL.md 的最小结构", icon: FileText },
  { id: "basic-tool", title: "基础工具", desc: "包含工具定义和环境变量", icon: Terminal },
  { id: "configurable", title: "配置型技能", desc: "包含 config/ 目录和配置文件", icon: Settings },
  { id: "clone", title: "克隆现有", desc: "从已有技能复制并修改", icon: Copy },
]

function buildFrontmatter(data: WizardData): SkillFrontmatter {
  const fm: SkillFrontmatter = {
    name: data.name.trim(),
    description: data.description.trim(),
    version: data.version.trim() || "1.0.0",
  }
  if (data.author.trim()) fm.author = data.author.trim()
  if (data.homepage.trim()) fm.homepage = data.homepage.trim()
  const tools = data.tools
    .filter((t) => t.name.trim())
    .map((t) => ({ name: t.name.trim(), description: t.description.trim(), parameters: [] }))
  if (tools.length > 0) fm.tools = tools
  const env = data.envVars
    .filter((e) => e.name.trim())
    .map((e) => ({
      name: e.name.trim(),
      required: e.required,
      description: e.description.trim(),
    }))
  if (env.length > 0) fm.env = env
  return fm
}

function buildMarkdownBody(data: WizardData): string {
  const title = data.name.trim() || "新技能"
  const desc = data.description.trim()
  const cloneNote =
    data.template === "clone"
      ? "\n\n> 克隆模板：请从已有技能目录复制所需文件并按需修改。\n"
      : ""
  return `# ${title}\n\n${desc}${cloneNote}`
}

function dirPreviewLines(name: string, template: WizardData["template"]): string {
  const base = name.trim() || "my-skill"
  const lines = [`${base}/`, `  SKILL.md`]
  if (template === "configurable") lines.push(`  config/`, `    defaults/`)
  return lines.join("\n")
}

function applyTemplateDefaults(
  template: Exclude<WizardData["template"], null>,
): Pick<WizardData, "tools" | "envVars"> {
  if (template === "basic-tool")
    return {
      tools: [{ name: "hello-tool", description: "示例工具说明，可按需修改。" }],
      envVars: [],
    }
  if (template === "configurable")
    return {
      tools: [{ name: "", description: "" }],
      envVars: [{ name: "EXAMPLE_KEY", description: "示例配置项说明", required: true }],
    }
  return { tools: [{ name: "", description: "" }], envVars: [] }
}

export interface SkillWizardProps {
  onClose: () => void
  onCreated?: (skillId: string) => void
}

export function SkillWizard({ onClose, onCreated }: SkillWizardProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>({
    template: null,
    name: "",
    description: "",
    version: "1.0.0",
    author: "",
    homepage: "",
    tools: [{ name: "", description: "" }],
    envVars: [],
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const skillMdPreview = useMemo(() => {
    if (!data.name.trim() || !data.description.trim()) return ""
    return serializeSkillMd(buildFrontmatter(data), buildMarkdownBody(data))
  }, [data])

  const dirPreview = useMemo(() => dirPreviewLines(data.name, data.template), [data.name, data.template])

  const canNext =
    step === 0
      ? data.template !== null
      : step === 1
        ? data.name.trim() && data.description.trim()
        : true

  const selectTemplate = (id: Exclude<WizardData["template"], null>) => {
    const d = applyTemplateDefaults(id)
    setData((s) => ({ ...s, template: id, tools: d.tools, envVars: d.envVars }))
  }

  const exportSkillMd = () =>
    downloadFile("SKILL.md", skillMdPreview, "text/markdown;charset=utf-8")

  const handleCreateLocal = async () => {
    if (!skillMdPreview || !data.template) return
    setCreating(true)
    setCreateError(null)
    try {
      const skillName = data.name.trim()
      await createLocalSkillBundle(skillName, skillMdPreview, {
        configurable: data.template === "configurable",
      })
      onCreated?.(skillName)
      onClose()
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : String(e))
    } finally {
      setCreating(false)
    }
  }

  const patchTool = (i: number, p: Partial<WizardData["tools"][0]>) =>
    setData((s) => ({ ...s, tools: s.tools.map((t, j) => (j === i ? { ...t, ...p } : t)) }))
  const addTool = () => setData((s) => ({ ...s, tools: [...s.tools, { name: "", description: "" }] }))
  const delTool = (i: number) =>
    setData((s) => ({ ...s, tools: s.tools.length > 1 ? s.tools.filter((_, j) => j !== i) : s.tools }))

  const patchEnv = (i: number, p: Partial<WizardData["envVars"][0]>) =>
    setData((s) => ({ ...s, envVars: s.envVars.map((e, j) => (j === i ? { ...e, ...p } : e)) }))
  const addEnv = () =>
    setData((s) => ({
      ...s,
      envVars: [...s.envVars, { name: "", description: "", required: false }],
    }))
  const delEnv = (i: number) => setData((s) => ({ ...s, envVars: s.envVars.filter((_, j) => j !== i) }))

  const field = (
    id: string,
    label: string,
    val: string,
    set: (v: string) => void,
    ph: string,
    hint?: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={val} onChange={(e) => set(e.target.value)} placeholder={ph} className="h-8" />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )

  return (
    <div className="flex max-h-[min(85vh,720px)] w-full max-w-xl flex-col rounded-xl border bg-card text-sm shadow-lg">
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <span className="font-medium">创建新技能</span>
        <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={onClose} aria-label="关闭">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-1 gap-y-1 px-2 py-2">
        {STEPS.map((label, i) => (
          <span key={label} className="contents">
            {i > 0 ? <span className="text-muted-foreground">───</span> : null}
            <button
              type="button"
              className={cn(
                "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs",
                i === step && "bg-primary/15 font-medium text-primary",
                i !== step && "text-muted-foreground",
              )}
              onClick={() => i <= step && setStep(i)}
            >
              {i < step ? <Check className="size-3.5 text-primary" /> : i === step ? <span className="size-2 rounded-full bg-primary" /> : <span className="size-2 rounded-full border border-muted-foreground/50" />}
              {label}
            </button>
          </span>
        ))}
      </div>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {step === 0 && (
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => {
              const Icon = t.icon
              const sel = data.template === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTemplate(t.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                    sel ? "bg-blue-500/10 ring-2 ring-primary dark:bg-blue-500/15" : "hover:bg-muted/50",
                  )}
                >
                  <Icon className="size-5 text-muted-foreground" />
                  <span className="font-medium">{t.title}</span>
                  <span className="text-xs text-muted-foreground">{t.desc}</span>
                </button>
              )
            })}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {field("skill-name", "名称", data.name, (v) => setData((s) => ({ ...s, name: v })), "my-skill-name", "必填，建议使用 kebab-case，如 my-skill-name")}
            <div className="space-y-1.5">
              <Label htmlFor="skill-desc">描述</Label>
              <Textarea
                id="skill-desc"
                value={data.description}
                onChange={(e) => setData((s) => ({ ...s, description: e.target.value }))}
                placeholder="简要说明技能用途"
                rows={3}
                className="min-h-[72px] resize-y"
              />
            </div>
            {field("skill-version", "版本", data.version, (v) => setData((s) => ({ ...s, version: v })), "1.0.0")}
            {field("skill-author", "作者", data.author, (v) => setData((s) => ({ ...s, author: v })), "可选")}
            {field("skill-homepage", "主页", data.homepage, (v) => setData((s) => ({ ...s, homepage: v })), "可选 URL")}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {data.tools.map((tool, i) => (
              <Card key={i} size="sm" className="gap-2 py-3">
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      工具 {i + 1}
                    </Badge>
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="xs" onClick={addTool}>
                        <Plus className="size-3" />
                        添加
                      </Button>
                      <Button type="button" variant="ghost" size="xs" disabled={data.tools.length <= 1} onClick={() => delTool(i)}>
                        <X className="size-3" />
                        移除
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">名称</Label>
                    <Input value={tool.name} onChange={(e) => patchTool(i, { name: e.target.value })} className="h-8" placeholder="tool-name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">说明</Label>
                    <Textarea value={tool.description} onChange={(e) => patchTool(i, { description: e.target.value })} rows={2} className="min-h-[52px] resize-y" placeholder="工具用途与行为" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            {data.envVars.length === 0 ? (
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={addEnv}>
                <Plus className="size-3.5" />
                添加环境变量
              </Button>
            ) : null}
            {data.envVars.map((env, i) => (
              <Card key={i} size="sm" className="gap-2 py-3">
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      变量 {i + 1}
                    </Badge>
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="xs" onClick={addEnv}>
                        <Plus className="size-3" />
                        添加
                      </Button>
                      <Button type="button" variant="ghost" size="xs" onClick={() => delEnv(i)}>
                        <X className="size-3" />
                        移除
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">名称</Label>
                    <Input value={env.name} onChange={(e) => patchEnv(i, { name: e.target.value })} className="h-8" placeholder="API_KEY" />
                    <p className="text-xs text-muted-foreground">建议全大写与下划线，如 API_KEY</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">说明</Label>
                    <Input value={env.description} onChange={(e) => patchEnv(i, { description: e.target.value })} className="h-8" placeholder="用途说明" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id={`env-req-${i}`} checked={env.required} onCheckedChange={(v) => patchEnv(i, { required: v })} />
                    <Label htmlFor={`env-req-${i}`} className="text-xs font-normal">
                      必填
                    </Label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">目录结构预览</p>
              <pre className="whitespace-pre rounded-md border bg-muted/40 p-2 font-mono text-xs leading-relaxed">{dirPreview}</pre>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">SKILL.md 预览</p>
              <ScrollArea className="h-[200px] rounded-md border">
                <pre className="p-2 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {skillMdPreview || "请先在「基本信息」中填写名称与描述"}
                </pre>
              </ScrollArea>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" disabled={!skillMdPreview} onClick={exportSkillMd}>
                <Download className="size-3.5" />
                导出 SKILL.md
              </Button>
              {isTauri() && (
                <Button type="button" size="sm" disabled={!skillMdPreview || creating || !data.template} onClick={handleCreateLocal}>
                  <FolderPlus className="size-3.5" />
                  {creating ? "创建中…" : "创建到本地"}
                </Button>
              )}
            </div>
            {createError ? <p className="text-xs text-destructive">{createError}</p> : null}
          </div>
        )}
      </div>

      <Separator />

      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
        <Button type="button" variant="outline" size="sm" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <ChevronLeft className="size-3.5" />
          上一步
        </Button>
        {step < 4 ? (
          <Button type="button" size="sm" disabled={!canNext} onClick={() => setStep((s) => Math.min(4, s + 1))}>
            下一步
            <ChevronRight className="size-3.5" />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">使用上方按钮导出或创建</span>
        )}
      </div>
    </div>
  )
}
