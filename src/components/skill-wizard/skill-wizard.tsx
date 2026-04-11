import { useMemo, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderPlus,
  Plus,
  X,
} from "lucide-react"
import i18next from "i18next"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { downloadFile } from "@/lib/download"
import { serializeSkillMd } from "@/lib/skill-serializer"
import { createLocalSkillBundle, isTauri } from "@/lib/tauri-fs"
import { cn } from "@/lib/utils"
import type { SkillFrontmatter } from "@/types/skill"

export type WizardTemplate = "blank" | "basic-tool" | "configurable" | "clone"

export interface WizardData {
  template: WizardTemplate
  name: string
  description: string
  version: string
  author: string
  homepage: string
  tools: Array<{ name: string; description: string }>
  envVars: Array<{ name: string; description: string; required: boolean }>
}

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
  const title = data.name.trim() || i18next.t("workspace.wizard.defaultSkillName")
  const desc = data.description.trim()
  const cloneNote =
    data.template === "clone"
      ? `\n\n> ${i18next.t("workspace.wizard.cloneNote")}\n`
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
  template: WizardTemplate,
): Pick<WizardData, "tools" | "envVars"> {
  if (template === "basic-tool")
    return {
      tools: [
        {
          name: "hello-tool",
          description: i18next.t("workspace.wizard.sampleToolDesc"),
        },
      ],
      envVars: [],
    }
  if (template === "configurable")
    return {
      tools: [{ name: "", description: "" }],
      envVars: [
        {
          name: "EXAMPLE_KEY",
          description: i18next.t("workspace.wizard.sampleEnvDesc"),
          required: true,
        },
      ],
    }
  return { tools: [{ name: "", description: "" }], envVars: [] }
}

export interface SkillWizardProps {
  onClose: () => void
  onCreated?: (skillId: string) => void
}

