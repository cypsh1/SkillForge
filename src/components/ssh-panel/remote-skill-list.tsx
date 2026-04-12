import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Download, FileText, AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  listRemoteSkills,
  readRemoteSkill,
  type ConnectionInfo,
  type RemoteSkillInfo,
} from "@/lib/remote-fs"
import { importSkillBundle } from "@/lib/tauri-fs"
import { parseSkillMd } from "@/lib/skill-parser"
import { loadLocalSkills } from "@/lib/tauri-fs"
import type { ParsedSkill } from "@/types/skill"

interface RemoteSkillListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: ConnectionInfo
  onSkillLoaded: (skill: ParsedSkill) => void
}

export function RemoteSkillList({
  open,
  onOpenChange,
  connection,
  onSkillLoaded,
}: RemoteSkillListProps) {
  const { t } = useTranslation()
  const [skills, setSkills] = useState<RemoteSkillInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const list = await listRemoteSkills()
      setSkills(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && connection.connected) {
      refresh()
    }
  }, [open, connection.connected, refresh])

  const handleImport = useCallback(
    async (name: string) => {
      setImporting(name)
      setError("")
      try {
        const bundle = await readRemoteSkill(name)

        // Write to local disk
        await importSkillBundle(
          name,
          bundle.files.map((f) => ({ relativePath: f.path, content: f.content })),
        )

        // Re-load from disk to get properly parsed skill
        const allSkills = await loadLocalSkills()
        let skill = allSkills.find((s) => s.id === name)

        if (!skill) {
          // Fallback: parse SKILL.md from bundle
          const skillMdFile = bundle.files.find((f) => f.path === "SKILL.md")
          if (!skillMdFile) throw new Error("No SKILL.md in remote skill")
          skill = parseSkillMd(skillMdFile.content, name, "")
        }

        skill.origin = {
          type: "ssh",
          connectionName: connection.host,
          remotePath: `${connection.remote_path}${name}`,
        }

        onSkillLoaded(skill)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setImporting(null)
      }
    },
    [connection, onSkillLoaded],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh]">
        <div className="flex items-center justify-between">
          <DialogTitle>{t("workspace.ssh.remoteSkills")}</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {connection.host} — <span className="font-mono">{connection.remote_path}</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("workspace.ssh.loadingSkills")}
            </div>
          ) : skills.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              {t("workspace.ssh.noRemoteSkills")}
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {skills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`size-4 shrink-0 ${skill.has_skill_md ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{skill.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {t("workspace.ssh.fileCount", { count: skill.file_count })}
                        {!skill.has_skill_md && (
                          <span className="ml-1 text-amber-500">
                            ({t("workspace.ssh.noSkillMd")})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 shrink-0"
                    disabled={importing === skill.name}
                    onClick={() => handleImport(skill.name)}
                  >
                    {importing === skill.name ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
