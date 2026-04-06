import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SkillFrontmatter } from "@/types/skill"

export function BasicInfoSection() {
  const { t } = useTranslation()
  const form = useFormContext<SkillFrontmatter>()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t("form.basicInfo.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-muted-foreground">{t("form.basicInfo.name")}</FormLabel>
              <FormControl>
                <Input {...field} className="h-8 text-sm font-mono" placeholder={t("form.basicInfo.namePlaceholder")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-muted-foreground">{t("form.basicInfo.description")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  className="text-sm min-h-[4.5rem] resize-y"
                  placeholder={t("form.basicInfo.descriptionPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">{t("form.basicInfo.version")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className="h-8 text-sm" placeholder={t("form.basicInfo.versionPlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emoji"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">{t("form.basicInfo.emoji")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className="h-8 text-sm" placeholder={t("form.basicInfo.emojiPlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">{t("form.basicInfo.author")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className="h-8 text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="homepage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">{t("form.basicInfo.homepage")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className="h-8 text-sm" placeholder={t("form.basicInfo.homepagePlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-muted-foreground">{t("form.basicInfo.source")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} className="h-8 text-sm" placeholder={t("form.basicInfo.sourcePlaceholder")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
