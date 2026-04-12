import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, Download, Loader2, AlertCircle, AlertTriangle } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  searchSkills,
  type ClawHubSkill,
} from "@/lib/clawhub-api"

interface ClawHubTabProps {
  existingIds: string[]
  onImport: (slug: string, version?: string) => Promise<void>
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function ClawHubTab({ existingIds, onImport }: ClawHubTabProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ClawHubSkill[]>([])
  const [searching, setSearching] = useState(false)
  const [importingSlug, setImportingSlug] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setError("")
    setSearching(true)
    try {
      const data = await searchSkills(q)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  const handleImport = useCallback(async (skill: ClawHubSkill) => {
    setImportingSlug(skill.slug)
    setError("")
    try {
      await onImport(skill.slug, skill.version ?? undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setImportingSlug(null)
    }
  }, [onImport])

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder={t("workspace.import.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={!query.trim() || searching}
          className="h-9 px-4"
        >
          {searching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            t("workspace.import.search")
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results list */}
      <ScrollArea className="rounded-md border min-h-[200px] max-h-[360px]">
        {searching ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("workspace.import.searching")}
          </div>
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            {query.trim()
              ? t("workspace.import.noResults")
              : t("workspace.import.searchHint")}
          </div>
        ) : (
          <div className="divide-y">
            {results.map((skill) => {
              const isConflict = existingIds.includes(skill.slug)
              const isImporting = importingSlug === skill.slug

              return (
                <div
                  key={skill.slug}
                  className="flex items-start gap-3 px-3 py-3 hover:bg-accent/30 transition-colors"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {skill.displayName || skill.slug}
                      </span>
                      {isConflict && (
                        <AlertTriangle className="size-3 shrink-0 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {skill.summary}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground/60">
                      <span className="font-mono">{skill.slug}</span>
                      {skill.updatedAt > 0 && (
                        <span>{formatDate(skill.updatedAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Import button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 px-2.5 mt-0.5"
                    disabled={isImporting}
                    onClick={() => handleImport(skill)}
                  >
                    {isImporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {results.length > 0 && (
        <div className="text-[10px] text-muted-foreground/50 text-right">
          {t("workspace.import.resultCount", { count: results.length })}
        </div>
      )}
    </div>
  )
}
