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

  const hasError = issues.some((i) => i.severity === "error")
  return {
    issues,
    isValid: !hasError,
  }
}
