import type { ParsedSkill, SkillFrontmatter, FrontmatterStatus } from "./skill"

export type NavigatorNodeType =
  | "skill-overview"
  | "skill-md"
  | "config-file"
  | "extra-file"

export interface NavigatorSelection {
  skillId: string
  nodeType: NavigatorNodeType
  filePath?: string
}

export interface OriginalSnapshot {
  frontmatter: SkillFrontmatter
  markdownBody: string
  configFiles: Record<string, unknown>
  extraFiles: Record<string, string>
}

export interface ChangeInfo {
  totalCount: number
  areas: string[]
}

export interface SkillEditState {
  frontmatter: SkillFrontmatter
  markdownBody: string
  frontmatterStatus: FrontmatterStatus
  rawFrontmatter: string | null
  configFiles: Record<string, unknown>
  extraFiles: Record<string, string>
  dirty: boolean
  deletedConfigPaths: string[]
  deletedExtraPaths: string[]
  originalSnapshot: OriginalSnapshot
}

export function computeChanges(editState: SkillEditState): ChangeInfo {
  const { originalSnapshot: orig } = editState
  const areas: string[] = []

  if (JSON.stringify(editState.frontmatter) !== JSON.stringify(orig.frontmatter)) {
    areas.push("frontmatter")
  }
  if (editState.markdownBody !== orig.markdownBody) {
    areas.push("body")
  }
  for (const path of Object.keys(editState.configFiles)) {
    if (JSON.stringify(editState.configFiles[path]) !== JSON.stringify(orig.configFiles[path])) {
      areas.push(path)
    }
  }
  for (const path of editState.deletedConfigPaths) {
    areas.push(path)
  }
  for (const path of Object.keys(editState.extraFiles)) {
    if (editState.extraFiles[path] !== orig.extraFiles[path]) {
      areas.push(path)
    }
  }
  for (const path of editState.deletedExtraPaths) {
    areas.push(path)
  }

  return { totalCount: areas.length, areas }
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
  | { type: "UPDATE_EXTRA_FILE"; payload: { skillId: string; path: string; content: string } }
  | { type: "UPDATE_SKILL_BODY"; payload: { skillId: string; body: string } }
  | { type: "RESET_EDITS"; payload: { skillId: string } }
  | { type: "SAVE_SKILL"; payload: { skillId: string; serializedContent: string } }
  | { type: "ADD_SKILL"; payload: ParsedSkill }
  | { type: "REMOVE_SKILL"; payload: { skillId: string } }
  | { type: "REMOVE_CONFIG_FILE"; payload: { skillId: string; path: string } }
  | { type: "REMOVE_EXTRA_FILE"; payload: { skillId: string; path: string } }
