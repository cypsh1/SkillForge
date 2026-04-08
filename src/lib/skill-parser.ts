import { parse as parseYaml } from "yaml"
import type { ParsedSkill, SkillFrontmatter, SkillTool, ToolParameter, MarkdownSection } from "@/types/skill"

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/

/**
 * Parse a SKILL.md file content into a structured ParsedSkill object.
 */
export function parseSkillMd(
  content: string,
  skillId: string,
  skillPath: string = "",
): ParsedSkill {
  const { frontmatter, body } = extractFrontmatter(content)
  const sections = extractSections(body)
  const tools = extractTools(frontmatter, sections)
  const envVars = extractEnvVars(frontmatter)

  return {
    id: skillId,
    path: skillPath,
    frontmatter,
    description: frontmatter.description ?? extractLeadParagraph(body),
    tools,
    envVars,
    sections,
    rawContent: content,
    hasConfig: false,
    configFiles: {},
    extraFiles: {},
  }
}

/**
 * Extract YAML frontmatter and markdown body from SKILL.md content.
 */
export function extractFrontmatter(content: string): {
  frontmatter: SkillFrontmatter
  body: string
} {
  const match = content.match(FRONTMATTER_REGEX)
  if (!match) {
    return {
      frontmatter: { name: "unknown" },
      body: content,
    }
  }

  let frontmatter: SkillFrontmatter
  try {
    frontmatter = parseYaml(match[1]) as SkillFrontmatter
  } catch {
    frontmatter = { name: "unknown" }
  }

  if (!frontmatter.name) {
    frontmatter.name = "unknown"
  }

  return {
    frontmatter,
    body: match[2].trim(),
  }
}

/**
 * Extract markdown sections by headings.
 * Returns a flat array of sections with their heading level, title, and content.
 * Skips headings inside fenced code blocks (``` ... ```).
 */
export function extractSections(body: string): MarkdownSection[] {
  const lines = body.split("\n")
  const sections: MarkdownSection[] = []
  let currentSection: MarkdownSection | null = null
  let inCodeBlock = false

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock
      if (currentSection) currentSection.content += line + "\n"
      continue
    }

    if (inCodeBlock) {
      if (currentSection) currentSection.content += line + "\n"
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      if (currentSection) {
        currentSection.content = currentSection.content.trim()
        sections.push(currentSection)
      }
      currentSection = {
        level: headingMatch[1].length,
        title: headingMatch[2].trim(),
        content: "",
      }
    } else if (currentSection) {
      currentSection.content += line + "\n"
    }
  }

  if (currentSection) {
    currentSection.content = currentSection.content.trim()
    sections.push(currentSection)
  }

  return sections
}

/**
 * Extract the first paragraph from markdown body as a fallback description.
 */
function extractLeadParagraph(body: string): string {
  const lines = body.split("\n")
  const paragraphLines: string[] = []
  let started = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (started) break
      continue
    }
    if (trimmed.startsWith("#")) {
      if (started) break
      continue
    }
    if (trimmed.startsWith(">")) {
      if (started) break
      continue
    }
    started = true
    paragraphLines.push(trimmed)
  }

  return paragraphLines.join(" ").slice(0, 300)
}

/**
 * Extract tool definitions from frontmatter and/or markdown body sections.
 *
 * Tools can appear in multiple places:
 * 1. Frontmatter `tools` field (e.g., tech-news-digest)
 * 2. Markdown "## Tools" or "## Commands" sections
 * 3. Markdown "### tool_name" sub-sections under Tools
 */
