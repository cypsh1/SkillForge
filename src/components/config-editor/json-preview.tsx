import { useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface JsonPreviewProps {
  data: unknown
  className?: string
}

export function JsonPreview({ data, className }: JsonPreviewProps) {
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return "// JSON 序列化失败"
    }
  }, [data])

  return (
    <ScrollArea className={cn("h-[540px] rounded-md border", className)}>
      <pre className="p-3 text-xs font-mono leading-relaxed">
        <code>{formatted}</code>
      </pre>
    </ScrollArea>
  )
}
