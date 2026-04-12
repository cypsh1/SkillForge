import type { SkillBundle } from "@/types/skill"

// ---------- Types ----------

// Matches actual API response from https://clawhub.ai/api/search
export interface ClawHubSkill {
  slug: string
  displayName: string
  summary: string
  version: string | null
  updatedAt: number
  score?: number
}

export interface ClawHubSkillDetail extends ClawHubSkill {
  files: string[]
  readme?: string
}

// ---------- Config ----------

// Confirmed from test-skills/.clawhub/origin.json: "registry": "https://clawhub.ai"
const DEFAULT_REGISTRY = "https://clawhub.ai"

function getBaseUrl(): string {
  return DEFAULT_REGISTRY
}

async function getFetch(): Promise<typeof globalThis.fetch> {
  if (typeof window !== "undefined" && "__TAURI__" in window) {
    const { fetch } = await import("@tauri-apps/plugin-http")
    return fetch
  }
  return globalThis.fetch
}

function authHeaders(token?: string): Record<string, string> {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

// ---------- API ----------

export async function searchSkills(
  query: string,
  token?: string,
): Promise<ClawHubSkill[]> {
  const fetch = await getFetch()
  const url = `${getBaseUrl()}/api/search?q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(`ClawHub search failed: ${res.status}`)
  const data = await res.json()
  // API returns { results: [...] }
  if (data.results && Array.isArray(data.results)) return data.results
  if (Array.isArray(data)) return data
  return []
}

// GET /api/v1/skills/{slug} → { skill, latestVersion, owner, ... }
export async function getSkillMeta(
  slug: string,
  token?: string,
): Promise<ClawHubSkillDetail> {
  const fetch = await getFetch()
  const url = `${getBaseUrl()}/api/v1/skills/${encodeURIComponent(slug)}`
  const res = await fetch(url, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(`ClawHub skill not found: ${res.status}`)
  const data = await res.json()
  // Flatten the nested response
  const s = data.skill ?? data
  return {
    slug: s.slug,
    displayName: s.displayName,
    summary: s.summary,
    version: data.latestVersion?.version ?? null,
    updatedAt: s.updatedAt,
    files: data.files ?? [],
    readme: data.readme,
  }
}

// GET /api/v1/download?slug={slug}&version={version}
export async function downloadSkill(
  slug: string,
  version?: string,
  token?: string,
): Promise<SkillBundle> {
  const fetch = await getFetch()
  const params = new URLSearchParams({ slug })
  if (version) params.set("version", version)
  const url = `${getBaseUrl()}/api/v1/download?${params}`
  const res = await fetch(url, { headers: authHeaders(token) })
  if (!res.ok) {
    if (res.status === 429) throw new Error("ClawHub rate limit exceeded, please try again later")
    throw new Error(`ClawHub download failed: ${res.status}`)
  }
  const data = await res.json()
  if (data.files && Array.isArray(data.files)) {
    return { files: data.files }
  }
  if (typeof data.content === "string") {
    return { files: [{ path: "SKILL.md", content: data.content }] }
  }
  throw new Error("Unexpected ClawHub download response format")
}
