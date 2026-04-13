import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeftRight, Trash2, Plus, FilePenLine } from "lucide-react"
import type { Change } from "diff"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { AreaDiff } from "@/lib/skill-differ"

interface DiffViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  diffs: AreaDiff[]
  skillName: string
}

function areaLabel(area: string, t: (key: string) => string): string {
  if (area === "frontmatter") return t("workspace.diff.frontmatter")
  if (area === "body") return t("workspace.diff.body")
  return area.split("/").pop() ?? area
}

const statusIcon = {
  modified: FilePenLine,
  added: Plus,
  deleted: Trash2,
} as const

const statusColor = {
  modified: "text-amber-500",
  added: "text-emerald-500",
  deleted: "text-destructive",
} as const

function DiffLines({ hunks }: { hunks: Change[] }) {
  let oldLine = 1
  let newLine = 1

  return (
    <div className="font-mono text-xs leading-5 select-text">
      {hunks.map((hunk, hi) => {
        const lines = hunk.value.replace(/\n$/, "").split("\n")
        return lines.map((line, li) => {
          let oldNum: number | null = null
          let newNum: number | null = null
          let prefix = " "
          let rowClass = ""

          if (hunk.added) {
            newNum = newLine++
            prefix = "+"
            rowClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          } else if (hunk.removed) {
            oldNum = oldLine++
            prefix = "-"
            rowClass = "bg-destructive/10 text-destructive"
          } else {
            oldNum = oldLine++
            newNum = newLine++
            rowClass = ""
          }

          return (
            <div
              key={`${hi}-${li}`}
              className={cn("flex min-h-5 hover:bg-muted/30", rowClass)}
            >
              <span className="w-10 shrink-0 select-none pr-1 text-right text-muted-foreground/50">
                {oldNum ?? ""}
              </span>
              <span className="w-10 shrink-0 select-none pr-1 text-right text-muted-foreground/50">
                {newNum ?? ""}
              </span>
              <span className="w-4 shrink-0 select-none text-center opacity-60">
                {prefix}
              </span>
              <span className="flex-1 whitespace-pre-wrap break-all pr-2">
                {line}
              </span>
            </div>
          )
        })
      })}
    </div>
  )
}

export function DiffViewer({ open, onOpenChange, diffs, skillName }: DiffViewerProps) {
  const { t } = useTranslation()
  const [selectedIdx, setSelectedIdx] = useState(0)

  const selected = diffs[selectedIdx] ?? diffs[0]

  const totalStats = useMemo(() => {
    let added = 0
    let removed = 0
    for (const d of diffs) {
      added += d.stats.added
      removed += d.stats.removed
    }
    return { added, removed }
  }, [diffs])

  if (diffs.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl max-h-[80vh] flex flex-col gap-0 p-0"
        showCloseButton
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="size-4 text-muted-foreground" />
            <DialogTitle>{t("workspace.diff.title")}</DialogTitle>
            <span className="text-xs text-muted-foreground">{skillName}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {totalStats.added > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">+{totalStats.added}</span>
            )}
            {totalStats.removed > 0 && (
              <span className="text-destructive">-{totalStats.removed}</span>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* File list */}
          <div className="w-48 shrink-0 border-r overflow-y-auto">
            {diffs.map((d, i) => {
              const Icon = statusIcon[d.status]
              return (
                <button
                  key={d.area}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50",
                    i === selectedIdx && "bg-muted"
                  )}
                  onClick={() => setSelectedIdx(i)}
                >
                  <Icon className={cn("size-3.5 shrink-0", statusColor[d.status])} />
                  <span className="truncate">{areaLabel(d.area, t)}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {d.stats.added > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{d.stats.added}</span>}
                    {d.stats.added > 0 && d.stats.removed > 0 && " "}
                    {d.stats.removed > 0 && <span className="text-destructive">-{d.stats.removed}</span>}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Diff content */}
          <div className="flex-1 overflow-auto bg-muted/20">
            {selected && (
              <div className="border-b bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                <span className="font-medium text-foreground">{areaLabel(selected.area, t)}</span>
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                  selected.status === "modified" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                  selected.status === "added" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  selected.status === "deleted" && "bg-destructive/10 text-destructive",
                )}>
                  {t(`workspace.diff.${selected.status}`)}
                </span>
              </div>
            )}
            {selected && <DiffLines hunks={selected.hunks} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
