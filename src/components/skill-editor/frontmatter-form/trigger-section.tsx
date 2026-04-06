import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { TagInput } from "@/components/ui/tag-input"
import type { SkillFrontmatter } from "@/types/skill"

function normalizeToArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  if (typeof value === "string") return [value]
  return value
}

export function TriggerSection() {
  const { t } = useTranslation()
  const form = useFormContext<SkillFrontmatter>()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t("form.trigger.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <FormField
          control={form.control}
          name="triggers"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-muted-foreground">{t("form.trigger.keywords")}</FormLabel>
              <FormControl>
                <TagInput
                  value={normalizeToArray(field.value)}
                  onChange={(val) => field.onChange(val.length > 0 ? val : undefined)}
                  placeholder={t("form.trigger.keywordsPlaceholder")}
                />
              </FormControl>
              <FormDescription>{t("form.trigger.keywordsDesc")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="read_when"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-muted-foreground">{t("form.trigger.readWhen")}</FormLabel>
              <FormControl>
                <TagInput
                  value={normalizeToArray(field.value)}
                  onChange={(val) => field.onChange(val.length > 0 ? val : undefined)}
                  placeholder={t("form.trigger.readWhenPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="auto_trigger"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-2 rounded-md border p-3">
                <div>
                  <FormLabel className="text-sm">{t("form.trigger.autoTrigger")}</FormLabel>
                  <FormDescription className="text-xs">{t("form.trigger.autoTriggerDesc")}</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="user-invocable"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-2 rounded-md border p-3">
                <div>
                  <FormLabel className="text-sm">{t("form.trigger.userInvocable")}</FormLabel>
                  <FormDescription className="text-xs">{t("form.trigger.userInvocableDesc")}</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="allowed-tools"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-muted-foreground">{t("form.trigger.allowedTools")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} className="h-8 text-sm" placeholder={t("form.trigger.allowedToolsPlaceholder")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
            <ChevronDown className="size-4 transition-transform [[data-open]_&]:rotate-180" />
            {t("form.trigger.advancedDispatch")}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 pt-2">
              <FormField
                control={form.control}
                name="disable-model-invocation"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-2 rounded-md border p-3">
                    <div>
                      <FormLabel className="text-sm">{t("form.trigger.disableModelInvocation")}</FormLabel>
                      <FormDescription className="text-xs">{t("form.trigger.disableModelInvocationDesc")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="command-dispatch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-muted-foreground">{t("form.trigger.commandDispatch")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} className="h-8 text-sm" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="command-tool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-muted-foreground">{t("form.trigger.commandTool")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} className="h-8 text-sm" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="command-arg-mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">{t("form.trigger.commandArgMode")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} className="h-8 text-sm" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
