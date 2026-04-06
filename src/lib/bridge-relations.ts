import type { ParsedSkill, SkillFrontmatter } from "@/types/skill"
import { getOpenclawMetadata } from "@/lib/schemas/frontmatter-schema"

export type RelationType = "→" | "↔" | "⊂"

export interface BridgeRelation {
  t: RelationType
  id: string
  lb: string
  d: string
}

export const RELATION_TYPE_LABEL: Record<RelationType, string> = {
  "→": "引用",
  "↔": "替代",
  "⊂": "包含",
}

// ── Dynamic relation store ──────────────────────────────

let _store: Record<string, BridgeRelation[]> = {}

export function setRelationStore(r: Record<string, BridgeRelation[]>): void {
  _store = r
}

export function getRelationStore(): Record<string, BridgeRelation[]> {
  return _store
}

export function normalizeEid(input: string): string {
  return input.trim()
}

export function getRelations(eid?: string | null): BridgeRelation[] {
  if (eid == null) return []
  const key = normalizeEid(eid)
  if (!key) return []
  return _store[key] ?? []
}

export function getRelationCountSummary(eid?: string | null): {
  forward: number
  alternate: number
  contains: number
} {
  const rels = getRelations(eid)
  let forward = 0
  let alternate = 0
  let contains = 0
  for (const r of rels) {
    if (r.t === "→") forward += 1
    else if (r.t === "↔") alternate += 1
    else if (r.t === "⊂") contains += 1
  }
  return { forward, alternate, contains }
}

// ── Heuristic relation builder ──────────────────────────

