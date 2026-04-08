import { parseSkillMd } from "@/lib/skill-parser"
import type { ParsedSkill, ExtraFile } from "@/types/skill"

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

// tech-news-digest extra files
import tndMetaJson from "./test-skills/tech-news-digest/_meta.json?raw"
import tndChangelog from "./test-skills/tech-news-digest/CHANGELOG.md?raw"
import tndReadme from "./test-skills/tech-news-digest/README.md?raw"
import tndClawhubOrigin from "./test-skills/tech-news-digest/.clawhub/origin.json?raw"
import tndFetchRss from "./test-skills/tech-news-digest/scripts/fetch-rss.py?raw"
import tndTestPipeline from "./test-skills/tech-news-digest/scripts/test-pipeline.sh?raw"
import tndDigestPrompt from "./test-skills/tech-news-digest/references/digest-prompt.md?raw"

// url-reader extra files
import urlReaderMetadata from "./test-skills/url-reader/metadata.json?raw"
import urlReaderReadme from "./test-skills/url-reader/README.md?raw"
import urlReaderWechatV2 from "./test-skills/url-reader/scripts/wechat_reader_v2.py?raw"

// image-ocr extra files
import imageOcrMeta from "./test-skills/image-ocr/_meta.json?raw"

interface RawSkillData {
  id: string
  skillMdContent: string
  path: string
  configFiles?: Record<string, unknown>
  extraFiles?: Record<string, ExtraFile>
}

function inferFileType(path: string): ExtraFile["type"] {
  if (path.endsWith(".json")) return "json"
  if (path.endsWith(".md")) return "markdown"
  if (path.endsWith(".py")) return "python"
  if (path.endsWith(".sh")) return "shell"
  return "text"
}

function makeExtraFile(path: string, content: string): ExtraFile {
  return { path, content, type: inferFileType(path) }
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
    extraFiles: {
      "_meta.json": makeExtraFile("_meta.json", tndMetaJson),
      "CHANGELOG.md": makeExtraFile("CHANGELOG.md", tndChangelog),
      "README.md": makeExtraFile("README.md", tndReadme),
      ".clawhub/origin.json": makeExtraFile(".clawhub/origin.json", tndClawhubOrigin),
      "scripts/fetch-rss.py": makeExtraFile("scripts/fetch-rss.py", tndFetchRss),
      "scripts/test-pipeline.sh": makeExtraFile("scripts/test-pipeline.sh", tndTestPipeline),
      "references/digest-prompt.md": makeExtraFile("references/digest-prompt.md", tndDigestPrompt),
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
    extraFiles: {
      "metadata.json": makeExtraFile("metadata.json", urlReaderMetadata),
      "README.md": makeExtraFile("README.md", urlReaderReadme),
      "scripts/wechat_reader_v2.py": makeExtraFile("scripts/wechat_reader_v2.py", urlReaderWechatV2),
    },
  },
  {
    id: "image-ocr",
    skillMdContent: imageOcrSkillMd,
    path: "~/.openclaw/workspace/skills/image-ocr",
    extraFiles: {
      "_meta.json": makeExtraFile("_meta.json", imageOcrMeta),
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
    if (raw.extraFiles) {
      skill.extraFiles = raw.extraFiles
    }
    return skill
  })

  return cachedSkills
}

export function getSkillById(id: string): ParsedSkill | undefined {
  return loadTestSkills().find((s) => s.id === id)
}
