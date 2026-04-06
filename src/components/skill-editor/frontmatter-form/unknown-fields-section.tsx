import { useMemo } from "react"
import { X } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SkillFrontmatter } from "@/types/skill"
import { KNOWN_FIELDS } from "@/lib/schemas/frontmatter-schema"

export function UnknownFieldsSection() {
  const { t } = useTranslation()
  const form = useFormContext<SkillFrontmatter>()
  const allValues = form.watch()

  const unknownFields = useMemo(() => {
    const entries: [string, unknown][] = []
    for (const [key, value] of Object.entries(allValues)) {
      if (!KNOWN_FIELDS.has(key) && value !== undefined) {
        entries.push([key, value])
      }
    }
    return entries
  }, [allValues])

  if (unknownFields.length === 0) return null

  const removeField = (key: string) => {
    form.setValue(key as never, undefined as never, { shouldDirty: true })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{t("form.unknownFields.title")}</CardTitle>
          <Badge variant="secondary" className="text-xs font-normal">
            {unknownFields.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {unknownFields.map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground font-mono">{key}</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeField(key)}
              >
                <X className="size-3" />
              </Button>
            </div>
            {typeof value === "string" ? (
              <Input
                value={value}
                onChange={(e) =>
                  form.setValue(key as never, e.target.value as never, { shouldDirty: true })
                }
                className="h-8 text-sm"
              />
            ) : (
              <Textarea
                value={typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    form.setValue(key as never, parsed as never, { shouldDirty: true })
                  } catch {
                    // keep as string if not valid JSON
                  }
                }}
                className="text-sm font-mono min-h-[3rem] resize-y"
                rows={3}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
