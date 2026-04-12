import type { SSHConfig } from "@/lib/remote-fs"

// ---------- Types ----------

export interface AppConfig {
  sshConnections: SSHConnectionConfig[]
  github: { token: string }
}

export interface SSHConnectionConfig extends SSHConfig {
  name: string
}

const DEFAULT_CONFIG: AppConfig = {
  sshConnections: [],
  github: { token: "" },
}

const CONFIG_PATH = ".openclaw/skillforge-config.json"

// ---------- Read/Write ----------

export async function loadAppConfig(): Promise<AppConfig> {
  try {
    const fs = await import("@tauri-apps/plugin-fs")
    const { homeDir } = await import("@tauri-apps/api/path")
    const home = await homeDir()
    const path = `${home.endsWith("/") ? home.slice(0, -1) : home}/${CONFIG_PATH}`

    if (await fs.exists(path)) {
      const text = await fs.readTextFile(path)
      const parsed = JSON.parse(text)
      return { ...DEFAULT_CONFIG, ...parsed }
    }
  } catch {
    // Config doesn't exist yet or is unreadable — use defaults
  }
  return { ...DEFAULT_CONFIG }
}

export async function saveAppConfig(config: AppConfig): Promise<void> {
  const fs = await import("@tauri-apps/plugin-fs")
  const { homeDir } = await import("@tauri-apps/api/path")
  const home = await homeDir()
  const path = `${home.endsWith("/") ? home.slice(0, -1) : home}/${CONFIG_PATH}`

  await fs.writeTextFile(path, JSON.stringify(config, null, 2))
}
