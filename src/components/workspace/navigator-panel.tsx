import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import {
  Search,
  ChevronRight,
  ChevronDown,
  FileText,
  FileCode,
  Settings,
  FolderOpen,
  Terminal,
  Plus,
  Upload,
  ClipboardPaste,
  Trash2,
  Globe,
  Server,
  Cloud,
  Layers,
  ClipboardCheck,
  Download,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SkillWizard } from "@/components/skill-wizard/skill-wizard"
import { ImportDialog } from "@/components/import-dialog/import-dialog"
import { SSHConnectDialog } from "@/components/ssh-panel/ssh-connect-dialog"
import { RemoteSkillList } from "@/components/ssh-panel/remote-skill-list"
import { BatchValidationDialog, BatchExportDialog } from "@/components/workspace/batch-dialog"
import { connectSSH, type ConnectionInfo } from "@/lib/remote-fs"
import { isTauri } from "@/lib/tauri-fs"
import { loadAppConfig } from "@/lib/app-config"
import { useWorkspace } from "@/hooks/use-workspace"
import { parseSkillMd } from "@/lib/skill-parser"
import { cn } from "@/lib/utils"
import { computeChanges, type NavigatorSelection } from "@/types/workspace"
import type { ParsedSkill, ExtraFile } from "@/types/skill"

function selectionMatches(
  current: NavigatorSelection | null,
  skillId: string,
  nodeType: NavigatorSelection["nodeType"],
  filePath?: string,
): boolean {
  if (!current || current.skillId !== skillId || current.nodeType !== nodeType) return false
  if (nodeType === "config-file" || nodeType === "extra-file") return current.filePath === filePath
  return true
}

function configFileDescription(filePath: string, data: unknown, t: TFunction): string {
  const base = filePath.split("/").pop() ?? filePath
  if (base === "sources.json" && Array.isArray(data)) {
    return t("workspace.nav.configSourcesCount", { count: data.length })
  }
  if (base === "topics.json") {
    return t("workspace.nav.configTopicsHint")
  }
  if (base === "schema.json") {
    return t("workspace.nav.configSchemaHint")
  }
  if (Array.isArray(data)) {
    return t("workspace.nav.itemsCount", { count: data.length })
  }
  if (data && typeof data === "object") {
    return t("workspace.nav.itemsCount", { count: Object.keys(data as object).length })
  }
  return ""
}

function sortConfigPaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => a.localeCompare(b, "en"))
}

function extraFileIcon(type: ExtraFile["type"]) {
  switch (type) {
    case "json":
      return <Settings className="size-[14px] shrink-0" />
    case "python":
      return <FileCode className="size-[14px] shrink-0" />
    case "shell":
      return <Terminal className="size-[14px] shrink-0" />
    case "markdown":
      return <FileText className="size-[14px] shrink-0" />
    default:
      return <FileText className="size-[14px] shrink-0" />
  }
}

function extraFileDescription(file: ExtraFile, t: TFunction): string {
  switch (file.path) {
    case "_meta.json":
      return t("workspace.nav.fileMeta")
    case "metadata.json":
      return t("workspace.nav.fileMeta")
    case "CHANGELOG.md":
      return t("workspace.nav.fileChangelog")
    case "README.md":
      return t("workspace.nav.fileReadme")
    case "README_CN.md":
      return t("workspace.nav.fileReadmeCn")
    case "CONTRIBUTING.md":
      return t("workspace.nav.fileContributing")
    case "requirements.txt":
      return t("workspace.nav.fileRequirements")
    default:
      break
  }
  if (file.path.startsWith(".clawhub/")) return t("workspace.nav.fileClawhub")
  if (file.type === "python") return t("workspace.nav.filePythonScript")
  if (file.type === "shell") return t("workspace.nav.fileShellScript")
  if (file.type === "json") return t("workspace.nav.fileJsonData")
  if (file.type === "markdown") return t("workspace.nav.fileMarkdownDoc")
  return t("workspace.nav.fileAttached")
}

