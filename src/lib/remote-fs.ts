import type { SkillBundle } from "@/types/skill"

// ---------- Types ----------

export interface SSHConfig {
  host: string
  port: number
  user: string
  keyPath: string
  remotePath: string
}

export interface ConnectionInfo {
  connected: boolean
  host: string
  remote_path: string
}

export interface RemoteSkillInfo {
  name: string
  has_skill_md: boolean
  file_count: number
}

interface RemoteFileEntry {
  path: string
  content: string
}

// ---------- Default values ----------

export const DEFAULT_SSH_PORT = 22
export const DEFAULT_REMOTE_PATH = "/root/.openclaw/workspace/skills/"

// ---------- Tauri invoke helpers ----------

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core")
  return tauriInvoke<T>(cmd, args)
}

// ---------- SSH API ----------

export async function connectSSH(config: SSHConfig): Promise<ConnectionInfo> {
  return invoke<ConnectionInfo>("ssh_connect", {
    host: config.host,
    port: config.port,
    user: config.user,
    keyPath: config.keyPath,
    remotePath: config.remotePath,
  })
}

export async function disconnectSSH(): Promise<void> {
  return invoke("ssh_disconnect")
}

export async function getConnectionStatus(): Promise<ConnectionInfo | null> {
  return invoke<ConnectionInfo | null>("ssh_connection_status")
}

export async function listRemoteSkills(): Promise<RemoteSkillInfo[]> {
  return invoke<RemoteSkillInfo[]>("ssh_list_skills")
}

export async function readRemoteSkill(name: string): Promise<SkillBundle> {
  const bundle = await invoke<{ files: RemoteFileEntry[] }>("ssh_read_skill", {
    skillName: name,
  })
  return {
    files: bundle.files.map((f) => ({ path: f.path, content: f.content })),
  }
}

export async function writeRemoteSkill(
  name: string,
  files: Array<{ path: string; content: string }>,
): Promise<void> {
  return invoke("ssh_write_skill", {
    skillName: name,
    files,
  })
}
