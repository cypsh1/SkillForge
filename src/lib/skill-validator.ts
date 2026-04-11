import type { ParsedSkill } from "@/types/skill"

export type ValidationSeverity = "error" | "warning" | "info"

export interface ValidationIssue {
  severity: ValidationSeverity
  field: string
  message: string
}

export interface ValidationResult {
  issues: ValidationIssue[]
  isValid: boolean
}

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function push(
  issues: ValidationIssue[],
  severity: ValidationSeverity,
  field: string,
  message: string
) {
  issues.push({ severity, field, message })
}

export function validateSkill(skill: ParsedSkill): ValidationResult {
  const issues: ValidationIssue[] = []
  const name = skill.frontmatter.name?.trim() ?? ""

  if (!name || name.toLowerCase() === "unknown") {
    push(issues, "error", "name", "名称不能为空或为 unknown")
  } else if (!KEBAB_CASE.test(name)) {
    push(
      issues,
      "error",
      "name",
      "名称应为 kebab-case（小写字母、数字与连字符）"
    )
  }

  const fmDesc = skill.frontmatter.description?.trim() ?? ""
  const bodyDesc = skill.description?.trim() ?? ""
  if (!fmDesc && !bodyDesc) {
    push(issues, "warning", "description", "缺少描述")
  }

  const version = skill.frontmatter.version?.trim() ?? ""
  if (!version) {
    push(issues, "warning", "version", "未设置 version")
  }

  skill.envVars.forEach((ev, i) => {
    if (!ev.name?.trim()) {
      push(issues, "warning", `envVars[${i}].name`, "环境变量名为空")
    }
    if (!ev.description?.trim()) {
      push(issues, "warning", `envVars[${i}].description`, "环境变量说明为空")
    }
  })

  if (skill.tools.length === 0) {
    push(issues, "warning", "tools", "未定义任何工具")
  }

  skill.tools.forEach((t, i) => {
    if (!t.name?.trim()) {
      push(issues, "warning", `tools[${i}].name`, "工具名为空")
    }
  })

  if (skill.envVars.length > 10) {
    push(issues, "info", "envVars", `环境变量较多（${skill.envVars.length} 个）`)
  }

  if (skill.hasConfig || Object.keys(skill.configFiles).length > 0) {
    push(issues, "info", "configFiles", "包含配置文件")
  }

  const crossIssues = crossFileValidate(skill)
  issues.push(...crossIssues)

  const hasError = issues.some((i) => i.severity === "error")
  return {
    issues,
    isValid: !hasError,
  }
}

function crossFileValidate(skill: ParsedSkill): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const allFilePaths = new Set([
    ...Object.keys(skill.configFiles),
    ...Object.keys(skill.extraFiles),
  ])

  // 1. files.read reference check
  const fm = skill.frontmatter as Record<string, unknown>
  const filesObj = fm.files as { read?: string[]; write?: string[] } | undefined
  const readPaths = filesObj?.read ?? []
  for (const refPath of readPaths) {
    const trimmed = typeof refPath === "string" ? refPath.trim() : ""
    if (!trimmed || trimmed.startsWith("<") || trimmed.startsWith("/tmp")) continue
    const isDir = trimmed.endsWith("/")
    const matched = isDir
      ? [...allFilePaths].some((fp) => fp.startsWith(trimmed) || fp.startsWith(trimmed.replace(/\/$/, "")))
      : allFilePaths.has(trimmed)
    if (!matched) {
      push(issues, "warning", "files.read", `引用路径 "${trimmed}" 未在项目文件中找到`)
    }
  }

  // 2. files.write empty path check
  const writePaths = filesObj?.write ?? []
  for (const refPath of writePaths) {
    const trimmed = typeof refPath === "string" ? refPath.trim() : ""
    if (!trimmed) {
      push(issues, "warning", "files.write", "存在空的写入路径")
    }
  }

  // 3. Source-Topic linking
  const sourcesKey = Object.keys(skill.configFiles).find((k) => k.endsWith("sources.json"))
  const topicsKey = Object.keys(skill.configFiles).find((k) => k.endsWith("topics.json"))
  if (sourcesKey && topicsKey) {
    const sourcesData = skill.configFiles[sourcesKey] as
      | { sources?: Array<{ topics?: string[] }> }
      | undefined
    const topicsData = skill.configFiles[topicsKey] as
      | { topics?: Array<{ id?: string }> }
      | undefined
    if (sourcesData?.sources && topicsData?.topics) {
      const topicIds = new Set(
        topicsData.topics.map((t) => t.id).filter(Boolean) as string[],
      )
      for (const source of sourcesData.sources) {
        for (const topicRef of source.topics ?? []) {
          if (!topicIds.has(topicRef)) {
            push(issues, "warning", "cross:source-topic", `数据源引用了不存在的主题 "${topicRef}"`)
          }
        }
      }
    }
  }

  // 4. Env var usage scan
  const envVars = skill.envVars ?? []
  if (envVars.length > 0 && Object.keys(skill.extraFiles).length > 0) {
    const allExtraContent = Object.values(skill.extraFiles)
      .map((f) => (typeof f === "string" ? f : f.content))
      .join("\n")
    const bodyContent = skill.rawContent ?? ""
    const searchContent = allExtraContent + "\n" + bodyContent
    for (const ev of envVars) {
      const varName = ev.name?.trim()
      if (!varName) continue
      if (!searchContent.includes(varName)) {
        push(issues, "warning", `env:${varName}`, `环境变量 "${varName}" 未在任何文件中被引用`)
      }
    }
  }

  // 5. Script reference check in markdown body
  const scriptRefPattern = /`([^`]*\.(?:py|sh|js))`/g
  const bodyText = skill.rawContent ?? ""
  let match: RegExpExecArray | null
  while ((match = scriptRefPattern.exec(bodyText)) !== null) {
    const refPath = match[1]
    if (!allFilePaths.has(refPath)) {
      const baseNameMatch = [...allFilePaths].some(
        (fp) => fp.endsWith(refPath) || refPath.endsWith(fp),
      )
      if (!baseNameMatch) {
        push(issues, "warning", "cross:script-ref", `文档中引用的脚本 "${refPath}" 未在项目文件中找到`)
      }
    }
  }

  return issues
}
