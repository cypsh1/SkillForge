import { parseSkillMd } from "@/lib/skill-parser"
import type { ParsedSkill } from "@/types/skill"

// Vite raw imports for SKILL.md files
import imageOcrSkillMd from "./test-skills/image-ocr/SKILL.md?raw"
import urlReaderSkillMd from "./test-skills/url-reader/SKILL.md?raw"
import techNewsDigestSkillMd from "./test-skills/tech-news-digest/SKILL.md?raw"

// JSON config imports
import techNewsSourcesJson from "./test-skills/tech-news-digest/config/defaults/sources.json"
import techNewsTopicsJson from "./test-skills/tech-news-digest/config/defaults/topics.json"
import techNewsSchemaJson from "./test-skills/tech-news-digest/config/schema.json"

interface RawSkillData {
  id: string
  skillMdContent: string
  path: string
  configFiles?: Record<string, unknown>
}

const RAW_SKILLS: RawSkillData[] = [
  {
    id: "image-ocr",
    skillMdContent: imageOcrSkillMd,
    path: "~/.openclaw/workspace/skills/image-ocr",
  },
  {
    id: "url-reader",
    skillMdContent: urlReaderSkillMd,
    path: "~/.openclaw/workspace/skills/url-reader",
  },
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
