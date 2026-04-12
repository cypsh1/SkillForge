import { diffLines, type Change } from "diff"
import { stringify } from "yaml"
import type { SkillEditState } from "@/types/workspace"

export interface AreaDiff {
  area: string
  status: "modified" | "added" | "deleted"
  hunks: Change[]
  stats: { added: number; removed: number }
}

function countStats(hunks: Change[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const h of hunks) {
    const lines = h.value.replace(/\n$/, "").split("\n").length
    if (h.added) added += lines
    else if (h.removed) removed += lines
  }
  return { added, removed }
}

function serializeFrontmatter(fm: Record<string, unknown>): string {
  return stringify(fm, { lineWidth: 0, defaultStringType: "QUOTE_DOUBLE", defaultKeyType: "PLAIN" })
}

function serializeJson(data: unknown): string {
  return JSON.stringify(data, null, 2) + "\n"
}

export function computeSkillDiff(editState: SkillEditState): AreaDiff[] {
  const { originalSnapshot: orig } = editState
  const diffs: AreaDiff[] = []

  // Frontmatter
  const oldFm = serializeFrontmatter(orig.frontmatter as Record<string, unknown>)
  const newFm = serializeFrontmatter(editState.frontmatter as Record<string, unknown>)
  if (oldFm !== newFm) {
    const hunks = diffLines(oldFm, newFm)
    diffs.push({ area: "frontmatter", status: "modified", hunks, stats: countStats(hunks) })
  }

  // Markdown body
  if (editState.markdownBody !== orig.markdownBody) {
    const hunks = diffLines(orig.markdownBody, editState.markdownBody)
    diffs.push({ area: "body", status: "modified", hunks, stats: countStats(hunks) })
  }

  // Config files — modified or added
  for (const path of Object.keys(editState.configFiles)) {
    const oldData = orig.configFiles[path]
    const newData = editState.configFiles[path]
    if (oldData === undefined) {
      const newText = serializeJson(newData)
      const hunks = diffLines("", newText)
      diffs.push({ area: path, status: "added", hunks, stats: countStats(hunks) })
    } else if (JSON.stringify(oldData) !== JSON.stringify(newData)) {
      const hunks = diffLines(serializeJson(oldData), serializeJson(newData))
      diffs.push({ area: path, status: "modified", hunks, stats: countStats(hunks) })
    }
  }

  // Config files — deleted
  for (const path of editState.deletedConfigPaths) {
    const oldText = orig.configFiles[path] !== undefined ? serializeJson(orig.configFiles[path]) : ""
    const hunks = diffLines(oldText, "")
    diffs.push({ area: path, status: "deleted", hunks, stats: countStats(hunks) })
  }

  // Extra files — modified or added
  for (const path of Object.keys(editState.extraFiles)) {
    const oldText = orig.extraFiles[path]
    const newText = editState.extraFiles[path]
    if (oldText === undefined) {
      const hunks = diffLines("", newText)
      diffs.push({ area: path, status: "added", hunks, stats: countStats(hunks) })
    } else if (oldText !== newText) {
      const hunks = diffLines(oldText, newText)
      diffs.push({ area: path, status: "modified", hunks, stats: countStats(hunks) })
    }
  }

  // Extra files — deleted
  for (const path of editState.deletedExtraPaths) {
    const oldText = orig.extraFiles[path] ?? ""
    const hunks = diffLines(oldText, "")
    diffs.push({ area: path, status: "deleted", hunks, stats: countStats(hunks) })
  }

  return diffs
}
