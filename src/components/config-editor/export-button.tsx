import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { downloadJson } from "@/lib/download"

interface ExportButtonProps {
  filename: string
  data: unknown
  label?: string
}

export function ExportButton({
  filename,
  data,
  label = "导出",
}: ExportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => downloadJson(filename, data)}
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
