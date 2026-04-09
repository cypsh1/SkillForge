import { stringify } from "yaml"
import type { EnvVarDefinition, SkillFrontmatter, FrontmatterStatus } from "@/types/skill"

const KNOWN_KEYS = new Set([
  "name",
  "description",
  "version",
  "author",
  "homepage",
  "source",
  "metadata",
  "env",
  "tools",
  "files",
])

function deepOmitUndefined(value: unknown): unknown {
  if (value === undefined) return undefined
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) {
    return value.map(deepOmitUndefined).filter((v) => v !== undefined)
  }
  const obj = value as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const next = deepOmitUndefined(v)
    if (next !== undefined) out[k] = next
  }
  return out
}

function buildFrontmatterPayload(frontmatter: SkillFrontmatter): Record<string, unknown> {
  const out: Record<string, unknown> = { name: frontmatter.name }

  if (frontmatter.description !== undefined) out.description = frontmatter.description
  if (frontmatter.version !== undefined) out.version = frontmatter.version
  if (frontmatter.author !== undefined) out.author = frontmatter.author
  if (frontmatter.homepage !== undefined) out.homepage = frontmatter.homepage
  if (frontmatter.source !== undefined) out.source = frontmatter.source

  if (frontmatter.metadata !== undefined) {
    const cleaned = deepOmitUndefined(frontmatter.metadata) as Record<string, unknown> | undefined
    if (cleaned && Object.keys(cleaned).length > 0) out.metadata = cleaned
  }

  if (frontmatter.env !== undefined) {
    out.env = frontmatter.env.map((e: EnvVarDefinition) => ({
      name: e.name,
      required: e.required,
      description: e.description,
    }))
  }

  if (frontmatter.tools !== undefined) {
    out.tools = deepOmitUndefined(frontmatter.tools)
  }

  if (frontmatter.files !== undefined) {
    const files: Record<string, unknown> = {}
    if (frontmatter.files.read !== undefined) files.read = frontmatter.files.read
    if (frontmatter.files.write !== undefined) files.write = frontmatter.files.write
    if (Object.keys(files).length > 0) out.files = files
  }

  const extraKeys = Object.keys(frontmatter)
    .filter((k) => !KNOWN_KEYS.has(k))
    .sort()
  for (const key of extraKeys) {
    const v = frontmatter[key]
    if (v !== undefined) {
      const cleaned = deepOmitUndefined(v)
      if (cleaned !== undefined) out[key] = cleaned
    }
  }

  return out
}

/**
 * Serialize edited frontmatter and markdown body back into SKILL.md text.
 */
export function serializeSkillMd(
  frontmatter: SkillFrontmatter,
  markdownBody: string,
  status?: FrontmatterStatus,
): string {
  if (status === "missing") {
    return markdownBody
  }
  const payload = buildFrontmatterPayload(frontmatter)
  const yamlText = stringify(payload, {
    lineWidth: 0,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  }).replace(/\n$/, "")

  return `---\n${yamlText}\n---\n${markdownBody}`
}
