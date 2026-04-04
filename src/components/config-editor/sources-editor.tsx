import { useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface Source {
  id: string
  type: string
  name: string
  enabled: boolean
  priority: boolean
  topics: string[]
  url?: string
  handle?: string
  note?: string
  [key: string]: unknown
}

interface SourcesConfig {
  sources: Source[]
  [key: string]: unknown
}

interface SourcesEditorProps {
  data: SourcesConfig
  onChange: (newData: SourcesConfig) => void
}

const TYPE_COLORS: Record<string, string> = {
  rss: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  twitter: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  github: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  reddit: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  web: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

export function SourcesEditor({ data, onChange }: SourcesEditorProps) {
  const sources = data.sources

  const updateSource = useCallback(
    (index: number, updates: Partial<Source>) => {
      const newSources = [...sources]
      newSources[index] = { ...newSources[index], ...updates }
      onChange({ ...data, sources: newSources })
    },
    [sources, data, onChange],
  )

  const enabledCount = sources.filter((s) => s.enabled).length
  const priorityCount = sources.filter((s) => s.priority).length
  const typeGroups = sources.reduce(
    (acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{sources.length} 个数据源</span>
        <span>·</span>
        <span className="text-green-600">{enabledCount} 已启用</span>
        <span>·</span>
        <span className="text-yellow-600">{priorityCount} 高优先级</span>
        <span>·</span>
        {Object.entries(typeGroups).map(([type, count]) => (
          <Badge key={type} variant="secondary" className="text-[10px] px-1.5 py-0">
            {type}: {count}
          </Badge>
        ))}
      </div>

      <div className="rounded-md border p-2">
        <div className="space-y-2">
          {sources.map((source, index) => (
            <SourceCard
              key={source.id}
              source={source}
              onUpdate={(updates) => updateSource(index, updates)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SourceCard({
  source,
  onUpdate,
}: {
  source: Source
  onUpdate: (updates: Partial<Source>) => void
}) {
  return (
    <Card className={`transition-opacity ${source.enabled ? "" : "opacity-50"}`}>
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 shrink-0 ${TYPE_COLORS[source.type] ?? ""}`}
            >
              {source.type}
            </Badge>
            <CardTitle className="text-xs font-mono truncate">
              {source.id}
            </CardTitle>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={`priority-${source.id}`} className="text-[10px] text-muted-foreground">
                优先
              </Label>
              <Switch
                id={`priority-${source.id}`}
                checked={source.priority}
                onCheckedChange={(checked) => onUpdate({ priority: checked })}
                className="scale-75"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor={`enabled-${source.id}`} className="text-[10px] text-muted-foreground">
                启用
              </Label>
              <Switch
                id={`enabled-${source.id}`}
                checked={source.enabled}
                onCheckedChange={(checked) => onUpdate({ enabled: checked })}
                className="scale-75"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-[10px] text-muted-foreground w-10 shrink-0">名称</Label>
          <Input
            value={source.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="h-6 text-xs"
          />
        </div>
        {source.url && (
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground w-10 shrink-0">URL</Label>
            <Input
              value={source.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="h-6 text-xs font-mono"
            />
          </div>
        )}
        {source.handle && (
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground w-10 shrink-0">账号</Label>
            <Input
              value={source.handle}
              onChange={(e) => onUpdate({ handle: e.target.value })}
              className="h-6 text-xs font-mono"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {source.topics.map((topic) => (
            <Badge key={topic} variant="secondary" className="text-[10px] px-1.5 py-0">
              {topic}
            </Badge>
          ))}
        </div>
        {source.note && (
          <p className="text-[10px] text-muted-foreground italic">{source.note}</p>
        )}
      </CardContent>
    </Card>
  )
}
