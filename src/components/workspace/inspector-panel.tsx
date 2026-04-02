import { useMemo } from "react"
import {
  Download,
  ExternalLink,
  FileText,
  Info,
  Link2,
} from "lucide-react"

import { ExportButton } from "@/components/config-editor/export-button"
import { JsonPreview } from "@/components/config-editor/json-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useWorkspace } from "@/hooks/use-workspace"
import { downloadFile } from "@/lib/download"
import { serializeSkillMd } from "@/lib/skill-serializer"
import { validateSkill } from "@/lib/skill-validator"
import type { EnvVarDefinition, ParsedSkill } from "@/types/skill"
import type { SkillEditState } from "@/types/workspace"

function envVarsFromFrontmatter(fm: SkillEditState["frontmatter"]): EnvVarDefinition[] {
  if (!fm.env || !Array.isArray(fm.env)) return []
  return fm.env.map((e) => ({
    name: e.name,
    required: e.required ?? false,
    description: e.description ?? "",
  }))
}

function skillForValidation(skill: ParsedSkill, edit: SkillEditState): ParsedSkill {
  return {
    ...skill,
    frontmatter: edit.frontmatter,
    configFiles: edit.configFiles,
    description: edit.frontmatter.description ?? skill.description,
    envVars: envVarsFromFrontmatter(edit.frontmatter),
  }
}

function countSeverity(
  issues: { severity: "error" | "warning" | "info" }[],
  sev: "error" | "warning" | "info",
) {
  return issues.filter((i) => i.severity === sev).length
}

export function InspectorPanel() {
  const { state, selectedSkill, editState, select } = useWorkspace()
  const selection = state.selection

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

  const validationResult = useMemo(() => {
    if (!selectedSkill || !editState) return null
    return validateSkill(skillForValidation(selectedSkill, editState))
  }, [selectedSkill, editState])

  const configPaths = useMemo(() => {
    if (!selectedSkill) return []
    const keys = new Set([
      ...Object.keys(selectedSkill.configFiles),
      ...Object.keys(editState?.configFiles ?? {}),
    ])
    return [...keys].sort()
  }, [selectedSkill, editState?.configFiles])

  const selectedConfigData = useMemo(() => {
    if (!selection || selection.nodeType !== "config-file" || !selection.filePath || !editState) {
      return undefined
    }
    return editState.configFiles[selection.filePath]
  }, [selection, editState])

  const exportSkillMd = () => {
    downloadFile("SKILL.md", skillMdPreview, "text/markdown;charset=utf-8")
  }

  const skillId = selectedSkill?.id ?? selection?.skillId

  return (
    <div className="flex h-full min-h-0 flex-col border-l bg-background">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">检查器</span>
          {editState?.dirty && (
            <Badge
              variant="outline"
              className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              已修改
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-3 text-sm">
          {!selection && (
            <p className="text-muted-foreground">选择一个节点以查看详情</p>
          )}

          {selection && !selectedSkill && (
            <p className="text-muted-foreground">无法加载 Skill</p>
          )}

          {selection && selectedSkill && editState && (
            <>
              {selection.nodeType === "skill-md" && (
                <section className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    SKILL.md 预览
                  </h3>
                  <ScrollArea className="max-h-64 rounded-md border">
                    <pre className="whitespace-pre-wrap break-words p-3 font-mono text-sm leading-relaxed">
                      {skillMdPreview}
                    </pre>
                  </ScrollArea>
                  <Button type="button" variant="outline" size="sm" onClick={exportSkillMd}>
                    <Download className="mr-2 h-4 w-4" />
                    导出 SKILL.md
                  </Button>
                </section>
              )}

              {selection.nodeType === "config-file" && selection.filePath && (
                <section className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    配置预览
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">{selection.filePath}</p>
                  {selectedConfigData !== undefined ? (
                    <JsonPreview data={selectedConfigData} />
                  ) : (
                    <p className="text-muted-foreground">无此文件数据</p>
                  )}
                  {selectedConfigData !== undefined && (
                    <ExportButton
                      filename={selection.filePath.split("/").pop() ?? "config.json"}
                      data={selectedConfigData}
                      label={`导出 ${selection.filePath.split("/").pop() ?? "配置"}`}
                    />
                  )}
                </section>
              )}

              {selection.nodeType === "validation" && validationResult && (
                <section className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    校验摘要
                  </h3>
                  {validationResult.issues.length === 0 ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">验证通过</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="destructive">
                        {countSeverity(validationResult.issues, "error")} 错误
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-amber-600 dark:text-amber-400"
                      >
                        {countSeverity(validationResult.issues, "warning")} 警告
                      </Badge>
                      <Badge variant="secondary">
                        {countSeverity(validationResult.issues, "info")} 提示
                      </Badge>
                      <span className="w-full text-sm text-muted-foreground">
                        共 {validationResult.issues.length} 条
                      </span>
                    </div>
                  )}
                </section>
              )}

            </>
          )}

          {selectedSkill && editState && (
            <>
              <Separator />
              <section className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  文件信息
                </h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">路径</dt>
                    <dd className="truncate font-mono">{selectedSkill.path || "—"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">版本</dt>
                    <dd>{editState.frontmatter.version ?? "—"}</dd>
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
                      onClick={() =>
                        skillId &&
                        select({ skillId, nodeType: "skill-md" })
                      }
                    >
                      <FileText className="size-3.5 shrink-0" aria-hidden />
                      SKILL.md
                      {selection?.nodeType === "skill-md" && (
                        <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
                      )}
                    </button>
                  </li>
                  {configPaths.map((path) => (
                    <li key={path}>
                      <button
                        type="button"
                        className="inline-flex max-w-full items-center gap-1 truncate text-left text-sm text-primary underline-offset-4 hover:underline"
                        onClick={() =>
                          skillId &&
                          select({ skillId, nodeType: "config-file", filePath: path })
                        }
                      >
                        <FileText className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{path}</span>
                        {selection?.nodeType === "config-file" &&
                          selection.filePath === path && (
                            <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
                          )}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-left text-sm text-primary underline-offset-4 hover:underline"
                      onClick={() =>
                        skillId &&
                        select({ skillId, nodeType: "validation" })
                      }
                    >
                      <Info className="size-3.5 shrink-0" aria-hidden />
                      校验
                      {selection?.nodeType === "validation" && (
                        <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
                      )}
                    </button>
                  </li>
                </ul>
              </section>

              <Separator />
              <section className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  导出
                </h3>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={exportSkillMd}>
                    <Download className="mr-2 h-4 w-4" />
                    SKILL.md
                  </Button>
                  {configPaths.map((path) => {
                    const data = editState.configFiles[path]
                    if (data === undefined) return null
                    const name = path.split("/").pop() ?? path
                    return (
                      <ExportButton
                        key={path}
                        filename={name}
                        data={data}
                        label={name}
                      />
                    )
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
