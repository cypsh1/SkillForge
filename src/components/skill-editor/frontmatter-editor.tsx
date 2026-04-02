import { useCallback, type ChangeEvent } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { EnvVarDefinition, SkillFrontmatter } from "@/types/skill"

export interface FrontmatterEditorProps {
  frontmatter: SkillFrontmatter
  onChange: (updated: SkillFrontmatter) => void
}

export function FrontmatterEditor({
  frontmatter,
  onChange,
}: FrontmatterEditorProps) {
  const envList = frontmatter.env ?? []

  const handleNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...frontmatter, name: e.target.value })
    },
    [frontmatter, onChange],
  )

  const handleDescriptionChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value
      onChange({
        ...frontmatter,
        description: v === "" ? undefined : v,
      })
    },
    [frontmatter, onChange],
  )

  const handleVersionChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      onChange({
        ...frontmatter,
        version: v === "" ? undefined : v,
      })
    },
    [frontmatter, onChange],
  )

  const handleHomepageChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      onChange({
        ...frontmatter,
        homepage: v === "" ? undefined : v,
      })
    },
    [frontmatter, onChange],
  )

  const handleSourceChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      onChange({
        ...frontmatter,
        source: v === "" ? undefined : v,
      })
    },
    [frontmatter, onChange],
  )

  const updateEnv = useCallback(
    (index: number, patch: Partial<EnvVarDefinition>) => {
      const next = [...envList]
      next[index] = { ...next[index], ...patch }
      onChange({ ...frontmatter, env: next })
    },
    [envList, frontmatter, onChange],
  )

  const addEnv = useCallback(() => {
    onChange({
      ...frontmatter,
      env: [
        ...envList,
        { name: "", required: false, description: "" },
      ],
    })
  }, [envList, frontmatter, onChange])

  const removeEnv = useCallback(
    (index: number) => {
      const next = envList.filter((_, i) => i !== index)
      onChange({
        ...frontmatter,
        env: next.length > 0 ? next : undefined,
      })
    },
    [envList, frontmatter, onChange],
  )

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-1.5">
            <Label htmlFor="fm-name" className="text-sm text-muted-foreground">
              名称
            </Label>
            <Input
              id="fm-name"
              value={frontmatter.name}
              onChange={handleNameChange}
              className="h-8 text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fm-desc" className="text-sm text-muted-foreground">
              描述
            </Label>
            <Textarea
              id="fm-desc"
              value={frontmatter.description ?? ""}
              onChange={handleDescriptionChange}
              rows={3}
              className="text-sm min-h-[4.5rem] resize-y"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fm-version" className="text-sm text-muted-foreground">
                版本
              </Label>
              <Input
                id="fm-version"
                value={frontmatter.version ?? ""}
                onChange={handleVersionChange}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fm-homepage" className="text-sm text-muted-foreground">
                主页
              </Label>
              <Input
                id="fm-homepage"
                value={frontmatter.homepage ?? ""}
                onChange={handleHomepageChange}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fm-source" className="text-sm text-muted-foreground">
              源码
            </Label>
            <Input
              id="fm-source"
              value={frontmatter.source ?? ""}
              onChange={handleSourceChange}
              className="h-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-sm font-medium">环境变量</CardTitle>
            <Badge variant="secondary" className="text-xs font-normal">
              {envList.length}
            </Badge>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={addEnv}
          >
            <Plus className="size-3.5" />
            添加
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {envList.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无环境变量</p>
          ) : (
            envList.map((item, index) => (
              <div key={index}>
                {index > 0 ? <Separator className="mb-3" /> : null}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`fm-env-name-${index}`}
                          className="text-sm text-muted-foreground"
                        >
                          名称
                        </Label>
                        <Input
                          id={`fm-env-name-${index}`}
                          value={item.name}
                          onChange={(e) =>
                            updateEnv(index, { name: e.target.value })
                          }
                          className="h-8 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`fm-env-desc-${index}`}
                          className="text-sm text-muted-foreground"
                        >
                          描述
                        </Label>
                        <Input
                          id={`fm-env-desc-${index}`}
                          value={item.description}
                          onChange={(e) =>
                            updateEnv(index, { description: e.target.value })
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 pt-6 sm:flex-row sm:items-center sm:pt-0">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`fm-env-req-${index}`}
                          className="text-sm text-muted-foreground whitespace-nowrap"
                        >
                          必填
                        </Label>
                        <Switch
                          id={`fm-env-req-${index}`}
                          checked={item.required}
                          onCheckedChange={(checked) =>
                            updateEnv(index, { required: checked })
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeEnv(index)}
                        aria-label="移除"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