function extractTools(
  frontmatter: SkillFrontmatter,
  sections: MarkdownSection[],
): SkillTool[] {
  const tools: SkillTool[] = []

  // 1. Extract from frontmatter tools field
  if (frontmatter.tools && Array.isArray(frontmatter.tools)) {
    for (const tool of frontmatter.tools) {
      if (typeof tool === "string") {
        const [name, ...descParts] = tool.split(":")
        tools.push({
          name: name.trim(),
          description: descParts.join(":").trim(),
          parameters: [],
        })
      } else if (typeof tool === "object" && tool !== null) {
        const entries = Object.entries(tool as Record<string, unknown>)
        for (const [name, desc] of entries) {
          tools.push({
            name,
            description: String(desc),
            parameters: [],
          })
        }
      }
    }
  }

  // 2. Extract from markdown sections
  const toolSections = findToolSections(sections)
  for (const section of toolSections) {
    const parsedTool = parseToolSection(section)
    if (parsedTool) {
      const existing = tools.find((t) => t.name === parsedTool.name)
      if (!existing) {
        tools.push(parsedTool)
      }
    }
  }

  return tools
}

/**
 * Find sections that likely define tools (### under ## Tools / ## Commands / ## Scripts).
 */
function findToolSections(sections: MarkdownSection[]): MarkdownSection[] {
  const toolParentTitles = [
    "tools",
    "commands",
    "scripts pipeline",
    "individual scripts",
    "individual scripts (fallback)",
  ]

  const result: MarkdownSection[] = []
  let inToolParent = false
  let parentLevel = 0

  for (const section of sections) {
    const titleLower = section.title.toLowerCase()
    if (
      toolParentTitles.some((t) => titleLower.includes(t)) &&
      section.level <= 2
    ) {
      inToolParent = true
      parentLevel = section.level
      continue
    }

    if (inToolParent) {
      if (section.level <= parentLevel) {
        inToolParent = false
        continue
      }
      if (section.level === parentLevel + 1) {
        result.push(section)
      }
    }
  }

  return result
}

/**
 * Parse a single tool section (### heading + content) into a SkillTool.
 */
function parseToolSection(section: MarkdownSection): SkillTool | null {
  const name = section.title
    .replace(/`/g, "")
    .split(" - ")[0]
    .split(" — ")[0]
    .trim()

  if (!name) return null

  const descParts = section.title.split(/\s[-—]\s/)
  const description =
    descParts.length > 1
      ? descParts.slice(1).join(" - ").trim()
      : extractLeadFromContent(section.content)

  const parameters = extractParametersFromContent(section.content)

  return { name, description, parameters }
}

function extractLeadFromContent(content: string): string {
  const lines = content.split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("```") && !trimmed.startsWith("-") && !trimmed.startsWith("|")) {
      return trimmed.slice(0, 200)
    }
  }
  return ""
}

/**
 * Extract parameters from tool section content.
 * Looks for patterns like:
 * - param_name: type - description
 * - `--param` description
 */
function extractParametersFromContent(content: string): ToolParameter[] {
  const params: ToolParameter[] = []
  const lines = content.split("\n")

  for (const line of lines) {
    // Pattern: - param_name: type - description
    const listMatch = line.match(
      /^\s*-\s+`?(\w[\w-]*)`?\s*[:(]\s*(\w+)\s*[).]?\s*[-—]?\s*(.*)/,
    )
    if (listMatch) {
      params.push({
        name: listMatch[1],
        type: listMatch[2] || "string",
        description: listMatch[3]?.trim() || "",
      })
      continue
    }

    // Pattern: --flag description
    const flagMatch = line.match(/^\s*-\s+`?(--[\w-]+)`?\s+(.*)/);
    if (flagMatch) {
      params.push({
        name: flagMatch[1],
        type: "flag",
        description: flagMatch[2]?.trim() || "",
      })
    }
  }

  return params
}

/**
 * Extract environment variable definitions from frontmatter.
 */
function extractEnvVars(
  frontmatter: SkillFrontmatter,
): ParsedSkill["envVars"] {
  if (!frontmatter.env || !Array.isArray(frontmatter.env)) return []

  return frontmatter.env.map(
    (env: { name: string; required?: boolean; description?: string }) => ({
      name: env.name,
      required: env.required ?? false,
      description: env.description ?? "",
    }),
  )
}
