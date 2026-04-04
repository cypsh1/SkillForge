import { useCallback } from "react"
import { GripVertical, Plus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

export interface TopicSearch {
  queries: string[]
  twitter_queries?: string[]
  must_include?: string[]
  exclude?: string[]
  [key: string]: unknown
}

export interface TopicDisplay {
  max_items: number
  style: string
  [key: string]: unknown
}

export interface Topic {
  id: string
  emoji: string
  label: string
  description: string
  search: TopicSearch
  display: TopicDisplay
  [key: string]: unknown
}

export interface TopicsConfig {
  topics: Topic[]
  [key: string]: unknown
}

export interface TopicsEditorProps {
  data: TopicsConfig
  onChange: (newData: TopicsConfig) => void
}

export function TopicsEditor({ data, onChange }: TopicsEditorProps) {
  const topics = data.topics

  const updateTopic = useCallback(
    (index: number, updates: Partial<Topic>) => {
      const newTopics = [...topics]
      newTopics[index] = { ...newTopics[index], ...updates }
      onChange({ ...data, topics: newTopics })
    },
    [topics, data, onChange],
  )

  const updateSearch = useCallback(
    (index: number, updates: Partial<TopicSearch>) => {
      const t = topics[index]
      const nextSearch = { ...t.search, ...updates }
      updateTopic(index, { search: nextSearch })
    },
    [topics, updateTopic],
  )

  const setQueryAt = useCallback(
    (topicIndex: number, queryIndex: number, value: string) => {
      const t = topics[topicIndex]
      const queries = [...(t.search.queries ?? [])]
      queries[queryIndex] = value
      updateSearch(topicIndex, { queries })
    },
    [topics, updateSearch],
  )

  const addQuery = useCallback(
    (topicIndex: number) => {
      const t = topics[topicIndex]
      const queries = [...(t.search.queries ?? []), ""]
      updateSearch(topicIndex, { queries })
    },
    [topics, updateSearch],
  )

  const removeQuery = useCallback(
    (topicIndex: number, queryIndex: number) => {
      const t = topics[topicIndex]
      const queries = (t.search.queries ?? []).filter((_, i) => i !== queryIndex)
      updateSearch(topicIndex, { queries })
    },
    [topics, updateSearch],
  )

  const updateDisplay = useCallback(
    (index: number, updates: Partial<TopicDisplay>) => {
      const t = topics[index]
      updateTopic(index, { display: { ...t.display, ...updates } })
    },
    [topics, updateTopic],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{topics.length} 个主题</span>
      </div>

      <div className="rounded-md border p-2">
        <div className="space-y-2">
          {topics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onUpdateTopic={(updates) => updateTopic(index, updates)}
              onSetQueryAt={(qi, value) => setQueryAt(index, qi, value)}
              onAddQuery={() => addQuery(index)}
              onRemoveQuery={(qi) => removeQuery(index, qi)}
              onUpdateDisplay={(updates) => updateDisplay(index, updates)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TopicCard({
  topic,
  onUpdateTopic,
  onSetQueryAt,
  onAddQuery,
  onRemoveQuery,
  onUpdateDisplay,
}: {
  topic: Topic
  onUpdateTopic: (updates: Partial<Topic>) => void
  onSetQueryAt: (queryIndex: number, value: string) => void
  onAddQuery: () => void
  onRemoveQuery: (queryIndex: number) => void
  onUpdateDisplay: (updates: Partial<TopicDisplay>) => void
}) {
  const queries = topic.search.queries ?? []

  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <div className="flex items-start gap-2">
          <GripVertical
            className="size-4 shrink-0 text-muted-foreground mt-2"
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-1.5">
              <CardTitle className="text-[10px] font-medium text-muted-foreground">主题标签</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={topic.emoji}
                  onChange={(e) => onUpdateTopic({ emoji: e.target.value })}
                  className="h-8 w-14 text-center text-sm shrink-0"
                  aria-label="Emoji"
                />
                <Input
                  value={topic.label}
                  onChange={(e) => onUpdateTopic({ label: e.target.value })}
                  className="h-8 flex-1 min-w-[8rem] text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground truncate" title={topic.id}>
              {topic.id}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`desc-${topic.id}`} className="text-[10px] text-muted-foreground">
            描述
          </Label>
          <Textarea
            id={`desc-${topic.id}`}
            value={topic.description}
            onChange={(e) => onUpdateTopic({ description: e.target.value })}
            className="min-h-[72px] text-xs resize-y"
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-[10px] text-muted-foreground">搜索关键词</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1"
              onClick={onAddQuery}
            >
              <Plus className="size-3.5" />
              添加
            </Button>
          </div>
          <div className="space-y-1.5">
            {queries.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">暂无关键词，点击「添加」。</p>
            ) : (
              queries.map((q, qi) => (
                <div key={`${topic.id}-q-${qi}`} className="flex items-center gap-1.5">
                  <Input
                    value={q}
                    onChange={(e) => onSetQueryAt(qi, e.target.value)}
                    className="h-7 text-xs font-mono flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveQuery(qi)}
                    aria-label="移除关键词"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-[10px] text-muted-foreground">显示设置</Label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Label htmlFor={`max-${topic.id}`} className="text-[10px] text-muted-foreground whitespace-nowrap">
                max_items
              </Label>
              <Input
                id={`max-${topic.id}`}
                type="number"
                min={0}
                value={Number.isFinite(topic.display.max_items) ? topic.display.max_items : ""}
                onChange={(e) => {
                  const v = e.target.value === "" ? 0 : Number(e.target.value)
                  onUpdateDisplay({ max_items: Number.isNaN(v) ? 0 : v })
                }}
                className="h-7 w-20 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Label htmlFor={`style-${topic.id}`} className="text-[10px] text-muted-foreground whitespace-nowrap">
                style
              </Label>
              <Input
                id={`style-${topic.id}`}
                value={topic.display.style}
                onChange={(e) => onUpdateDisplay({ style: e.target.value })}
                className="h-7 text-xs flex-1 min-w-[6rem]"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
