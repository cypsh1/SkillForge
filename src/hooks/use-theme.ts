import { useEffect } from "react"

/**
 * 主题已冻结为纯暗色方案（对齐 demo-05），不支持 light 模式切换。
 * 保留 hook 接口以兼容已有调用点，后续可安全删除。
 */
export function useTheme() {
  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  return { theme: "dark" as const, setTheme: () => {}, resolvedTheme: "dark" as const }
}
