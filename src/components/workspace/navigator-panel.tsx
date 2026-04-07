import { useMemo, useState, type ReactNode } from "react"
import {
  Search,
  ChevronRight,
  ChevronDown,
  FileText,
  Settings,
  FolderOpen,
  Plus,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { SkillWizard } from "@/components/skill-wizard/skill-wizard"
import { useWorkspace } from "@/hooks/use-workspace"
import { cn } from "@/lib/utils"
import type { NavigatorSelection } from "@/types/workspace"
import type { ParsedSkill } from "@/types/skill"

function selectionMatches(
  current: NavigatorSelection | null,
  skillId: string,
  nodeType: NavigatorSelection["nodeType"],
  filePath?: string,
): boolean {
  if (!current || current.skillId !== skillId || current.nodeType !== nodeType) return false
  if (nodeType === "config-file") return current.filePath === filePath
  return true
}

function configFileDescription(filePath: string, data: unknown): string {
  const base = filePath.split("/").pop() ?? filePath
  if (base === "sources.json" && Array.isArray(data)) {
    return `${data.length}个数据源`
  }
  if (base === "topics.json") {
    return "主题与关键词"
  }
  if (base === "schema.json") {
    return "结构定义"
  }
  if (Array.isArray(data)) {
    return `${data.length} 项`
  }
  if (data && typeof data === "object") {
    return `${Object.keys(data as object).length} 项`
  }
  return ""
}

function sortConfigPaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => a.localeCompare(b, "en"))
}

export function NavigatorPanel() {
  const { state, select } = useWorkspace()
  const { skills, selection } = state

  const [query, setQuery] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const id = skills[0]?.id
    return id ? new Set([id]) : new Set()
  })

  const filteredSkills = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return skills
    return skills.filter((s) => {
      const name = (s.frontmatter.name || s.id).toLowerCase()
      const desc = (s.description || "").toLowerCase()
      return name.includes(q) || desc.includes(q) || s.id.toLowerCase().includes(q)
    })
  }, [skills, query])

  const toggleExpand = (skillId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(skillId)) next.delete(skillId)
      else next.add(skillId)
      return next
    })
  }

  const [wizardOpen, setWizardOpen] = useState(false)

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-[18px] -translate-y-1/2" />
          <Input
            type="search"
            placeholder="搜索 Skill…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 pl-8"
            aria-label="搜索 Skill"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="创建新技能"
          onClick={() => setWizardOpen(true)}
        >
          <Plus className="size-[18px]" />
        </Button>
      </div>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">创建新技能</DialogTitle>
          <SkillWizard
            onClose={() => setWizardOpen(false)}
            onCreated={() => setWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <ScrollArea className="min-h-0 flex-1 overflow-hidden">
        <div className="space-y-0.5 p-2 pr-3">
          {filteredSkills.map((skill) => (
            <SkillTreeBlock
              key={skill.id}
              skill={skill}
              expanded={expandedIds.has(skill.id)}
              onToggleExpand={() => toggleExpand(skill.id)}
              selection={selection}
              select={select}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface SkillTreeBlockProps {
  skill: ParsedSkill
  expanded: boolean
  onToggleExpand: () => void
  selection: NavigatorSelection | null
  select: (sel: NavigatorSelection) => void
}

function SkillTreeBlock({
  skill,
  expanded,
  onToggleExpand,
  selection,
  select,
}: SkillTreeBlockProps) {
  const name = skill.frontmatter.name || skill.id
  const version = skill.frontmatter.version
  const isSelected = selectionMatches(selection, skill.id, "skill-overview")

  const handleClick = () => {
    onToggleExpand()
    select({ skillId: skill.id, nodeType: "skill-overview" })
  }

  return (
    <div className="rounded-md">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full items-start gap-1 rounded-md px-1.5 py-1.5 text-left text-xs transition-colors",
          isSelected ? "bg-accent" : "hover:bg-muted/60",
        )}
      >
        <span className="text-muted-foreground mt-0.5 shrink-0">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="truncate font-medium">{name}</span>
            {version ? (
              <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px] font-normal">
                v{version}
              </Badge>
            ) : null}
          </span>
          {skill.description ? (
            <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{skill.description}</p>
          ) : null}
        </span>
      </button>

      {expanded ? (
        <div className="border-border ml-2 border-l pl-2">
          <TreeNode
            selected={selectionMatches(selection, skill.id, "skill-md")}
            onClick={() => select({ skillId: skill.id, nodeType: "skill-md" })}
            icon={<FileText className="size-3.5 shrink-0" />}
            label="SKILL.md"
            description="身份信息与指令"
          />
          {skill.hasConfig ? (
            <ConfigSubtree skill={skill} selection={selection} select={select} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}


interface TreeNodeProps {
  selected: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  description: string
}

function TreeNode({ selected, onClick, icon, label, description }: TreeNodeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-xs transition-colors",
        selected && "bg-accent",
        !selected && "hover:bg-muted/60",
      )}
    >
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {description ? (
          <span className="text-muted-foreground block truncate text-[11px]">{description}</span>
        ) : null}
      </span>
    </button>
  )
}

interface ConfigSubtreeProps {
  skill: ParsedSkill
  selection: NavigatorSelection | null
  select: (sel: NavigatorSelection) => void
}

function ConfigSubtree({ skill, selection, select }: ConfigSubtreeProps) {
  const paths = sortConfigPaths(Object.keys(skill.configFiles))

  return (
    <div className="space-y-0.5">
      <div className="text-muted-foreground flex items-center gap-1.5 px-1.5 py-1 text-xs font-medium">
        <FolderOpen className="size-3.5 shrink-0" />
        <span>config/</span>
      </div>
      <div className="border-border ml-1 border-l pl-2">
        {paths.map((filePath) => {
          const data = skill.configFiles[filePath]
          const display =
            filePath.startsWith("config/") ? filePath.slice("config/".length) : filePath
          const desc = configFileDescription(filePath, data)
          return (
            <TreeNode
              key={filePath}
              selected={selectionMatches(selection, skill.id, "config-file", filePath)}
              onClick={() =>
                select({ skillId: skill.id, nodeType: "config-file", filePath })
              }
              icon={<Settings className="size-3.5 shrink-0" />}
              label={display}
              description={desc}
            />
          )
        })}
      </div>
    </div>
  )
}
