import { parseSkillMd } from "@/lib/skill-parser"
import { importSkillBundle, loadLocalSkills } from "@/lib/tauri-fs"
import { searchSkills, getSkillMeta, downloadSkill } from "@/lib/clawhub-api"
import { parseGitHubUrl, downloadSkillDirectory } from "@/lib/github-api"
import type { ParsedSkill, SkillBundle } from "@/types/skill"

// Re-export ClawHub API for convenience
export { searchSkills, getSkillMeta }
export type { ClawHubSkill, ClawHubSkillDetail } from "@/lib/clawhub-api"

/**
 * Import a skill from ClawHub: download → write to local disk → parse → return
 */
export async function importFromClawHub(
  slug: string,
  version?: string,
  token?: string,
): Promise<ParsedSkill> {
  const bundle = await downloadSkill(slug, version, token)
  return importBundle(slug, bundle, {
    type: "clawhub",
    slug,
    version: version ?? "latest",
  })
}

/**
 * Import a skill from GitHub URL: download → write to local disk → parse → return
 */
export async function importFromGitHub(
  url: string,
  token?: string,
): Promise<ParsedSkill> {
  const parsed = parseGitHubUrl(url)
  if (!parsed) throw new Error("Invalid GitHub URL")

  const { owner, repo, ref, path } = parsed
  const bundle = await downloadSkillDirectory(owner, repo, path, ref, token)

  if (bundle.files.length === 0) {
    throw new Error("No files found at the specified path")
  }

  // Derive skill name from the directory path or repo name
  const skillName = path
    ? path.split("/").pop() || repo
    : repo

  return importBundle(skillName, bundle, {
    type: "github",
    owner,
    repo,
    path,
    ref,
  })
}

/**
 * Shared: write bundle to local disk, parse, and attach origin metadata
 */
async function importBundle(
  skillName: string,
  bundle: SkillBundle,
  origin: ParsedSkill["origin"],
): Promise<ParsedSkill> {
  // Write all files to local skill directory
  const skillPath = await importSkillBundle(
    skillName,
    bundle.files.map((f) => ({ relativePath: f.path, content: f.content })),
  )

  // Re-load from disk to get a properly parsed skill (reuses existing loading logic)
  const allSkills = await loadLocalSkills()
  const imported = allSkills.find((s) => s.id === skillName)
  if (!imported) {
    // Fallback: parse SKILL.md from bundle directly
    const skillMdFile = bundle.files.find(
      (f) => f.path === "SKILL.md" || f.path.endsWith("/SKILL.md"),
    )
    if (!skillMdFile) throw new Error("No SKILL.md found in bundle")
    const skill = parseSkillMd(skillMdFile.content, skillName, skillPath)
    skill.origin = origin
    return skill
  }

  imported.origin = origin
  return imported
}
