import { useState } from "react"
import { Plus, X, ChevronDown } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { TagInput } from "@/components/ui/tag-input"
import type { SkillFrontmatter } from "@/types/skill"
import {
  getOpenclawMetadata,
  setOpenclawMetadata,
  type InstallSpecData,
  type OpenclawMetadata,
} from "@/lib/schemas/frontmatter-schema"

export function InstallSection() {
  const { t } = useTranslation()
  const form = useFormContext<SkillFrontmatter>()
  const metadata = form.watch("metadata")
  const ocMeta = getOpenclawMetadata(metadata) ?? {}
  const installList = (ocMeta.install ?? []) as InstallSpecData[]
  const [isOpen, setIsOpen] = useState(installList.length > 0)

  const updateInstall = (newList: InstallSpecData[]) => {
    const updated: OpenclawMetadata = {
      ...ocMeta,
      install: newList.length > 0 ? newList : undefined,
    }
    form.setValue("metadata", setOpenclawMetadata(metadata, updated), { shouldDirty: true })
  }

  const addItem = () => {
    updateInstall([...installList, { kind: "brew", formula: "", bins: [] }])
    setIsOpen(true)
  }

  const removeItem = (index: number) => {
    updateInstall(installList.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, patch: Partial<InstallSpecData>) => {
    const next = [...installList]
    next[index] = { ...next[index], ...patch }
    updateInstall(next)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CollapsibleTrigger className="flex items-center gap-2">
            <ChevronDown className="size-4 transition-transform [[data-open]_&]:rotate-180" />
            <CardTitle className="text-sm font-medium">{t("form.install.title")}</CardTitle>
            <Badge variant="secondary" className="text-xs font-normal">
              {installList.length}
            </Badge>
          </CollapsibleTrigger>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="size-3.5" />
            {t("form.install.add")}
          </Button>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {installList.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("form.install.empty")}</p>
            ) : (
              installList.map((item, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="mb-3" />}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-sm text-muted-foreground">{t("form.install.kind")}</Label>
                          <Input
                            value={item.kind ?? ""}
                            onChange={(e) => updateItem(index, { kind: e.target.value })}
                            className="h-8 text-sm"
                            placeholder={t("form.install.kindPlaceholder")}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm text-muted-foreground">{t("form.install.package")}</Label>
                          <Input
                            value={item.formula ?? item.package ?? ""}
                            onChange={(e) => updateItem(index, { formula: e.target.value })}
                            className="h-8 text-sm"
                            placeholder={t("form.install.packagePlaceholder")}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm text-muted-foreground">{t("form.install.label")}</Label>
                          <Input
                            value={item.label ?? ""}
                            onChange={(e) => updateItem(index, { label: e.target.value || undefined })}
                            className="h-8 text-sm"
                            placeholder={t("form.install.labelPlaceholder")}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">{t("form.install.bins")}</Label>
                      <TagInput
                        value={item.bins ?? []}
                        onChange={(val) => updateItem(index, { bins: val.length > 0 ? val : undefined })}
                        placeholder={t("form.install.binsPlaceholder")}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