export function SkillWizard({ onClose, onCreated }: SkillWizardProps) {
  const { t } = useTranslation()
  const steps = t("workspace.wizard.steps", { returnObjects: true }) as string[]
  const templateOptions: Array<{ id: WizardTemplate; label: string }> = useMemo(
    () => [
      { id: "blank", label: t("workspace.wizard.templateBlank") },
      { id: "basic-tool", label: t("workspace.wizard.templateBasicTool") },
      { id: "configurable", label: t("workspace.wizard.templateConfigurable") },
      { id: "clone", label: t("workspace.wizard.templateClone") },
    ],
    [t],
  )
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>({
    template: "blank",
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

  const LAST_STEP = steps.length - 1
  const canNext =
    step === 0
      ? !!(data.name.trim() && data.description.trim())
      : true

  const selectTemplate = (id: WizardTemplate) => {
    const d = applyTemplateDefaults(id)
    setData((s) => ({ ...s, template: id, tools: d.tools, envVars: d.envVars }))
  }

  const exportSkillMd = () =>
    downloadFile("SKILL.md", skillMdPreview, "text/markdown;charset=utf-8")

  const handleCreateLocal = async () => {
    if (!skillMdPreview) return
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
    setData((s) => ({
      ...s,
      tools: s.tools.map((tool, j) => (j === i ? { ...tool, ...p } : tool)),
    }))
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
        <span className="font-medium">{t("workspace.wizard.createNew")}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={onClose}
          aria-label={t("workspace.wizard.close")}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-1 gap-y-1 px-2 py-2">
        {steps.map((label, i) => (
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
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("workspace.wizard.templateLabel")}</Label>
              <Select value={data.template} onValueChange={(v) => selectTemplate(v as WizardTemplate)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("workspace.wizard.templateHint")}</p>
            </div>
            <Separator />
            {field(
              "skill-name",
              t("workspace.wizard.name"),
              data.name,
              (v) => setData((s) => ({ ...s, name: v })),
              "my-skill-name",
              t("workspace.wizard.nameHint"),
            )}
            <div className="space-y-1.5">
              <Label htmlFor="skill-desc">{t("workspace.wizard.description")}</Label>
              <Textarea
                id="skill-desc"
                value={data.description}
                onChange={(e) => setData((s) => ({ ...s, description: e.target.value }))}
                placeholder={t("workspace.wizard.descPlaceholder")}
                rows={3}
                className="min-h-[72px] resize-y"
              />
            </div>
            {field(
              "skill-version",
              t("workspace.wizard.version"),
              data.version,
              (v) => setData((s) => ({ ...s, version: v })),
              "1.0.0",
            )}
            {field(
              "skill-author",
              t("workspace.wizard.author"),
              data.author,
              (v) => setData((s) => ({ ...s, author: v })),
              t("workspace.wizard.authorPlaceholder"),
            )}
            {field(
              "skill-homepage",
              t("workspace.wizard.homepage"),
              data.homepage,
              (v) => setData((s) => ({ ...s, homepage: v })),
              t("workspace.wizard.homepagePlaceholder"),
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {data.tools.map((tool, i) => (
              <Card key={i} size="sm" className="gap-2 py-3">
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      {t("workspace.wizard.toolN", { n: i + 1 })}
                    </Badge>
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="xs" onClick={addTool}>
                        <Plus className="size-3" />
                        {t("workspace.wizard.addTool")}
                      </Button>
                      <Button type="button" variant="ghost" size="xs" disabled={data.tools.length <= 1} onClick={() => delTool(i)}>
                        <X className="size-3" />
                        {t("workspace.wizard.removeTool")}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("workspace.wizard.toolName")}</Label>
                    <Input value={tool.name} onChange={(e) => patchTool(i, { name: e.target.value })} className="h-8" placeholder="tool-name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("workspace.wizard.toolDesc")}</Label>
                    <Textarea
                      value={tool.description}
                      onChange={(e) => patchTool(i, { description: e.target.value })}
                      rows={2}
                      className="min-h-[52px] resize-y"
                      placeholder={t("workspace.wizard.toolDescPlaceholder")}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {data.envVars.length === 0 ? (
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={addEnv}>
                <Plus className="size-3.5" />
                {t("workspace.wizard.addEnvVar")}
              </Button>
            ) : null}
            {data.envVars.map((env, i) => (
              <Card key={i} size="sm" className="gap-2 py-3">
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      {t("workspace.wizard.envVarN", { n: i + 1 })}
                    </Badge>
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="xs" onClick={addEnv}>
                        <Plus className="size-3" />
                        {t("workspace.wizard.addTool")}
                      </Button>
                      <Button type="button" variant="ghost" size="xs" onClick={() => delEnv(i)}>
                        <X className="size-3" />
                        {t("workspace.wizard.removeTool")}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("workspace.wizard.envVarName")}</Label>
                    <Input value={env.name} onChange={(e) => patchEnv(i, { name: e.target.value })} className="h-8" placeholder="API_KEY" />
                    <p className="text-xs text-muted-foreground">{t("workspace.wizard.envVarNameHint")}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("workspace.wizard.envVarDesc")}</Label>
                    <Input value={env.description} onChange={(e) => patchEnv(i, { description: e.target.value })} className="h-8" placeholder={t("workspace.wizard.envVarDescPlaceholder")} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id={`env-req-${i}`} checked={env.required} onCheckedChange={(v) => patchEnv(i, { required: v })} />
                    <Label htmlFor={`env-req-${i}`} className="text-xs font-normal">
                      {t("workspace.wizard.envVarRequired")}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("workspace.wizard.dirPreview")}</p>
              <pre className="whitespace-pre rounded-md border bg-muted/40 p-2 font-mono text-xs leading-relaxed">{dirPreview}</pre>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("workspace.wizard.skillMdPreview")}</p>
              <ScrollArea className="h-[200px] rounded-md border">
                <pre className="p-2 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {skillMdPreview || t("workspace.wizard.skillMdEmpty")}
                </pre>
              </ScrollArea>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" disabled={!skillMdPreview} onClick={exportSkillMd}>
                <Download className="size-3.5" />
                {t("workspace.wizard.exportSkillMd")}
              </Button>
              {isTauri() && (
                <Button type="button" size="sm" disabled={!skillMdPreview || creating} onClick={handleCreateLocal}>
                  <FolderPlus className="size-3.5" />
                  {creating ? t("workspace.wizard.creating") : t("workspace.wizard.createLocal")}
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
          {t("workspace.wizard.prev")}
        </Button>
        {step < LAST_STEP ? (
          <Button type="button" size="sm" disabled={!canNext} onClick={() => setStep((s) => Math.min(LAST_STEP, s + 1))}>
            {t("workspace.wizard.next")}
            <ChevronRight className="size-3.5" />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{t("workspace.wizard.useButtons")}</span>
        )}
      </div>
    </div>
  )
}
