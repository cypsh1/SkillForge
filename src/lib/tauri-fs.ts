import { parseSkillMd } from "@/lib/skill-parser"
import type { ParsedSkill, ExtraFile, ExtraFileType } from "@/types/skill"

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window
}

const SKILLS_DIR = ".openclaw/workspace/skills"

async function getTauriFsModule() {
  return import("@tauri-apps/plugin-fs")
}

export async function loadLocalSkills(): Promise<ParsedSkill[]> {
  const fs = await getTauriFsModule()

  const homeDir = await getHomeDir()
  const skillsPath = `${homeDir}/${SKILLS_DIR}`

  const dirExists = await fs.exists(skillsPath)
  if (!dirExists) return []

  const entries = await fs.readDir(skillsPath)
  const skills: ParsedSkill[] = []

  for (const entry of entries) {
    if (!entry.isDirectory) continue
    const skillDir = `${skillsPath}/${entry.name}`

    const skillMdPath = `${skillDir}/SKILL.md`
    const hasSKillMd = await fs.exists(skillMdPath)
    if (!hasSKillMd) continue

    try {
      const content = await fs.readTextFile(skillMdPath)
      const skill = parseSkillMd(content, entry.name, skillDir)

      const configFiles = await loadConfigFiles(fs, skillDir)
      if (Object.keys(configFiles).length > 0) {
        skill.configFiles = configFiles
        skill.hasConfig = true
      }

      const extraFiles = await loadExtraFiles(fs, skillDir)
      if (Object.keys(extraFiles).length > 0) {
        skill.extraFiles = extraFiles
      }

      skills.push(skill)
    } catch (err) {
      console.warn(`Failed to load skill ${entry.name}:`, err)
    }
  }

  return skills.sort((a, b) => a.id.localeCompare(b.id))
}

async function loadConfigFiles(
  fs: Awaited<ReturnType<typeof getTauriFsModule>>,
  skillDir: string,
): Promise<Record<string, unknown>> {
  const configFiles: Record<string, unknown> = {}
  const configDir = `${skillDir}/config`

  if (!(await fs.exists(configDir))) return configFiles

  await walkJsonFiles(fs, configDir, "", configFiles)
  return configFiles
}

async function walkJsonFiles(
  fs: Awaited<ReturnType<typeof getTauriFsModule>>,
  baseDir: string,
  relativePath: string,
  result: Record<string, unknown>,
) {
  const fullPath = relativePath ? `${baseDir}/${relativePath}` : baseDir
  const entries = await fs.readDir(fullPath)

  for (const entry of entries) {
    const childRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name
    const childFull = `${baseDir}/${childRelative}`

    if (entry.isDirectory) {
      await walkJsonFiles(fs, baseDir, childRelative, result)
    } else if (entry.name.endsWith(".json")) {
      try {
        const text = await fs.readTextFile(childFull)
        result[`config/${childRelative}`] = JSON.parse(text)
      } catch (err) {
        console.warn(`Failed to parse ${childFull}:`, err)
      }
    }
  }
}

const TEXT_EXTENSIONS = new Set(["md", "json", "py", "sh", "js", "txt", "toml"])

function inferFileType(path: string): ExtraFileType {
  if (path.endsWith(".json")) return "json"
  if (path.endsWith(".md")) return "markdown"
  if (path.endsWith(".py")) return "python"
  if (path.endsWith(".sh")) return "shell"
  return "text"
}

async function loadExtraFiles(
  fs: Awaited<ReturnType<typeof getTauriFsModule>>,
  skillDir: string,
): Promise<Record<string, ExtraFile>> {
  const result: Record<string, ExtraFile> = {}
  await walkTextFiles(fs, skillDir, "", result)
  return result
}

async function walkTextFiles(
  fs: Awaited<ReturnType<typeof getTauriFsModule>>,
  baseDir: string,
  relativePath: string,
  result: Record<string, ExtraFile>,
) {
  const fullPath = relativePath ? `${baseDir}/${relativePath}` : baseDir
  const entries = await fs.readDir(fullPath)

  for (const entry of entries) {
    const childRelative = relativePath
      ? `${relativePath}/${entry.name}`
      : entry.name

    if (entry.isDirectory) {
      if (entry.name === "config" && !relativePath) continue
      await walkTextFiles(fs, baseDir, childRelative, result)
    } else {
      if (!relativePath && entry.name === "SKILL.md") continue
      const ext = entry.name.split(".").pop()?.toLowerCase()
      if (!ext || !TEXT_EXTENSIONS.has(ext)) continue
      try {
        const text = await fs.readTextFile(`${baseDir}/${childRelative}`)
        result[childRelative] = { path: childRelative, content: text, type: inferFileType(childRelative) }
      } catch {
        // skip unreadable files
      }
    }
  }
}

export async function saveSkillFile(
  skillPath: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const fs = await getTauriFsModule()
  const fullPath = `${skillPath}/${relativePath}`
  await fs.writeTextFile(fullPath, content)
}

export async function saveSkillConfig(
  skillPath: string,
  configRelativePath: string,
  data: unknown,
): Promise<void> {
  const content = JSON.stringify(data, null, 2)
  await saveSkillFile(skillPath, configRelativePath, content)
}

export async function createLocalSkillBundle(
  skillName: string,
  skillMd: string,
  options?: { configurable?: boolean },
): Promise<string> {
  const fs = await getTauriFsModule()
  const root = `${await getHomeDir()}/${SKILLS_DIR}`
  await fs.mkdir(root, { recursive: true })
  const skillPath = `${root}/${skillName}`
  await fs.mkdir(skillPath, { recursive: true })
  if (options?.configurable) {
    await fs.mkdir(`${skillPath}/config/defaults`, { recursive: true })
  }
  await saveSkillFile(skillPath, "SKILL.md", skillMd)
  return skillPath
}

async function getHomeDir(): Promise<string> {
  const { homeDir } = await import("@tauri-apps/api/path")
  const home = await homeDir()
  return home.endsWith("/") ? home.slice(0, -1) : home
}
