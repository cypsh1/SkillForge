import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  FolderGit2,
  FileText,
  Folder,
  Download,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Key,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  parseGitHubUrl,
  listContents,
  type GitHubFile,
  type GitHubParsedUrl,
} from "@/lib/github-api"

interface GitHubTabProps {
  onImport: (url: string, token?: string) => Promise<void>
}

export function GitHubTab({ onImport }: GitHubTabProps) {
  const { t } = useTranslation()
  const [url, setUrl] = useState("")
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [parsed, setParsed] = useState<GitHubParsedUrl | null>(null)
  const [files, setFiles] = useState<GitHubFile[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState("")

  const handlePreview = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed) return
    setError("")
    setFiles([])

    const p = parseGitHubUrl(trimmed)
    if (!p) {
      setError(t("workspace.import.githubInvalidUrl"))
      return
    }
    setParsed(p)
    setLoading(true)
    try {
      const contents = await listContents(
        p.owner,
        p.repo,
        p.path,
        p.ref,
        token || undefined,
      )
      setFiles(contents)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [url, token, t])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handlePreview()
  }

  const handleImport = useCallback(async () => {
    setImporting(true)
    setError("")
    try {
      await onImport(url.trim(), token || undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setImporting(false)
    }
  }, [url, token, onImport])

  const hasSkillMd = files.some((f) => f.name === "SKILL.md")

  return (
    <div className="flex flex-col gap-3">
      {/* URL input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FolderGit2 className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="url"
            placeholder={t("workspace.import.githubUrlPlaceholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePreview}
          disabled={!url.trim() || loading}
          className="h-9 px-4"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            t("workspace.import.githubPreview")
          )}
        </Button>
      </div>

      {/* Token toggle */}
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
        onClick={() => setShowToken(!showToken)}
      >
        {showToken ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <Key className="size-3" />
        {t("workspace.import.githubTokenToggle")}
      </button>

      {showToken && (
        <Input
          type="password"
          placeholder={t("workspace.import.githubTokenPlaceholder")}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="h-8 text-xs"
        />
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File preview */}
      {files.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {parsed && (
                <span className="font-mono">
                  {parsed.owner}/{parsed.repo}
                  {parsed.path ? `/${parsed.path}` : ""}
                </span>
              )}
            </div>
            {!hasSkillMd && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                {t("workspace.import.githubNoSkillMd")}
              </Badge>
            )}
          </div>

          <ScrollArea className="rounded-md border max-h-[240px]">
            <div className="divide-y">
              {files
                .sort((a, b) => {
                  if (a.type !== b.type) return a.type === "dir" ? -1 : 1
                  return a.name.localeCompare(b.name)
                })
                .map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs"
                  >
                    {file.type === "dir" ? (
                      <Folder className="size-3.5 text-blue-500" />
                    ) : (
                      <FileText className="size-3.5 text-muted-foreground" />
                    )}
                    <span className={file.name === "SKILL.md" ? "font-semibold text-emerald-600" : ""}>
                      {file.name}
                    </span>
                    {file.type === "file" && file.size > 0 && (
                      <span className="ml-auto text-muted-foreground/60">
                        {file.size > 1024
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${file.size} B`}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </ScrollArea>

          <Button
            size="sm"
            className="self-end"
            disabled={importing}
            onClick={handleImport}
          >
            {importing ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 size-3.5" />
            )}
            {importing
              ? t("workspace.import.importing")
              : t("workspace.import.importButton")}
          </Button>
        </>
      )}
    </div>
  )
}
