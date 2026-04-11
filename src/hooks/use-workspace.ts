import { createContext, useContext, useReducer, useMemo, type Dispatch } from "react"
import type { ParsedSkill, SkillFrontmatter } from "@/types/skill"
import type { WorkspaceState, WorkspaceAction, NavigatorSelection, SkillEditState } from "@/types/workspace"

function getOrCreateEditState(state: WorkspaceState, skillId: string): SkillEditState {
  if (state.editStates[skillId]) return state.editStates[skillId]
  const skill = state.skills.find((s) => s.id === skillId)
  if (!skill) {
    const emptySnapshot = { frontmatter: { name: "" }, markdownBody: "", configFiles: {}, extraFiles: {} }
    return {
      frontmatter: { name: "" },
      markdownBody: "",
      frontmatterStatus: "missing" as const,
      rawFrontmatter: null,
      configFiles: {},
      extraFiles: {},
      dirty: false,
      deletedConfigPaths: [],
      deletedExtraPaths: [],
      originalSnapshot: emptySnapshot,
    }
  }
  const extraContents: Record<string, string> = {}
  for (const [p, f] of Object.entries(skill.extraFiles ?? {})) {
    extraContents[p] = f.content
  }

  const fmMatch = skill.rawContent.match(/^---\n[\s\S]*?\n---\n?/)
  const body = fmMatch
    ? skill.rawContent.slice(fmMatch[0].length).trimStart()
    : (skill.frontmatterStatus === "missing" ? skill.rawContent : "")

  const originalSnapshot = {
    frontmatter: structuredClone(skill.frontmatter),
    markdownBody: body,
    configFiles: structuredClone(skill.configFiles),
    extraFiles: { ...extraContents },
  }

  return {
    frontmatter: structuredClone(skill.frontmatter),
    markdownBody: body,
    frontmatterStatus: skill.frontmatterStatus,
    rawFrontmatter: skill.rawFrontmatter,
    configFiles: structuredClone(skill.configFiles),
    extraFiles: extraContents,
    dirty: false,
    deletedConfigPaths: [],
    deletedExtraPaths: [],
    originalSnapshot,
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

    case "UPDATE_EXTRA_FILE": {
      const { skillId, path, content } = action.payload
      const existing = getOrCreateEditState(state, skillId)
      return {
        ...state,
        editStates: {
          ...state.editStates,
          [skillId]: {
            ...existing,
            extraFiles: { ...existing.extraFiles, [path]: content },
            dirty: true,
          },
        },
      }
    }

    case "UPDATE_SKILL_BODY": {
      const { skillId, body } = action.payload
      const existing = getOrCreateEditState(state, skillId)
      return {
        ...state,
        editStates: {
          ...state.editStates,
          [skillId]: { ...existing, markdownBody: body, dirty: true },
        },
      }
    }

    case "REMOVE_CONFIG_FILE": {
      const { skillId, path } = action.payload
      const existing = getOrCreateEditState(state, skillId)
      const nextConfigFiles = { ...existing.configFiles }
      delete nextConfigFiles[path]
      const nextSelection =
        state.selection?.skillId === skillId &&
        state.selection?.nodeType === "config-file" &&
        state.selection?.filePath === path
          ? { skillId, nodeType: "skill-md" as const }
          : state.selection
      return {
        ...state,
        selection: nextSelection,
        editStates: {
          ...state.editStates,
          [skillId]: {
            ...existing,
            configFiles: nextConfigFiles,
            deletedConfigPaths: [...existing.deletedConfigPaths, path],
            dirty: true,
          },
        },
      }
    }

    case "REMOVE_EXTRA_FILE": {
      const { skillId, path } = action.payload
      const existing = getOrCreateEditState(state, skillId)
      const nextExtraFiles = { ...existing.extraFiles }
      delete nextExtraFiles[path]
      const nextSelection =
        state.selection?.skillId === skillId &&
        state.selection?.nodeType === "extra-file" &&
        state.selection?.filePath === path
          ? { skillId, nodeType: "skill-md" as const }
          : state.selection
      return {
        ...state,
        selection: nextSelection,
        editStates: {
          ...state.editStates,
          [skillId]: {
            ...existing,
            extraFiles: nextExtraFiles,
            deletedExtraPaths: [...existing.deletedExtraPaths, path],
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

    case "SAVE_SKILL": {
      const { skillId, serializedContent } = action.payload
      const es = state.editStates[skillId]
      if (!es) return state
      const skills = state.skills.map((s) => {
        if (s.id !== skillId) return s
        const extraFiles = { ...s.extraFiles }
        for (const [p, content] of Object.entries(es.extraFiles)) {
          if (extraFiles[p]) extraFiles[p] = { ...extraFiles[p], content }
        }
        for (const dp of es.deletedExtraPaths) {
          delete extraFiles[dp]
        }
        const configFiles = structuredClone(es.configFiles)
        return {
          ...s,
          frontmatter: structuredClone(es.frontmatter),
          configFiles,
          extraFiles,
          hasConfig: Object.keys(configFiles).length > 0,
          rawContent: serializedContent,
        }
      })
      const nextEdits = { ...state.editStates }
      delete nextEdits[skillId]
      return { ...state, skills, editStates: nextEdits }
    }

    case "ADD_SKILL": {
      const skill = action.payload
      if (state.skills.some((s) => s.id === skill.id)) return state
      return {
        ...state,
        skills: [...state.skills, skill],
        selection: { skillId: skill.id, nodeType: "skill-overview" },
      }
    }

    case "REMOVE_SKILL": {
      const { skillId } = action.payload
      const skills = state.skills.filter((s) => s.id !== skillId)
      const editStates = { ...state.editStates }
      delete editStates[skillId]
      const selection =
        state.selection?.skillId === skillId
          ? skills.length > 0
            ? { skillId: skills[0].id, nodeType: "skill-overview" as const }
            : null
          : state.selection
      return { ...state, skills, editStates, selection }
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
  updateExtraFile: (skillId: string, path: string, content: string) => void
  updateSkillBody: (skillId: string, body: string) => void
  markSaved: (skillId: string, serializedContent: string) => void
  addSkill: (skill: ParsedSkill) => void
  removeSkill: (skillId: string) => void
  removeConfigFile: (skillId: string, path: string) => void
  removeExtraFile: (skillId: string, path: string) => void
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
  const updateExtraFile = (skillId: string, path: string, content: string) =>
    dispatch({ type: "UPDATE_EXTRA_FILE", payload: { skillId, path, content } })
  const updateSkillBody = (skillId: string, body: string) =>
    dispatch({ type: "UPDATE_SKILL_BODY", payload: { skillId, body } })
  const markSaved = (skillId: string, serializedContent: string) =>
    dispatch({ type: "SAVE_SKILL", payload: { skillId, serializedContent } })
  const addSkill = (skill: ParsedSkill) =>
    dispatch({ type: "ADD_SKILL", payload: skill })
  const removeSkill = (skillId: string) =>
    dispatch({ type: "REMOVE_SKILL", payload: { skillId } })
  const removeConfigFile = (skillId: string, path: string) =>
    dispatch({ type: "REMOVE_CONFIG_FILE", payload: { skillId, path } })
  const removeExtraFile = (skillId: string, path: string) =>
    dispatch({ type: "REMOVE_EXTRA_FILE", payload: { skillId, path } })

  return useMemo<WorkspaceContextValue>(
    () => ({ state, dispatch, selectedSkill, editState, select, updateFrontmatter, updateConfig, updateExtraFile, updateSkillBody, markSaved, addSkill, removeSkill, removeConfigFile, removeExtraFile }),
    [state, dispatch, selectedSkill, editState],
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceContext.Provider")
  return ctx
}
