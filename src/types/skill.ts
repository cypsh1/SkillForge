export interface SkillFrontmatter {
  name: string
  description?: string
  version?: string
  author?: string
  homepage?: string
  source?: string
  metadata?: Record<string, unknown>
  env?: EnvVarDefinition[]
  tools?: unknown[]
  files?: {
    read?: string[]
    write?: string[]
  }
  [key: string]: unknown
}

export interface EnvVarDefinition {
  name: string
  required: boolean
  description: string
}

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

export interface ParsedSkill {
  id: string
  path: string
  frontmatter: SkillFrontmatter
  description: string
  tools: SkillTool[]
  envVars: EnvVarDefinition[]
  sections: MarkdownSection[]
  rawContent: string
  configFiles: Record<string, unknown>
  hasConfig: boolean
}
