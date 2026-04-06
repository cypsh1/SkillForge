import type { ParsedSkill, SkillFrontmatter } from "./skill"

export type NavigatorNodeType =
  | "skill-overview"
  | "skill-md"
  | "config-file"

export interface NavigatorSelection {
  skillId: string
  nodeType: NavigatorNodeType
  filePath?: string
}

export interface SkillEditState {
  frontmatter: SkillFrontmatter
  configFiles: Record<string, unknown>
  dirty: boolean
}

export interface WorkspaceState {
  skills: ParsedSkill[]
  selection: NavigatorSelection | null
  editStates: Record<string, SkillEditState>
}

export type WorkspaceAction =
  | { type: "SELECT"; payload: NavigatorSelection }
  | { type: "UPDATE_FRONTMATTER"; payload: { skillId: string; frontmatter: SkillFrontmatter } }
  | { type: "UPDATE_CONFIG"; payload: { skillId: string; path: string; data: unknown } }
  | { type: "RESET_EDITS"; payload: { skillId: string } }
