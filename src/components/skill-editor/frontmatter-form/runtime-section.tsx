import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TagInput } from "@/components/ui/tag-input"
import type { SkillFrontmatter } from "@/types/skill"
import {
  getOpenclawMetadata,
  setOpenclawMetadata,
  type OpenclawMetadata,
} from "@/lib/schemas/frontmatter-schema"

export function RuntimeSection() {
  const { t } = useTranslation()
  const form = useFormContext<SkillFrontmatter>()
  const metadata = form.watch("metadata")
  const ocMeta = getOpenclawMetadata(metadata) ?? {}
  const requires = ocMeta.requires ?? {}

  const updateOcMeta = (patch: Partial<OpenclawMetadata>) => {
    const updated = { ...ocMeta, ...patch }
    form.setValue("metadata", setOpenclawMetadata(metadata, updated), { shouldDirty: true })
  }

  const updateRequires = (patch: Partial<NonNullable<OpenclawMetadata["requires"]>>) => {
    updateOcMeta({ requires: { ...requires, ...patch } })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t("form.runtime.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">{t("form.runtime.requiredBins")}</Label>
          <TagInput
            value={requires.bins ?? []}
            onChange={(val) => updateRequires({ bins: val.length > 0 ? val : undefined })}
            placeholder={t("form.runtime.requiredBinsPlaceholder")}
          />
          <p className="text-[0.8rem] text-muted-foreground">{t("form.runtime.requiredBinsDesc")}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">{t("form.runtime.requiredEnv")}</Label>
          <TagInput
            value={requires.env ?? []}
            onChange={(val) => updateRequires({ env: val.length > 0 ? val : undefined })}
            placeholder={t("form.runtime.requiredEnvPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">{t("form.runtime.requiredConfig")}</Label>
          <TagInput
            value={requires.config ?? []}
            onChange={(val) => updateRequires({ config: val.length > 0 ? val : undefined })}
            placeholder={t("form.runtime.requiredConfigPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">{t("form.runtime.optionalBins")}</Label>
          <TagInput
            value={ocMeta.optionalBins ?? []}
            onChange={(val) => updateOcMeta({ optionalBins: val.length > 0 ? val : undefined })}
            placeholder={t("form.runtime.optionalBinsPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">{t("form.runtime.osRestrictions")}</Label>
          <TagInput
            value={(ocMeta.os as string[]) ?? []}
            onChange={(val) =>
              updateOcMeta({ os: val.length > 0 ? (val as OpenclawMetadata["os"]) : undefined })
            }
            placeholder={t("form.runtime.osRestrictionsPlaceholder")}
          />
          <p className="text-[0.8rem] text-muted-foreground">{t("form.runtime.osRestrictionsDesc")}</p>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md border p-3">
          <div>
            <Label className="text-sm">{t("form.runtime.alwaysActive")}</Label>
            <p className="text-xs text-muted-foreground">{t("form.runtime.alwaysActiveDesc")}</p>
          </div>
          <Switch
            checked={ocMeta.always ?? false}
            onCheckedChange={(checked) => updateOcMeta({ always: checked || undefined })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
