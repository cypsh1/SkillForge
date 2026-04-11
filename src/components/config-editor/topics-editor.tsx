import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { SectionBlock } from "@/components/workspace/section-block"

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

const CONFIG_COLOR = "#06b6d4"

export function TopicsEditor({ data, onChange }: TopicsEditorProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Topic[]>([])

  const topics = data.topics

  const handleEdit = useCallback(() => {
    setDraft(structuredClone(topics))
    setEditing(true)
  }, [topics])

  const handleDone = useCallback(() => {
    onChange({ ...data, topics: draft })
    setEditing(false)
  }, [data, draft, onChange])

  const handleCancel = useCallback(() => setEditing(false), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setDraft((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id)
      const newIndex = prev.findIndex((t) => t.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const updateDraftTopic = useCallback((index: number, updates: Partial<Topic>) => {
    setDraft(prev => prev.map((t, i) => i === index ? { ...t, ...updates } : t))
  }, [])

  const updateDraftSearch = useCallback((index: number, updates: Partial<TopicSearch>) => {
    setDraft(prev => prev.map((t, i) =>
      i === index ? { ...t, search: { ...t.search, ...updates } } : t
    ))
  }, [])

  const updateDraftDisplay = useCallback((index: number, updates: Partial<TopicDisplay>) => {
    setDraft(prev => prev.map((t, i) =>
      i === index ? { ...t, display: { ...t.display, ...updates } } : t
    ))
  }, [])

  return (
    <SectionBlock
      sectionId="cfg-topics"
      title={t("workspace.configEditor.topicsCount", { count: topics.length })}
      color={CONFIG_COLOR}
      badge={`${topics.length}`}
      editable
      editing={editing}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onDone={handleDone}
    >
      {editing ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={draft.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {draft.map((topic, index) => (
                <SortableTopicEditCard
                  key={topic.id}
                  topic={topic}
                  onUpdateTopic={(updates) => updateDraftTopic(index, updates)}
                  onUpdateSearch={(updates) => updateDraftSearch(index, updates)}
                  onUpdateDisplay={(updates) => updateDraftDisplay(index, updates)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="ecard">
          {topics.map(topic => (
            <TopicDisplayRow key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </SectionBlock>
  )
}

function TopicDisplayRow({ topic }: { topic: Topic }) {
  const queryCount = topic.search.queries?.length ?? 0
  return (
    <div className="fr">
      <span className="fl" style={{ width: 24, textAlign: "center" }}>{topic.emoji}</span>
      <span className="fv" style={{ flex: "none", fontFamily: "inherit" }}>{topic.label}</span>
      <span className="text-[10px] ml-auto flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
        {queryCount > 0 && <span className="bridge-badge">{queryCount}q</span>}
        <span>{topic.display.style}</span>
      </span>
    </div>
  )
}

function SortableTopicEditCard({
  topic,
  onUpdateTopic,
  onUpdateSearch,
  onUpdateDisplay,
}: {
  topic: Topic
  onUpdateTopic: (updates: Partial<Topic>) => void
  onUpdateSearch: (updates: Partial<TopicSearch>) => void
  onUpdateDisplay: (updates: Partial<TopicDisplay>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: topic.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="mt-1.5 shrink-0 cursor-grab p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <TopicEditCard
            topic={topic}
            onUpdateTopic={onUpdateTopic}
            onUpdateSearch={onUpdateSearch}
            onUpdateDisplay={onUpdateDisplay}
          />
        </div>
      </div>
    </div>
  )
}

function TopicEditCard({
  topic,
  onUpdateTopic,
  onUpdateSearch,
  onUpdateDisplay,
}: {
  topic: Topic
  onUpdateTopic: (updates: Partial<Topic>) => void
  onUpdateSearch: (updates: Partial<TopicSearch>) => void
  onUpdateDisplay: (updates: Partial<TopicDisplay>) => void
}) {
  const { t } = useTranslation()
  const queries = topic.search.queries ?? []

  const setQueryAt = (qi: number, value: string) => {
    const next = [...queries]
    next[qi] = value
    onUpdateSearch({ queries: next })
  }

  const addQuery = () => {
    onUpdateSearch({ queries: [...queries, ""] })
  }

  const removeQuery = (qi: number) => {
    onUpdateSearch({ queries: queries.filter((_, i) => i !== qi) })
  }

  return (
    <div className="ecard" style={{ padding: "6px 6px" }}>
      {/* Header: emoji + label + id */}
      <div className="ef-row">
        <input
          className="fi"
          style={{ width: 40, flex: "none", textAlign: "center" }}
          value={topic.emoji}
          onChange={e => onUpdateTopic({ emoji: e.target.value })}
          aria-label="Emoji"
        />
        <input
          className="fi flex-1"
          value={topic.label}
          onChange={e => onUpdateTopic({ label: e.target.value })}
        />
      </div>
      <p className="text-[9px] font-mono text-muted-foreground px-0.5 mt-0.5 truncate">{topic.id}</p>

      {/* Description */}
      <div className="ef-row ef-row-top mt-1">
        <label className="ef-lbl" style={{ width: 36 }}>{t("workspace.configEditor.description")}</label>
        <textarea
          className="fi flex-1"
          style={{ height: "auto", minHeight: 48, resize: "vertical", lineHeight: 1.5 }}
          value={topic.description}
          onChange={e => onUpdateTopic({ description: e.target.value })}
        />
      </div>

      {/* Search queries */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-muted-foreground">{t("workspace.configEditor.searchKeywords")}</span>
          <button
            type="button"
            className="eb"
            style={{ fontSize: 9 }}
            onClick={addQuery}
          >
            + {t("workspace.configEditor.add")}
          </button>
        </div>
        {queries.length === 0 ? (
          <p className="text-[9px] text-muted-foreground px-0.5">{t("workspace.configEditor.noKeywords")}</p>
        ) : (
          <div className="space-y-0.5">
            {queries.map((q, qi) => (
              <div key={`${topic.id}-q-${qi}`} className="ef-row">
                <input
                  className="fi flex-1"
                  value={q}
                  onChange={e => setQueryAt(qi, e.target.value)}
                />
                <button
                  type="button"
                  className="text-[10px] text-muted-foreground hover:text-destructive px-1"
                  onClick={() => removeQuery(qi)}
                  aria-label={t("workspace.configEditor.removeKeyword")}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Display settings */}
      <div className="ef-row mt-2">
        <label className="ef-lbl" style={{ width: 56 }}>max_items</label>
        <input
          type="number"
          min={0}
          className="fi"
          style={{ width: 56, flex: "none" }}
          value={Number.isFinite(topic.display.max_items) ? topic.display.max_items : ""}
          onChange={e => {
            const v = e.target.value === "" ? 0 : Number(e.target.value)
            onUpdateDisplay({ max_items: Number.isNaN(v) ? 0 : v })
          }}
        />
        <label className="ef-lbl" style={{ width: 32 }}>style</label>
        <input
          className="fi flex-1"
          value={topic.display.style}
          onChange={e => onUpdateDisplay({ style: e.target.value })}
        />
      </div>
    </div>
  )
}
