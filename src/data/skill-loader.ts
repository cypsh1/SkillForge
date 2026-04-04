import { parseSkillMd } from "@/lib/skill-parser"
import type { ParsedSkill } from "@/types/skill"

import imageOcrSkillMd from "./test-skills/image-ocr/SKILL.md?raw"
import urlReaderSkillMd from "./test-skills/url-reader/SKILL.md?raw"
import techNewsDigestSkillMd from "./test-skills/tech-news-digest/SKILL.md?raw"
import techNewsDigestCnSkillMd from "./test-skills/tech-news-digest-cn/SKILL.md?raw"
import agentBrowserSkillMd from "./test-skills/agent-browser/SKILL.md?raw"
import deepWritingSkillMd from "./test-skills/deep-writing/SKILL.md?raw"
import tieredMemorySkillMd from "./test-skills/tiered-memory/SKILL.md?raw"
import taskDecomposerSkillMd from "./test-skills/task-decomposer/SKILL.md?raw"
import skillSecurityAuditorSkillMd from "./test-skills/skill-security-auditor/SKILL.md?raw"

import techNewsSourcesJson from "./test-skills/tech-news-digest/config/defaults/sources.json"
import techNewsTopicsJson from "./test-skills/tech-news-digest/config/defaults/topics.json"
import techNewsSchemaJson from "./test-skills/tech-news-digest/config/schema.json"
import techNewsCnSourcesJson from "./test-skills/tech-news-digest-cn/config/defaults/sources.json"
import techNewsCnTopicsJson from "./test-skills/tech-news-digest-cn/config/defaults/topics.json"
import techNewsCnSchemaJson from "./test-skills/tech-news-digest-cn/config/schema.json"

interface RawSkillData {
  id: string
  skillMdContent: string
  path: string
  configFiles?: Record<string, unknown>
}

const RAW_SKILLS: RawSkillData[] = [
  {
    id: "tech-news-digest",
    skillMdContent: techNewsDigestSkillMd,
    path: "~/.openclaw/workspace/skills/tech-news-digest",
    configFiles: {
      "config/defaults/sources.json": techNewsSourcesJson,
      "config/defaults/topics.json": techNewsTopicsJson,
      "config/schema.json": techNewsSchemaJson,
    },
  },
  {
    id: "tech-news-digest-cn",
    skillMdContent: techNewsDigestCnSkillMd,
    path: "~/.openclaw/workspace/skills/tech-news-digest-cn",
    configFiles: {
      "config/defaults/sources.json": techNewsCnSourcesJson,
      "config/defaults/topics.json": techNewsCnTopicsJson,
      "config/schema.json": techNewsCnSchemaJson,
    },
  },
  {
    id: "agent-browser",
    skillMdContent: agentBrowserSkillMd,
    path: "~/.openclaw/workspace/skills/agent-browser",
  },
  {
    id: "deep-writing",
    skillMdContent: deepWritingSkillMd,
    path: "~/.openclaw/workspace/skills/deep-writing",
  },
  {
    id: "tiered-memory",
    skillMdContent: tieredMemorySkillMd,
    path: "~/.openclaw/workspace/skills/tiered-memory",
  },
  {
    id: "task-decomposer",
    skillMdContent: taskDecomposerSkillMd,
    path: "~/.openclaw/workspace/skills/task-decomposer",
  },
  {
    id: "skill-security-auditor",
    skillMdContent: skillSecurityAuditorSkillMd,
    path: "~/.openclaw/workspace/skills/skill-security-auditor",
  },
  {
    id: "url-reader",
    skillMdContent: urlReaderSkillMd,
    path: "~/.openclaw/workspace/skills/url-reader",
  },
  {
    id: "image-ocr",
    skillMdContent: imageOcrSkillMd,
    path: "~/.openclaw/workspace/skills/image-ocr",
  },
]

let cachedSkills: ParsedSkill[] | null = null

export function loadTestSkills(): ParsedSkill[] {
  if (cachedSkills) return cachedSkills

  cachedSkills = RAW_SKILLS.map((raw) => {
    const skill = parseSkillMd(raw.skillMdContent, raw.id, raw.path)
    if (raw.configFiles) {
      skill.configFiles = raw.configFiles
      skill.hasConfig = true
    }
    return skill
  })

  return cachedSkills
}

export function getSkillById(id: string): ParsedSkill | undefined {
  return loadTestSkills().find((s) => s.id === id)
}
