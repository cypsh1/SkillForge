import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface JsonPreviewProps {
  data: unknown
  className?: string
}

export function JsonPreview({ data, className }: JsonPreviewProps) {
  const { t } = useTranslation()
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return t("workspace.configEditor.jsonSerializeFailed")
    }
  }, [data, t])

  return (
    <ScrollArea className={cn("h-[540px] rounded-md border", className)}>
      <pre className="p-3 text-xs font-mono leading-relaxed">
        <code>{formatted}</code>
      </pre>
    </ScrollArea>
  )
}
