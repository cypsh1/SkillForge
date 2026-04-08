import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  ValidationIssue,
  ValidationResult,
} from "@/lib/skill-validator"

interface ValidationPanelProps {
  result: ValidationResult
}

function countBySeverity(
  issues: ValidationIssue[],
  severity: ValidationIssue["severity"]
) {
  return issues.filter((i) => i.severity === severity).length
}

export function ValidationPanel({ result }: ValidationPanelProps) {
  const { t } = useTranslation()
  const err = countBySeverity(result.issues, "error")
  const warn = countBySeverity(result.issues, "warning")
  const info = countBySeverity(result.issues, "info")

  if (result.issues.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden />
          <span>{t("workspace.validation.passed")}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("workspace.validation.title")}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="destructive">
            {t("workspace.validation.errorCount", { count: err })}
          </Badge>
          <Badge variant="secondary" className="text-amber-600 dark:text-amber-400">
            {t("workspace.validation.warningCount", { count: warn })}
          </Badge>
          <Badge variant="secondary">
            {t("workspace.validation.infoCount", { count: info })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {result.issues.map((issue, idx) => (
          <div
            key={`${issue.field}-${issue.severity}-${idx}`}
            className="flex gap-2 text-sm"
          >
            {issue.severity === "error" && (
              <>
                <AlertCircle
                  className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400"
                  aria-hidden
                />
                <span className="text-red-600 dark:text-red-400">
                  <span className="font-mono">{issue.field}</span>
                  <span className="text-muted-foreground"> — </span>
                  {issue.message}
                </span>
              </>
            )}
            {issue.severity === "warning" && (
              <>
                <AlertTriangle
                  className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
                <span className="text-amber-600 dark:text-amber-400">
                  <span className="font-mono">{issue.field}</span>
                  <span className="text-muted-foreground"> — </span>
                  {issue.message}
                </span>
              </>
            )}
            {issue.severity === "info" && (
              <>
                <Info
                  className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400"
                  aria-hidden
                />
                <span className="text-blue-600 dark:text-blue-400">
                  <span className="font-mono">{issue.field}</span>
                  <span className="text-muted-foreground"> — </span>
                  {issue.message}
                </span>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
