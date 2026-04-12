import type { SkillBundle } from "@/types/skill"

// ---------- Types ----------

export interface GitHubParsedUrl {
  owner: string
  repo: string
  ref: string
  path: string
}

export interface GitHubFile {
  name: string
  path: string
  type: "file" | "dir"
  size: number
  download_url: string | null
}

// ---------- URL Parsing ----------

/**
 * Parse a GitHub URL into owner/repo/ref/path.
 * Supports:
 *   https://github.com/user/repo
 *   https://github.com/user/repo/tree/branch/path/to/dir
 *   https://github.com/user/repo/blob/branch/path/to/file
 */
export function parseGitHubUrl(url: string): GitHubParsedUrl | null {
  try {
    const u = new URL(url)
    if (u.hostname !== "github.com") return null

    const parts = u.pathname.replace(/^\//, "").split("/")
    if (parts.length < 2) return null

    const owner = parts[0]
    const repo = parts[1]

    // https://github.com/user/repo (no tree/blob)
    if (parts.length === 2) {
      return { owner, repo, ref: "main", path: "" }
    }

    // https://github.com/user/repo/tree/branch/path...
    // https://github.com/user/repo/blob/branch/path...
    if ((parts[2] === "tree" || parts[2] === "blob") && parts.length >= 4) {
      const ref = parts[3]
      const path = parts.slice(4).join("/")
      return { owner, repo, ref, path }
    }

    // Fallback: assume the rest is a path under main
    return { owner, repo, ref: "main", path: parts.slice(2).join("/") }
  } catch {
    return null
  }
}

// ---------- API ----------

async function getFetch(): Promise<typeof globalThis.fetch> {
  if (typeof window !== "undefined" && "__TAURI__" in window) {
    const { fetch } = await import("@tauri-apps/plugin-http")
    return fetch
  }
  return globalThis.fetch
}

function apiHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/vnd.github.v3+json" }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

/**
 * List directory contents via GitHub Contents API.
 */
export async function listContents(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
  token?: string,
): Promise<GitHubFile[]> {
  const fetch = await getFetch()
  const params = ref ? `?ref=${encodeURIComponent(ref)}` : ""
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${params}`
  const res = await fetch(url, { headers: apiHeaders(token) })
  if (!res.ok) {
    if (res.status === 404) throw new Error("Repository or path not found")
    if (res.status === 403) throw new Error("API rate limit exceeded. Try adding a GitHub token.")
    throw new Error(`GitHub API error: ${res.status}`)
  }
  const data = await res.json()
  if (!Array.isArray(data)) {
    // Single file response — wrap as array
    return [data as GitHubFile]
  }
  return data as GitHubFile[]
}

/**
 * Download a single file's raw content.
 */
export async function downloadRawFile(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
  token?: string,
): Promise<string> {
  const fetch = await getFetch()
  const branch = ref || "main"
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Failed to download ${path}: ${res.status}`)
  return res.text()
}

/**
 * Recursively download all files in a skill directory from GitHub.
 * Returns a SkillBundle with relative paths.
 */
export async function downloadSkillDirectory(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
  token?: string,
): Promise<SkillBundle> {
  const files: SkillBundle["files"] = []
  await walkDirectory(owner, repo, path, ref, token, path, files)
  return { files }
}

async function walkDirectory(
  owner: string,
  repo: string,
  dirPath: string,
  ref: string | undefined,
  token: string | undefined,
  rootPath: string,
  result: SkillBundle["files"],
): Promise<void> {
  const entries = await listContents(owner, repo, dirPath, ref, token)

  for (const entry of entries) {
    if (entry.type === "dir") {
      await walkDirectory(owner, repo, entry.path, ref, token, rootPath, result)
    } else if (entry.type === "file") {
      // Only download text-like files
      if (isTextFile(entry.name)) {
        const content = await downloadRawFile(owner, repo, entry.path, ref, token)
        const relativePath = rootPath
          ? entry.path.slice(rootPath.length + 1)
          : entry.path
        result.push({ path: relativePath || entry.name, content })
      }
    }
  }
}

const TEXT_EXTENSIONS = new Set([
  "md", "json", "yaml", "yml", "toml",
  "py", "sh", "js", "ts", "txt",
  "cfg", "ini", "env",
])

function isTextFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase()
  if (!ext) return false
  return TEXT_EXTENSIONS.has(ext)
}
