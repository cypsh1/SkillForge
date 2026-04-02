import { useCallback, useEffect, useState } from "react"

export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "skillforge-theme"

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system"
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === "light" || raw === "dark" || raw === "system") return raw
  return "system"
}

export function useTheme(): {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
} {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  )

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener("change", onChange)
    setSystemDark(mq.matches)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }, [])

  return { theme, setTheme, resolvedTheme }
}
