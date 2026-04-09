import { parseSkillMd } from "@/lib/skill-parser"
import type { ParsedSkill, ExtraFile, ExtraFileType } from "@/types/skill"

// --- Vite glob imports (auto-discover all files under test-skills/) ---

const skillMdModules = import.meta.glob<string>(
  "./test-skills/*/SKILL.md",
  { query: "?raw", import: "default", eager: true },
)

const configModules = import.meta.glob<Record<string, unknown>>(
  "./test-skills/*/config/**/*.json",
  { import: "default", eager: true },
)

const extraModules = import.meta.glob<string>(
  [
    "./test-skills/*/*.{md,json,py,sh,js,txt,toml}",
    "./test-skills/*/*/**/*.{md,json,py,sh,js,txt,toml}",
    "./test-skills/*/.clawhub/**/*.json",
    "!./test-skills/*/SKILL.md",
    "!./test-skills/*/config/**",
  ],
  { query: "?raw", import: "default", eager: true },
)

// --- Helpers ---

const PATH_RE = /\.\/test-skills\/([^/]+)\/(.+)$/

function inferFileType(path: string): ExtraFileType {
  if (path.endsWith(".json")) return "json"
  if (path.endsWith(".md")) return "markdown"
  if (path.endsWith(".py")) return "python"
  if (path.endsWith(".sh")) return "shell"
  return "text"
}

// --- Public API (signatures unchanged) ---

let cachedSkills: ParsedSkill[] | null = null

export function loadTestSkills(): ParsedSkill[] {
  if (cachedSkills) return cachedSkills

  const skillMap = new Map<
    string,
    { content: string; configFiles: Record<string, unknown>; extraFiles: Record<string, ExtraFile> }
  >()

  for (const [path, content] of Object.entries(skillMdModules)) {
    const m = PATH_RE.exec(path)
    if (!m) continue
    skillMap.set(m[1], { content, configFiles: {}, extraFiles: {} })
  }

  for (const [path, jsonObj] of Object.entries(configModules)) {
    const m = PATH_RE.exec(path)
    if (!m) continue
    const entry = skillMap.get(m[1])
    if (entry) entry.configFiles[m[2]] = jsonObj
  }

  for (const [path, rawContent] of Object.entries(extraModules)) {
    const m = PATH_RE.exec(path)
    if (!m) continue
    const entry = skillMap.get(m[1])
    if (entry) {
      entry.extraFiles[m[2]] = { path: m[2], content: rawContent, type: inferFileType(m[2]) }
    }
  }

  cachedSkills = []
  for (const [id, data] of skillMap) {
    const skill = parseSkillMd(data.content, id, `~/.openclaw/workspace/skills/${id}`)
    if (Object.keys(data.configFiles).length > 0) {
      skill.configFiles = data.configFiles
      skill.hasConfig = true
    }
    if (Object.keys(data.extraFiles).length > 0) {
      skill.extraFiles = data.extraFiles
    }
    cachedSkills.push(skill)
  }

  cachedSkills.sort((a, b) => a.id.localeCompare(b.id))
  return cachedSkills
}

export function getSkillById(id: string): ParsedSkill | undefined {
  return loadTestSkills().find((s) => s.id === id)
}
