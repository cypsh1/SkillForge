import { Hammer } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

export function AppHeader() {
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === "zh" ? "en" : "zh"
    i18n.changeLanguage(newLang)
    localStorage.setItem("skillforge-lang", newLang)
  }

  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b px-3" style={{ background: 'var(--card)' }}>
      <Hammer className="size-[16px] text-primary" />
      <span className="text-sm font-semibold tracking-tight">SkillForge</span>
      <Separator orientation="vertical" className="mx-1 h-4" />
      <span className="text-xs text-muted-foreground">{t("header.subtitle")}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto h-7 text-xs px-2"
        onClick={toggleLanguage}
      >
        {t("header.langLabel")}
      </Button>
    </header>
  )
}
