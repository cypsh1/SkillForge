import { Hammer, Moon, Sun } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
      <Hammer className="h-4 w-4 text-primary" />
      <span className="text-sm font-semibold tracking-tight">SkillForge</span>
      <Separator orientation="vertical" className="mx-1 h-4" />
      <span className="text-xs text-muted-foreground">OpenClaw Skill 可视化配置</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="ml-auto h-7 w-7"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label={resolvedTheme === "dark" ? "切换到浅色" : "切换到深色"}
      >
        {resolvedTheme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      </Button>
    </header>
  )
}
