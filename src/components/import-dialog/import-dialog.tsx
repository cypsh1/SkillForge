import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ClawHubTab } from "./clawhub-tab"
import { GitHubTab } from "./github-tab"
import { useWorkspace } from "@/hooks/use-workspace"
import { importFromClawHub, importFromGitHub } from "@/lib/skill-importer"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { t } = useTranslation()
  const { state, addSkill } = useWorkspace()
  const existingIds = useMemo(() => state.skills.map((s) => s.id), [state.skills])

  const handleClawHubImport = useCallback(
    async (slug: string, version?: string) => {
      const skill = await importFromClawHub(slug, version)
      addSkill(skill)
      toast.success(t("workspace.import.success", { name: skill.frontmatter.name || skill.id }))
      onOpenChange(false)
    },
    [addSkill, onOpenChange, t],
  )

  const handleGitHubImport = useCallback(
    async (url: string, token?: string) => {
      const skill = await importFromGitHub(url, token)
      addSkill(skill)
      toast.success(t("workspace.import.success", { name: skill.frontmatter.name || skill.id }))
      onOpenChange(false)
    },
    [addSkill, onOpenChange, t],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogTitle>{t("workspace.import.title")}</DialogTitle>
        <Tabs defaultValue="clawhub">
          <TabsList>
            <TabsTrigger value="clawhub">
              {t("workspace.import.clawhub")}
            </TabsTrigger>
            <TabsTrigger value="github">
              {t("workspace.import.github")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="clawhub">
            <ClawHubTab
              existingIds={existingIds}
              onImport={handleClawHubImport}
            />
          </TabsContent>
          <TabsContent value="github">
            <GitHubTab onImport={handleGitHubImport} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
