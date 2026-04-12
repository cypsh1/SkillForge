import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, XCircle, AlertTriangle, Download } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { validateSkill, type ValidationResult } from "@/lib/skill-validator"
import { downloadJson } from "@/lib/download"
import type { ParsedSkill } from "@/types/skill"

// ---------- Batch Validation ----------

interface BatchValidationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skills: ParsedSkill[]
}

interface SkillValidationRow {
  id: string
  name: string
  result: ValidationResult
  errorCount: number
  warningCount: number
}

export function BatchValidationDialog({
  open,
  onOpenChange,
  skills,
}: BatchValidationDialogProps) {
  const { t } = useTranslation()

  const rows = useMemo<SkillValidationRow[]>(() => {
    return skills.map((skill) => {
      const result = validateSkill(skill)
      const errorCount = result.issues.filter((i) => i.severity === "error").length
      const warningCount = result.issues.filter((i) => i.severity === "warning").length
      return {
        id: skill.id,
        name: skill.frontmatter.name || skill.id,
        result,
        errorCount,
        warningCount,
      }
    })
  }, [skills])

  const totalErrors = rows.filter((r) => r.errorCount > 0).length
  const totalWarnings = rows.filter((r) => r.warningCount > 0).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogTitle>{t("workspace.batch.validationTitle")}</DialogTitle>

        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t("workspace.batch.noSkills")}
          </p>
        ) : (
          <>
            <ScrollArea className="flex-1 rounded-md border max-h-[400px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">
                      {t("workspace.batch.skillName")}
                    </th>
                    <th className="text-center px-2 py-2 font-medium w-16">
                      {t("workspace.batch.status")}
                    </th>
                    <th className="text-center px-2 py-2 font-medium w-14">
                      {t("workspace.batch.errors")}
                    </th>
                    <th className="text-center px-2 py-2 font-medium w-14">
                      {t("workspace.batch.warnings")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-3 py-2 truncate max-w-[200px]">
                        {row.name}
                      </td>
                      <td className="text-center px-2 py-2">
                        {row.errorCount > 0 ? (
                          <XCircle className="size-4 text-red-500 inline-block" />
                        ) : row.warningCount > 0 ? (
                          <AlertTriangle className="size-4 text-amber-500 inline-block" />
                        ) : (
                          <CheckCircle2 className="size-4 text-emerald-500 inline-block" />
                        )}
                      </td>
                      <td className="text-center px-2 py-2 tabular-nums">
                        {row.errorCount > 0 ? (
                          <span className="text-red-500">{row.errorCount}</span>
                        ) : (
                          <span className="text-muted-foreground/40">0</span>
                        )}
                      </td>
                      <td className="text-center px-2 py-2 tabular-nums">
                        {row.warningCount > 0 ? (
                          <span className="text-amber-500">{row.warningCount}</span>
                        ) : (
                          <span className="text-muted-foreground/40">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            <div className="text-xs text-muted-foreground text-right pt-1">
              {totalErrors === 0 && totalWarnings === 0
                ? t("workspace.batch.allPassed")
                : t("workspace.batch.summary", {
                    total: skills.length,
                    errorCount: totalErrors,
                    warningCount: totalWarnings,
                  })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------- Batch Export ----------

interface BatchExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skills: ParsedSkill[]
}

export function BatchExportDialog({
  open,
  onOpenChange,
  skills,
}: BatchExportDialogProps) {
  const { t } = useTranslation()

  const handleExport = () => {
    const manifest = {
      exportedAt: new Date().toISOString(),
      count: skills.length,
      skills: skills.map((skill) => ({
        id: skill.id,
        name: skill.frontmatter.name || skill.id,
        skillMd: skill.rawContent,
        configFiles: skill.configFiles,
        extraFiles: Object.fromEntries(
          Object.entries(skill.extraFiles).map(([path, ef]) => [path, ef.content]),
        ),
      })),
    }

    downloadJson(`skillforge-export-${Date.now()}.json`, manifest)
    toast.success(t("workspace.batch.exportSuccess", { count: skills.length }))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>{t("workspace.batch.exportTitle")}</DialogTitle>

        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t("workspace.batch.noSkills")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {t("workspace.batch.summary", {
                total: skills.length,
                errorCount: 0,
                warningCount: 0,
              }).split(",")[0]}
            </p>

            <ScrollArea className="rounded-md border max-h-[240px]">
              <div className="divide-y">
                {skills.map((skill) => (
                  <div key={skill.id} className="px-3 py-1.5 text-xs truncate">
                    {skill.frontmatter.name || skill.id}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button size="sm" className="self-end" onClick={handleExport}>
              <Download className="mr-1.5 size-3.5" />
              {t("workspace.batch.export")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
