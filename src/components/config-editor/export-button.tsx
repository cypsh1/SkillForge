import { Download } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { downloadJson } from "@/lib/download"

interface ExportButtonProps {
  filename: string
  data: unknown
  label?: string
}

export function ExportButton({ filename, data, label }: ExportButtonProps) {
  const { t } = useTranslation()
  const displayLabel = label ?? t("workspace.configEditor.export")
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => downloadJson(filename, data)}
    >
      <Download className="mr-2 h-4 w-4" />
      {displayLabel}
    </Button>
  )
}
