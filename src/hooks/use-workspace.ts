import { createContext, useContext, useReducer, useMemo, type Dispatch } from "react"
import type { ParsedSkill, SkillFrontmatter } from "@/types/skill"
import type { WorkspaceState, WorkspaceAction, NavigatorSelection, SkillEditState } from "@/types/workspace"

function getOrCreateEditState(state: WorkspaceState, skillId: string): SkillEditState {
  if (state.editStates[skillId]) return state.editStates[skillId]
  const skill = state.skills.find((s) => s.id === skillId)
  if (!skill) return { frontmatter: { name: "" }, configFiles: {}, dirty: false }
  return {
    frontmatter: structuredClone(skill.frontmatter),
    configFiles: structuredClone(skill.configFiles),
    dirty: false,
  }
}

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "SELECT":
      return { ...state, selection: action.payload }

    case "UPDATE_FRONTMATTER": {
      const { skillId, frontmatter } = action.payload
      const existing = getOrCreateEditState(state, skillId)
      return {
        ...state,
        editStates: {
          ...state.editStates,
          [skillId]: { ...existing, frontmatter, dirty: true },
        },
      }
    }

    case "UPDATE_CONFIG": {
      const { skillId, path, data } = action.payload
      const existing = getOrCreateEditState(state, skillId)
      return {
        ...state,
        editStates: {
          ...state.editStates,
          [skillId]: {
            ...existing,
            configFiles: { ...existing.configFiles, [path]: data },
            dirty: true,
          },
        },
      }
    }

    case "RESET_EDITS": {
      const { skillId } = action.payload
      const next = { ...state.editStates }
      delete next[skillId]
      return { ...state, editStates: next }
    }

    default:
      return state
  }
}

interface WorkspaceContextValue {
  state: WorkspaceState
  dispatch: Dispatch<WorkspaceAction>
  selectedSkill: ParsedSkill | null
  editState: SkillEditState | null
  select: (sel: NavigatorSelection) => void
  updateFrontmatter: (skillId: string, fm: SkillFrontmatter) => void
  updateConfig: (skillId: string, path: string, data: unknown) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspaceReducer(skills: ParsedSkill[]) {
  const [state, dispatch] = useReducer(workspaceReducer, {
    skills,
    selection: skills.length > 0
      ? { skillId: skills[0].id, nodeType: "skill-overview" }
      : null,
    editStates: {},
  })

  const selectedSkill = useMemo(
    () => state.skills.find((s) => s.id === state.selection?.skillId) ?? null,
    [state.skills, state.selection?.skillId],
  )

  const editState = useMemo(() => {
    if (!state.selection) return null
    return getOrCreateEditState(state, state.selection.skillId)
  }, [state])

  const select = (sel: NavigatorSelection) => dispatch({ type: "SELECT", payload: sel })
  const updateFrontmatter = (skillId: string, fm: SkillFrontmatter) =>
    dispatch({ type: "UPDATE_FRONTMATTER", payload: { skillId, frontmatter: fm } })
  const updateConfig = (skillId: string, path: string, data: unknown) =>
    dispatch({ type: "UPDATE_CONFIG", payload: { skillId, path, data } })

  return useMemo<WorkspaceContextValue>(
    () => ({ state, dispatch, selectedSkill, editState, select, updateFrontmatter, updateConfig }),
    [state, dispatch, selectedSkill, editState],
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceContext.Provider")
  return ctx
}
