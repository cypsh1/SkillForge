import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"
import { highlight } from "sugar-high"
import type {
  ContentBlock,
  ParagraphBlock,
  ListBlock,
  CodeBlock,
  TableBlock,
  BlockquoteBlock,
} from "@/types/content-fragment"

/* ─── Dispatcher ─── */

export function FragmentBlock({
  block,
  editing,
  onUpdate,
  fieldId,
}: {
  block: ContentBlock
  editing: boolean
  onUpdate: (updated: ContentBlock) => void
  fieldId?: string
}) {
  const content = (() => {
    switch (block.type) {
      case "paragraph":
        return (
          <ParagraphFragment
            block={block}
            editing={editing}
            onUpdate={onUpdate}
          />
        )
      case "list":
        return (
          <ListFragment block={block} editing={editing} onUpdate={onUpdate} />
        )
      case "code":
        return <CodeFragment block={block} />
      case "table":
        return <TableFragment block={block} />
      case "blockquote":
        return (
          <BlockquoteFragment
            block={block}
            editing={editing}
            onUpdate={onUpdate}
          />
        )
      case "thematicBreak":
        return <hr className="border-border my-2" />
      case "html":
        return (
          <div className="ecard">
            <pre className="sh-code whitespace-pre-wrap text-muted-foreground">
              {block.value}
            </pre>
          </div>
        )
    }
  })()
  return fieldId ? <div data-field={fieldId}>{content}</div> : content
}

/* ─── Paragraph ─── */

function ParagraphFragment({
  block,
  editing,
  onUpdate,
}: {
  block: ParagraphBlock
  editing: boolean
  onUpdate: (b: ContentBlock) => void
}) {
  const handleChange = useCallback(
    (raw: string) => onUpdate({ ...block, raw, text: raw }),
    [block, onUpdate],
  )

  if (editing) {
    return (
      <textarea
        className="fi ft w-full"
        value={block.raw}
        onChange={(e) => handleChange(e.target.value)}
        rows={Math.min(Math.max(block.raw.split("\n").length + 1, 2), 12)}
        style={{ fontFamily: "inherit", fontSize: 11 }}
      />
    )
  }

  return (
    <p className="text-[11px] leading-relaxed whitespace-pre-wrap">
      {block.text}
    </p>
  )
}

/* ─── List ─── */

function ListFragment({
  block,
  editing,
  onUpdate,
}: {
  block: ListBlock
  editing: boolean
  onUpdate: (b: ContentBlock) => void
}) {
  const { t } = useTranslation()
  const updateItem = useCallback(
    (index: number, value: string) => {
      const items = [...block.items]
      items[index] = value
      const raw = items
        .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
        .join("\n")
      onUpdate({ ...block, items, raw })
    },
    [block, onUpdate],
  )

  const addItem = useCallback(() => {
    const items = [...block.items, ""]
    const raw = items
      .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
      .join("\n")
    onUpdate({ ...block, items, raw })
  }, [block, onUpdate])

  const removeItem = useCallback(
    (index: number) => {
      const items = block.items.filter((_, i) => i !== index)
      const raw = items
        .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
        .join("\n")
      onUpdate({ ...block, items, raw })
    },
    [block, onUpdate],
  )

  if (editing) {
    return (
      <div className="space-y-0.5 pl-4">
        {block.items.map((item, i) => (
          <div key={i} className="fl-item">
            <span className="text-[9px] text-muted-foreground w-4 shrink-0 text-right mr-1">
              {block.ordered ? `${i + 1}.` : "•"}
            </span>
            <input
              className="fi flex-1"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={t("workspace.action.listItemPlaceholder")}
            />
            <button
              type="button"
              className="et-del"
              onClick={() => removeItem(i)}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button type="button" className="fl-add" onClick={addItem}>
          <Plus size={12} />
          <span>{t("workspace.action.addItem")}</span>
        </button>
      </div>
    )
  }

  const Tag = block.ordered ? "ol" : "ul"
  return (
    <Tag
      className="text-[11px] leading-relaxed pl-4"
      style={{ listStyleType: block.ordered ? "decimal" : "disc" }}
    >
      {block.items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  )
}

/* ─── Code (read-only) ─── */

function CodeFragment({ block }: { block: CodeBlock }) {
  const html = useMemo(() => highlight(block.value), [block.value])
  return (
    <div className="ecard relative">
      {block.lang && (
        <span className="absolute top-1 right-2 text-[9px] text-muted-foreground">
          {block.lang}
        </span>
      )}
      <pre className="sh-code">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}

/* ─── Table (read-only) ─── */

function TableFragment({ block }: { block: TableBlock }) {
  return (
    <div className="ecard overflow-x-auto">
      <table className="text-[10px] w-full">
        <thead>
          <tr>
            {block.headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-2 py-1 border-b border-border font-medium text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1 border-b border-border">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Blockquote ─── */

function BlockquoteFragment({
  block,
  editing,
  onUpdate,
}: {
  block: BlockquoteBlock
  editing: boolean
  onUpdate: (b: ContentBlock) => void
}) {
  const handleChange = useCallback(
    (text: string) => {
      const raw = text
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n")
      onUpdate({ ...block, text, raw })
    },
    [block, onUpdate],
  )

  if (editing) {
    return (
      <div className="border-l-2 border-muted-foreground/30 pl-3">
        <textarea
          className="fi ft w-full"
          value={block.text}
          onChange={(e) => handleChange(e.target.value)}
          rows={Math.min(Math.max(block.text.split("\n").length + 1, 2), 8)}
          style={{ fontSize: 11 }}
        />
      </div>
    )
  }

  return (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 text-[11px] text-muted-foreground italic">
      {block.text}
    </blockquote>
  )
}
