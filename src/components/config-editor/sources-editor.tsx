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
import { CONFIG_COLOR } from "@/lib/bridge-sections"

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

export function SourcesEditor({ data, onChange }: SourcesEditorProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Source[]>([])

  const sources = data.sources

  const handleEdit = useCallback(() => {
    setDraft(structuredClone(sources))
    setEditing(true)
  }, [sources])

  const handleDone = useCallback(() => {
    onChange({ ...data, sources: draft })
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
      const oldIndex = prev.findIndex((s) => s.id === active.id)
      const newIndex = prev.findIndex((s) => s.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const updateDraftSource = useCallback((index: number, updates: Partial<Source>) => {
    setDraft(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s))
  }, [])

  const enabledCount = sources.filter(s => s.enabled).length
  const priorityCount = sources.filter(s => s.priority).length
  const typeGroups = sources.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {})

  return (
    <SectionBlock
      sectionId="cfg-sources"
      title={t("workspace.configEditor.sourcesCount", { count: sources.length })}
      color={CONFIG_COLOR}
      badge={`${enabledCount}/${sources.length}`}
      editable
      editing={editing}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onDone={handleDone}
    >
      <p className="text-[9px] text-muted-foreground mb-1.5 px-0.5">
        {t("workspace.configEditor.enabledCount", { count: enabledCount })}
        {" · "}
        {t("workspace.configEditor.priorityCount", { count: priorityCount })}
        {Object.entries(typeGroups).map(([type, count]) => (
          <span key={type}>{" · "}{type}: {count}</span>
        ))}
      </p>
      {editing ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={draft.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {draft.map((source, index) => (
                <SortableSourceEditCard
                  key={source.id}
                  source={source}
                  onUpdate={(updates) => updateDraftSource(index, updates)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="ecard">
          {sources.map(source => (
            <SourceDisplayRow key={source.id} source={source} />
          ))}
        </div>
      )}
    </SectionBlock>
  )
}

function SourceDisplayRow({ source }: { source: Source }) {
  return (
    <div className="fr">
      <span className="fl" style={{ width: 36 }}>{source.type}</span>
      <span className="fv" style={{ flex: "none" }}>{source.name || source.id}</span>
      <span className="text-[10px] ml-auto flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
        {source.enabled
          ? <span style={{ color: "#10b981" }}>✓</span>
          : <span style={{ opacity: 0.35 }}>—</span>}
        {source.priority && <span style={{ color: "#f59e0b" }}>★</span>}
        {source.topics.length > 0 && (
          <span className="bridge-badge">{source.topics.length}</span>
        )}
      </span>
    </div>
  )
}

function SortableSourceEditCard({
  source,
  onUpdate,
}: {
  source: Source
  onUpdate: (updates: Partial<Source>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: source.id })

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
          <SourceEditCard source={source} onUpdate={onUpdate} />
        </div>
      </div>
    </div>
  )
}

function SourceEditCard({
  source,
  onUpdate,
}: {
  source: Source
  onUpdate: (updates: Partial<Source>) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="ecard" style={{ padding: "6px 6px" }}>
      <div className="ef-row">
        <label className="ef-lbl" style={{ width: 36 }}>{source.type}</label>
        <span className="fv" style={{ opacity: 0.5 }}>{source.id}</span>
      </div>
      <div className="ef-row">
        <label className="ef-lbl" style={{ width: 36 }}>{t("workspace.configEditor.name")}</label>
        <input
          className="fi flex-1"
          value={source.name}
          onChange={e => onUpdate({ name: e.target.value })}
        />
      </div>
      {source.url !== undefined && (
        <div className="ef-row">
          <label className="ef-lbl" style={{ width: 36 }}>URL</label>
          <input
            className="fi flex-1"
            value={source.url}
            onChange={e => onUpdate({ url: e.target.value })}
          />
        </div>
      )}
      {source.handle !== undefined && (
        <div className="ef-row">
          <label className="ef-lbl" style={{ width: 36 }}>{t("workspace.configEditor.handle")}</label>
          <input
            className="fi flex-1"
            value={source.handle}
            onChange={e => onUpdate({ handle: e.target.value })}
          />
        </div>
      )}
      <div className="ef-row">
        <label className="ef-lbl" style={{ width: 36 }}>{t("workspace.configEditor.enabled")}</label>
        <button type="button" className="ftg" onClick={() => onUpdate({ enabled: !source.enabled })}>
          <span className={`ftg-track ${source.enabled ? "on" : ""}`} />
        </button>
        <label className="ef-lbl" style={{ width: 28, marginLeft: 8 }}>{t("workspace.configEditor.priority")}</label>
        <button type="button" className="ftg" onClick={() => onUpdate({ priority: !source.priority })}>
          <span className={`ftg-track ${source.priority ? "on" : ""}`} />
        </button>
      </div>
      {source.topics.length > 0 && (
        <div className="ef-row ef-row-top">
          <label className="ef-lbl" style={{ width: 36 }}>Topics</label>
          <div className="flex flex-wrap gap-1">
            {source.topics.map(topic => (
              <span key={topic} className="bridge-badge">{topic}</span>
            ))}
          </div>
        </div>
      )}
      {source.note && (
        <p className="text-[9px] text-muted-foreground italic px-0.5 mt-0.5">{source.note}</p>
      )}
    </div>
  )
}