function extractScriptNames(skill: ParsedSkill): string[] {
  const names: string[] = []
  let inScriptParent = false
  let parentLevel = 0

  for (const s of skill.sections) {
    if (/脚本|script|pipeline/i.test(s.title)) {
      inScriptParent = true
      parentLevel = s.level
    } else if (inScriptParent && s.level <= parentLevel) {
      inScriptParent = false
    }

    if (!inScriptParent && !/\.py\b/i.test(s.title)) continue

    const codeBlocks = s.content.match(/`([a-z][\w-]*(?:\.py)?)`/gi) ?? []
    for (const cb of codeBlocks) {
      const raw = cb.replace(/`/g, "")
      names.push(raw.replace(/\.py$/i, ""))
    }
    const pyMatch = s.title.match(/`?([\w-]+\.py)`?/i)
    if (pyMatch) {
      names.push(pyMatch[1].replace(/\.py$/i, ""))
    }
  }
  return [...new Set(names)]
}

function matchScriptsByKeywords(
  description: string,
  scripts: string[],
): string[] {
  const desc = description.toLowerCase()
  const matched: string[] = []
  for (const script of scripts) {
    const parts = script.split("-")
    for (const part of parts) {
      if (part.length >= 3 && desc.includes(part)) {
        matched.push(script)
        break
      }
    }
  }
  return matched
}

export function buildBridgeRelations(
  skill: ParsedSkill | null,
  fm: SkillFrontmatter | null,
): Record<string, BridgeRelation[]> {
  if (!skill || !fm) return {}
  const result: Record<string, BridgeRelation[]> = {}

  const push = (src: string, rel: BridgeRelation) => {
    ;(result[src] ??= []).push(rel)
  }

  const scripts = extractScriptNames(skill)
  const envVars = fm.env ?? []
  const ocMeta = getOpenclawMetadata(fm.metadata)
  const reqBins: string[] = ocMeta?.requires?.bins ?? []
  const optBins: string[] = ocMeta?.optionalBins ?? []
  const readPaths = Array.isArray(fm.files?.read) ? fm.files!.read.map(String) : []
  const writePaths = Array.isArray(fm.files?.write) ? fm.files!.write.map(String) : []
  const allPaths = [...readPaths, ...writePaths]

  // env var → scripts (keyword match from description)
  for (const ev of envVars) {
    const matched = matchScriptsByKeywords(ev.description ?? "", scripts)
    for (const s of matched) {
      push(ev.name, { t: "→", id: s, lb: `${s}.py`, d: ev.description ?? "" })
    }
  }

  // env vars that mention each other as alternatives
  for (let i = 0; i < envVars.length; i++) {
    for (let j = i + 1; j < envVars.length; j++) {
      const a = envVars[i]
      const b = envVars[j]
      const aDesc = (a.description ?? "").toLowerCase()
      const bDesc = (b.description ?? "").toLowerCase()
      if (
        (aDesc.includes("fallback") && aDesc.includes(b.name.toLowerCase())) ||
        (bDesc.includes("fallback") && bDesc.includes(a.name.toLowerCase())) ||
        (aDesc.includes("alternative") && aDesc.includes(b.name.toLowerCase())) ||
        (bDesc.includes("alternative") && bDesc.includes(a.name.toLowerCase()))
      ) {
        push(a.name, { t: "↔", id: b.name, lb: b.name, d: `${b.description ?? ""}` })
        push(b.name, { t: "↔", id: a.name, lb: a.name, d: `${a.description ?? ""}` })
      }
    }
  }

  // required bins → pipeline scripts
  for (const bin of reqBins) {
    if (/python/i.test(bin)) {
      const pipeline = scripts.find(
        (s) => /pipeline|run/i.test(s),
      )
      if (pipeline) {
        push(bin, { t: "→", id: pipeline, lb: `${pipeline}.py`, d: `执行 Python 脚本` })
      }
    }
  }

  // optional bins: detect mail/gog style alternates
  for (let i = 0; i < optBins.length; i++) {
    for (let j = i + 1; j < optBins.length; j++) {
      const a = optBins[i]
      const b = optBins[j]
      push(a, { t: "↔", id: b, lb: b, d: "可选工具互为替代" })
      push(b, { t: "↔", id: a, lb: a, d: "可选工具互为替代" })
    }
  }

  // pipeline script → sub-scripts
  for (const script of scripts) {
    if (/pipeline|run/i.test(script)) {
      for (const sub of scripts) {
        if (sub === script) continue
        if (/fetch|merge|generate|collect/i.test(sub)) {
          push(script, {
            t: "→",
            id: sub,
            lb: `${sub}.py`,
            d: `${script} 调用子脚本`,
          })
        }
      }
    }
  }

  // config files
  const configDirs = new Set<string>()
  for (const p of allPaths) {
    if (p.includes("config/defaults/")) configDirs.add("config-defaults")
    if (p.includes("references/")) configDirs.add("references-dir")
  }

  // config-defaults → sub-files
  if (configDirs.has("config-defaults")) {
    for (const p of allPaths) {
      const basename = p.split("/").pop()
      if (basename?.endsWith(".json") && p.includes("config/defaults/")) {
        push("config-defaults", {
          t: "⊂",
          id: basename,
          lb: basename,
          d: `默认配置文件`,
        })
        // json config → matched scripts
        const baseName = basename.replace(/\.json$/i, "")
        const matched = matchScriptsByKeywords(baseName, scripts)
        for (const s of matched) {
          push(basename, { t: "→", id: s, lb: `${s}.py`, d: `配置供脚本使用` })
        }
      }
    }
  }

  // merge-sources → topics.json, tmp-output
  for (const script of scripts) {
    if (/merge/i.test(script)) {
      const topicsFile = allPaths.find((p) => p.includes("topics.json"))
      if (topicsFile) {
        push(script, { t: "→", id: "topics.json", lb: "topics.json", d: "按主题分组合并数据" })
      }
      if (writePaths.some((p) => p.includes("/tmp/"))) {
        push(script, { t: "→", id: "tmp-output", lb: "/tmp/td-*", d: "输出中间数据" })
      }
    }
  }

  // generate-pdf → weasyprint
  for (const script of scripts) {
    if (/generate.*pdf|pdf.*generate/i.test(script)) {
      if (optBins.includes("weasyprint")) {
        push(script, { t: "→", id: "weasyprint", lb: "weasyprint", d: "HTML 转 PDF 引擎" })
      }
      if (configDirs.has("references-dir")) {
        push(script, { t: "→", id: "references-dir", lb: "references/", d: "读取输出模板" })
      }
    }
  }

  return result
}
