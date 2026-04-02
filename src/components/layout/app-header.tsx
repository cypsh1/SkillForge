import { Moon, Sun } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-sm font-medium">SkillForge</h1>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="ml-auto"
        onClick={() =>
          setTheme(resolvedTheme === "dark" ? "light" : "dark")
        }
        aria-label={resolvedTheme === "dark" ? "切换到浅色" : "切换到深色"}
      >
        {resolvedTheme === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </Button>
    </header>
  )
}
