import { useFieldArray, useFormContext, type FieldArrayPath } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Plus, X } from "lucide-react"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import type { SkillFrontmatter } from "@/types/skill"

export function EnvVarsSection() {
  const { t } = useTranslation()
  const form = useFormContext<SkillFrontmatter>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "env" as FieldArrayPath<SkillFrontmatter>,
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{t("form.envVars.title")}</CardTitle>
          <Badge variant="secondary" className="text-xs font-normal">
            {fields.length}
          </Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ name: "", required: false, description: "" })}
        >
          <Plus className="size-3.5" />
          {t("form.envVars.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("form.envVars.empty")}</p>
        ) : (
          fields.map((item, index) => (
            <div key={item.id}>
              {index > 0 && <Separator className="mb-3" />}
              <div className="flex items-start gap-2">
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`env.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">{t("form.envVars.name")}</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8 text-sm font-mono" placeholder={t("form.envVars.namePlaceholder")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`env.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">{t("form.envVars.description")}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} className="h-8 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2 pt-6">
                  <FormField
                    control={form.control}
                    name={`env.${index}.required`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="text-sm text-muted-foreground whitespace-nowrap">{t("form.envVars.required")}</FormLabel>
                        <FormControl>
                          <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