function deduplicateId(id: string, existingIds: string[]): string {
  if (!existingIds.includes(id)) return id
  let n = 2
  while (existingIds.includes(`${id}-${n}`)) n++
  return `${id}-${n}`
}

export function NavigatorPanel() {
  const { t } = useTranslation()
  const { state, select, addSkill, removeSkill, removeConfigFile, removeExtraFile } = useWorkspace()
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
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [sshDialogOpen, setSSHDialogOpen] = useState(false)
  const [sshBrowserOpen, setSSHBrowserOpen] = useState(false)
  const [sshConnection, setSSHConnection] = useState<ConnectionInfo | null>(null)
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false)
  const [pasteContent, setPasteContent] = useState("")
  const [pasteError, setPasteError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteFileTarget, setDeleteFileTarget] = useState<{
    skillId: string
    path: string
    type: "config" | "extra"
  } | null>(null)
  const [uploadError, setUploadError] = useState("")
  const [batchValidateOpen, setBatchValidateOpen] = useState(false)
  const [batchExportOpen, setBatchExportOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-reconnect SSH on mount if saved config exists
  useEffect(() => {
    if (!isTauri()) return
    let cancelled = false
    loadAppConfig().then(async (config) => {
      const saved = config.sshConnections[0]
      if (!saved || cancelled) return
      try {
        const info = await connectSSH(saved)
        if (!cancelled) setSSHConnection(info)
      } catch {
        // Silent fail — user can manually connect later
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const existingIds = useMemo(() => skills.map((s) => s.id), [skills])

  const importSkillFromContent = useCallback(
    (content: string, filename: string) => {
      try {
        const rawId = filename.replace(/\.md$/i, "").replace(/\s+/g, "-").toLowerCase()
        const skill = parseSkillMd(content, rawId, "")
        skill.id = deduplicateId(skill.frontmatter.name || rawId, existingIds)
        addSkill(skill)
        return null
      } catch {
        return t("workspace.nav.parseError")
      }
    },
    [existingIds, addSkill, t],
  )

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUploadError("")
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.name.endsWith(".md")) {
        setUploadError(t("workspace.nav.selectMdFile"))
        e.target.value = ""
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const err = importSkillFromContent(reader.result as string, file.name)
        if (err) setUploadError(err)
      }
      reader.onerror = () => setUploadError(t("workspace.nav.fileReadFailed"))
      reader.readAsText(file)
      e.target.value = ""
    },
    [importSkillFromContent, t],
  )

  const handlePasteConfirm = useCallback(() => {
    setPasteError("")
    const trimmed = pasteContent.trim()
    if (!trimmed) {
      setPasteError(t("workspace.nav.emptyContent"))
      return
    }
    const err = importSkillFromContent(trimmed, "pasted-skill.md")
    if (err) {
      setPasteError(err)
      return
    }
    setPasteContent("")
    setPasteDialogOpen(false)
  }, [pasteContent, importSkillFromContent, t])

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      removeSkill(deleteTarget.id)
      setDeleteTarget(null)
    }
  }, [deleteTarget, removeSkill])

  const handleConfirmDeleteFile = useCallback(() => {
    if (!deleteFileTarget) return
    if (deleteFileTarget.type === "config") {
      removeConfigFile(deleteFileTarget.skillId, deleteFileTarget.path)
    } else {
      removeExtraFile(deleteFileTarget.skillId, deleteFileTarget.path)
    }
    setDeleteFileTarget(null)
  }, [deleteFileTarget, removeConfigFile, removeExtraFile])

  const handleDeleteFile = useCallback(
    (skillId: string, path: string, type: "config" | "extra") => {
      setDeleteFileTarget({ skillId, path, type })
    },
    [],
  )

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-[16px] -translate-y-1/2" />
          <Input
            type="search"
            placeholder={t("workspace.nav.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
            aria-label={t("workspace.nav.searchPlaceholder")}
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors relative"
          aria-label={t("workspace.ssh.connectTitle")}
          onClick={() => sshConnection?.connected ? setSSHBrowserOpen(true) : setSSHDialogOpen(true)}
        >
          <Server className="size-[16px]" />
          {sshConnection?.connected && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-emerald-500" />
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label={t("workspace.batch.button")}
          >
            <Layers className="size-[16px]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem onClick={() => setBatchValidateOpen(true)}>
              <ClipboardCheck className="size-[14px]" />
              <span>{t("workspace.batch.validate")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBatchExportOpen(true)}>
              <Download className="size-[14px]" />
              <span>{t("workspace.batch.export")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label={t("workspace.nav.addSkill")}
          >
            <Plus className="size-[16px]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="add-skill-menu">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-[14px]" />
              <span>{t("workspace.nav.importLocal")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setPasteError(""); setPasteDialogOpen(true) }}>
              <ClipboardPaste className="size-[14px]" />
              <span>{t("workspace.nav.pasteImport")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
              <Globe className="size-[14px]" />
              <span>{t("workspace.nav.importOnline")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setWizardOpen(true)}>
              <Plus className="size-[14px]" />
              <span>{t("workspace.nav.createNew")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {uploadError && (
        <div className="shrink-0 bg-destructive/10 px-3 py-1.5 text-xs text-destructive flex items-center justify-between">
          <span>{uploadError}</span>
          <button type="button" className="text-destructive/70 hover:text-destructive" onClick={() => setUploadError("")}>×</button>
        </div>
      )}

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">{t("workspace.nav.createNew")}</DialogTitle>
          <SkillWizard
            onClose={() => setWizardOpen(false)}
            onCreated={() => setWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

      <SSHConnectDialog
        open={sshDialogOpen}
        onOpenChange={setSSHDialogOpen}
        connection={sshConnection}
        onConnected={(info) => {
          setSSHConnection(info)
          setSSHBrowserOpen(true)
        }}
        onDisconnected={() => setSSHConnection(null)}
      />

      {sshConnection?.connected && (
        <RemoteSkillList
          open={sshBrowserOpen}
          onOpenChange={setSSHBrowserOpen}
          connection={sshConnection}
          onSkillLoaded={(skill) => addSkill(skill)}
        />
      )}

      <BatchValidationDialog
        open={batchValidateOpen}
        onOpenChange={setBatchValidateOpen}
        skills={skills}
      />
      <BatchExportDialog
        open={batchExportOpen}
        onOpenChange={setBatchExportOpen}
        skills={skills}
      />

      <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>{t("workspace.nav.pasteTitle")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("workspace.nav.pasteDesc")}</p>
          <textarea
            className="fi ft w-full"
            rows={12}
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder={"---\nname: my-skill\ndescription: ...\n---\n\n# My Skill\n..."}
            style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
          />
          {pasteError && <p className="text-xs text-destructive">{pasteError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPasteDialogOpen(false)}>{t("workspace.action.cancel")}</Button>
            <Button size="sm" onClick={handlePasteConfirm}>{t("workspace.nav.import")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("workspace.nav.removeSkill")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? t("workspace.nav.removeConfirm", { name: deleteTarget.name }) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("workspace.action.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              {t("workspace.nav.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteFileTarget !== null} onOpenChange={(open) => { if (!open) setDeleteFileTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("workspace.nav.deleteFile")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteFileTarget ? t("workspace.nav.deleteFileConfirm", { path: deleteFileTarget.path }) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("workspace.action.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeleteFile}>
              {t("workspace.nav.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScrollArea className="min-h-0 flex-1 overflow-hidden">
        <div className="space-y-0.5 p-2 pr-3">
          {filteredSkills.map((skill) => (
            <SkillTreeBlock
              key={skill.id}
              skill={skill}
              dirty={state.editStates[skill.id]?.dirty ?? false}
              changeCount={state.editStates[skill.id] ? computeChanges(state.editStates[skill.id]).totalCount : 0}
              expanded={expandedIds.has(skill.id)}
              onToggleExpand={() => toggleExpand(skill.id)}
              selection={selection}
              select={select}
              onDeleteFile={handleDeleteFile}
              onDelete={() =>
                setDeleteTarget({
                  id: skill.id,
                  name: skill.frontmatter.name || skill.id,
                })
              }
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface SkillTreeBlockProps {
  skill: ParsedSkill
  dirty: boolean
  changeCount: number
  expanded: boolean
  onToggleExpand: () => void
  selection: NavigatorSelection | null
  select: (sel: NavigatorSelection) => void
  onDelete: () => void
  onDeleteFile: (skillId: string, path: string, type: "config" | "extra") => void
}

function SkillTreeBlock({
  skill,
  dirty,
  changeCount,
  expanded,
  onToggleExpand,
  selection,
  select,
  onDelete,
  onDeleteFile,
}: SkillTreeBlockProps) {
  const { t } = useTranslation()
  const name = skill.frontmatter.name || skill.id
  const version = skill.frontmatter.version
  const isSelected = selectionMatches(selection, skill.id, "skill-overview")

  const handleClick = () => {
    onToggleExpand()
    select({ skillId: skill.id, nodeType: "skill-overview" })
  }

  return (
    <div className="rounded-md">
      <div className="group/skill relative">
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "flex w-full items-start gap-1 rounded-md px-1.5 py-1.5 text-left text-xs transition-colors pr-7",
            isSelected ? "bg-accent" : "hover:bg-muted/60",
          )}
        >
          <span className="text-muted-foreground mt-0.5 shrink-0">
            {expanded ? <ChevronDown className="size-[14px]" /> : <ChevronRight className="size-[14px]" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="truncate font-medium">{name}</span>
              {skill.origin?.type === "ssh" && (
                <Cloud className="size-[12px] shrink-0 text-blue-400" />
              )}
              {version ? (
                <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px] font-normal">
                  v{version}
                </Badge>
              ) : null}
              {dirty && (
                changeCount > 0 ? (
                  <Badge variant="outline" className="h-4 min-w-4 shrink-0 px-1 text-[9px] font-medium border-amber-500/50 bg-amber-500/10 text-amber-500">
                    {changeCount}
                  </Badge>
                ) : (
                  <span className="size-1.5 shrink-0 rounded-full bg-amber-500" title={t("workspace.nav.unsavedChanges")} />
                )
              )}
            </span>
            {skill.description ? (
              <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{skill.description}</p>
            ) : null}
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/skill:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          aria-label={t("workspace.nav.removeAria", { name })}
        >
          <Trash2 className="size-[14px]" />
        </button>
      </div>

      {expanded ? (
        <div className="border-border ml-2 border-l pl-2">
          <TreeNode
            selected={selectionMatches(selection, skill.id, "skill-md")}
            onClick={() => select({ skillId: skill.id, nodeType: "skill-md" })}
            icon={<FileText className="size-[14px] shrink-0" />}
            label="SKILL.md"
            description={t("workspace.nav.skillIdentity")}
          />
          {skill.hasConfig ? (
            <ConfigSubtree skill={skill} selection={selection} select={select} onDeleteFile={onDeleteFile} />
          ) : null}
          {Object.keys(skill.extraFiles).length > 0 ? (
            <ExtraFilesSubtree skill={skill} selection={selection} select={select} onDeleteFile={onDeleteFile} />
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
  onDelete?: () => void
}

function TreeNode({ selected, onClick, icon, label, description, onDelete }: TreeNodeProps) {
  return (
    <div className="group/node relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-xs transition-colors",
          onDelete && "pr-7",
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
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${label}`}
        >
          <Trash2 className="size-[12px]" />
        </button>
      )}
    </div>
  )
}

interface ConfigSubtreeProps {
  skill: ParsedSkill
  selection: NavigatorSelection | null
  select: (sel: NavigatorSelection) => void
  onDeleteFile: (skillId: string, path: string, type: "config" | "extra") => void
}

function ConfigSubtree({ skill, selection, select, onDeleteFile }: ConfigSubtreeProps) {
  const { t } = useTranslation()
  const paths = sortConfigPaths(Object.keys(skill.configFiles))

  return (
    <div className="space-y-0.5">
      <div className="text-muted-foreground flex items-center gap-1.5 px-1.5 py-1 text-xs font-medium">
        <FolderOpen className="size-[14px] shrink-0" />
        <span>config/</span>
      </div>
      <div className="border-border ml-1 border-l pl-2">
        {paths.map((filePath) => {
          const data = skill.configFiles[filePath]
          const display =
            filePath.startsWith("config/") ? filePath.slice("config/".length) : filePath
          const desc = configFileDescription(filePath, data, t)
          return (
            <TreeNode
              key={filePath}
              selected={selectionMatches(selection, skill.id, "config-file", filePath)}
              onClick={() =>
                select({ skillId: skill.id, nodeType: "config-file", filePath })
              }
              icon={<Settings className="size-[14px] shrink-0" />}
              label={display}
              description={desc}
              onDelete={() => onDeleteFile(skill.id, filePath, "config")}
            />
          )
        })}
      </div>
    </div>
  )
}

function ExtraFilesSubtree({
  skill,
  selection,
  select,
  onDeleteFile,
}: {
  skill: ParsedSkill
  selection: NavigatorSelection | null
  select: (sel: NavigatorSelection) => void
  onDeleteFile: (skillId: string, path: string, type: "config" | "extra") => void
}) {
  const { t } = useTranslation()
  const entries = Object.values(skill.extraFiles)
  if (entries.length === 0) return null

  const rootFiles: ExtraFile[] = []
  const folders: Record<string, ExtraFile[]> = {}

  for (const f of entries) {
    const slashIdx = f.path.indexOf("/")
    if (slashIdx === -1) {
      rootFiles.push(f)
    } else {
      const dir = f.path.slice(0, slashIdx)
      ;(folders[dir] ??= []).push(f)
    }
  }

  rootFiles.sort((a, b) => a.path.localeCompare(b.path))
  const sortedDirs = Object.keys(folders).sort()

  return (
    <>
      {rootFiles.map((f) => (
        <TreeNode
          key={f.path}
          selected={selectionMatches(selection, skill.id, "extra-file", f.path)}
          onClick={() => select({ skillId: skill.id, nodeType: "extra-file", filePath: f.path })}
          icon={extraFileIcon(f.type)}
          label={f.path}
          description={extraFileDescription(f, t)}
          onDelete={() => onDeleteFile(skill.id, f.path, "extra")}
        />
      ))}
      {sortedDirs.map((dir) => {
        const files = folders[dir].sort((a, b) => a.path.localeCompare(b.path))
        return (
          <div key={dir} className="space-y-0.5">
            <div className="text-muted-foreground flex items-center gap-1.5 px-1.5 py-1 text-xs font-medium">
              <FolderOpen className="size-[14px] shrink-0" />
              <span>{dir}/</span>
            </div>
            <div className="border-border ml-1 border-l pl-2">
              {files.map((f) => {
                const display = f.path.slice(dir.length + 1)
                return (
                  <TreeNode
                    key={f.path}
                    selected={selectionMatches(selection, skill.id, "extra-file", f.path)}
                    onClick={() => select({ skillId: skill.id, nodeType: "extra-file", filePath: f.path })}
                    icon={extraFileIcon(f.type)}
                    label={display}
                    description={extraFileDescription(f, t)}
                    onDelete={() => onDeleteFile(skill.id, f.path, "extra")}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
