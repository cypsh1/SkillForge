export interface SkillFrontmatter {
  name: string
  description?: string
  version?: string
  author?: string
  [key: string]: unknown
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

export interface ParsedSkill {
  id: string
  path: string
  frontmatter: SkillFrontmatter
  description: string
  tools: SkillTool[]
  rawContent: string
  configFiles?: Record<string, unknown>
  hasConfig: boolean
}
