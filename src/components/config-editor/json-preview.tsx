import { useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface JsonPreviewProps {
  data: unknown
}

export function JsonPreview({ data }: JsonPreviewProps) {
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return "// JSON 序列化失败"
    }
  }, [data])

  return (
    <ScrollArea className="h-[540px] rounded-md border">
      <pre className="p-3 text-xs font-mono leading-relaxed">
        <code>{formatted}</code>
      </pre>
    </ScrollArea>
  )
}
