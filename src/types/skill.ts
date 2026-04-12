import type { FrontmatterData, EnvVarData } from "@/lib/schemas/frontmatter-schema"
import type { ParsedDocument } from "@/types/content-fragment"

// Re-export Zod-derived types as the canonical source
export type SkillFrontmatter = FrontmatterData
export type EnvVarDefinition = EnvVarData

export type FrontmatterStatus = "valid" | "missing" | "invalid"

export interface ToolParameter {
  name: string
  type: string
  description: string
  required?: boolean
}

export interface SkillTool {
  name: string
  description: string
  parameters: ToolParameter[]
}

export interface MarkdownSection {
  level: number
  title: string
  content: string
}

export type SkillOrigin =
  | { type: "local" }
  | { type: "clawhub"; slug: string; version: string }
  | { type: "github"; owner: string; repo: string; path: string; ref: string }
  | { type: "ssh"; connectionName: string; remotePath: string }

export interface SkillBundle {
  files: Array<{ path: string; content: string }>
}

export type ExtraFileType = "json" | "markdown" | "python" | "shell" | "text"

export interface ExtraFile {
  path: string
  content: string
  type: ExtraFileType
}

export interface ParsedSkill {
  id: string
  path: string
  frontmatter: SkillFrontmatter
  frontmatterStatus: FrontmatterStatus
  rawFrontmatter: string | null
  bodyDocument: ParsedDocument
  description: string
  tools: SkillTool[]
  envVars: EnvVarDefinition[]
  sections: MarkdownSection[]
  rawContent: string
  configFiles: Record<string, unknown>
  hasConfig: boolean
  extraFiles: Record<string, ExtraFile>
  origin?: SkillOrigin
}
