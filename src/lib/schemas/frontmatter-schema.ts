import { z } from "zod"

// --- Sub-schemas ---

export const envVarSchema = z.object({
  name: z.string(),
  required: z.boolean().optional().default(false),
  description: z.string().optional().default(""),
})

export const installSpecSchema = z.object({
  id: z.string().optional(),
  kind: z.string().optional(),
  formula: z.string().optional(),
  package: z.string().optional(),
  bins: z.array(z.string()).optional(),
  label: z.string().optional(),
  os: z.array(z.string()).optional(),
}).passthrough()

export const requiresSchema = z.object({
  bins: z.array(z.string()).optional(),
  anyBins: z.array(z.string()).optional(),
  env: z.array(z.string()).optional(),
  config: z.array(z.string()).optional(),
})

export const openclawMetadataSchema = z.object({
  emoji: z.string().optional(),
  homepage: z.string().optional(),
  os: z.array(z.enum(["darwin", "linux", "win32"])).optional(),
  primaryEnv: z.string().optional(),
  skillKey: z.string().optional(),
  always: z.boolean().optional(),
  requires: requiresSchema.optional(),
  optionalBins: z.array(z.string()).optional(),
  install: z.array(installSpecSchema).optional(),
}).passthrough()

export const filesSchema = z.object({
  read: z.array(z.string()).optional(),
  write: z.array(z.string()).optional(),
})

// --- Main frontmatter schema ---

export const frontmatterSchema = z.object({
  // Core (name is required)
  name: z.string({ error: "Skill name is required" }).min(1, { error: "Skill name cannot be empty" }),
  description: z.string().optional(),

  // Identity
  version: z.string().optional(),
  author: z.string().optional(),
  homepage: z.string().optional(),
  source: z.string().optional(),
  emoji: z.string().optional(),

  // Trigger control
  read_when: z.union([z.array(z.string()), z.string()]).optional(),
  triggers: z.union([z.array(z.string()), z.string()]).optional(),
  trigger: z.record(z.string(), z.unknown()).optional(),
  auto_trigger: z.boolean().optional(),
  "user-invocable": z.boolean().optional(),
  "disable-model-invocation": z.boolean().optional(),
  "command-dispatch": z.string().optional(),
  "command-tool": z.string().optional(),
  "command-arg-mode": z.string().optional(),
  "allowed-tools": z.string().optional(),

  // Environment variables
  env: z.array(envVarSchema).optional(),

  // Tools (parsed separately by skill-parser, kept as passthrough)
  tools: z.unknown().optional(),

  // File access
  files: filesSchema.optional(),

  // Metadata (openclaw/clawdbot/clawdis aliases handled by helper)
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

// --- Derived types ---

export type FrontmatterData = z.infer<typeof frontmatterSchema>
export type EnvVarData = z.infer<typeof envVarSchema>
export type InstallSpecData = z.infer<typeof installSpecSchema>
export type OpenclawMetadata = z.infer<typeof openclawMetadataSchema>

// --- Metadata helper ---

const OPENCLAW_ALIASES = ["openclaw", "clawdbot", "clawdis"] as const

export function getOpenclawMetadata(
  metadata: Record<string, unknown> | undefined,
): OpenclawMetadata | null {
  if (!metadata) return null
  for (const alias of OPENCLAW_ALIASES) {
    const val = metadata[alias]
    if (val && typeof val === "object") {
      const result = openclawMetadataSchema.safeParse(val)
      return result.success ? result.data : (val as OpenclawMetadata)
    }
  }
  return null
}

export function getOpenclawMetadataKey(
  metadata: Record<string, unknown> | undefined,
): string {
  if (!metadata) return "openclaw"
  for (const alias of OPENCLAW_ALIASES) {
    if (metadata[alias]) return alias
  }
  return "openclaw"
}

export function setOpenclawMetadata(
  metadata: Record<string, unknown> | undefined,
  value: OpenclawMetadata,
): Record<string, unknown> {
  const key = getOpenclawMetadataKey(metadata)
  return { ...(metadata ?? {}), [key]: value }
}

// --- Form field grouping (for UI consumption) ---

export const FIELD_GROUPS = {
  basic: ["name", "description", "version", "author", "homepage", "source", "emoji"] as const,
  trigger: ["read_when", "triggers", "trigger", "auto_trigger", "user-invocable", "disable-model-invocation", "command-dispatch", "command-tool", "command-arg-mode", "allowed-tools"] as const,
  runtime: [] as const, // handled via metadata helper
  env: ["env"] as const,
  install: [] as const, // handled via metadata helper
} as const

export const KNOWN_FIELDS = new Set([
  ...FIELD_GROUPS.basic,
  ...FIELD_GROUPS.trigger,
  ...FIELD_GROUPS.env,
  "tools",
  "files",
  "metadata",
])
