import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkStringify from "remark-stringify"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import { parse as parseYaml } from "yaml"
import type {
  Root,
  RootContent,
  Heading,
  List,
  ListItem,
  Code,
  Table,
  TableCell,
  Paragraph,
  Blockquote,
  PhrasingContent,
} from "mdast"
import type {
  ParsedDocument,
  ContentSection,
  ContentBlock,
} from "@/types/content-fragment"

/* ─── Processor (singleton, stateless) ─── */

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ["yaml"])
  .use(remarkGfm)
  .use(remarkStringify)

/* ─── AST helpers ─── */

function sliceRaw(
  content: string,
  node: { position?: { start: { offset?: number }; end: { offset?: number } } },
): string {
  const start = node.position?.start?.offset
  const end = node.position?.end?.offset
  if (start != null && end != null) return content.slice(start, end)
  return ""
}

function inlineToText(nodes: PhrasingContent[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return n.value
      if (n.type === "inlineCode") return n.value
      if ("children" in n) return inlineToText(n.children as PhrasingContent[])
      return ""
    })
    .join("")
}

function listItemText(item: ListItem): string {
  return item.children
    .map((child) => {
      if (child.type === "paragraph")
        return inlineToText((child as Paragraph).children)
      return ""
    })
    .join("\n")
}

function cellText(cell: TableCell): string {
  return inlineToText(cell.children)
}

/* ─── AST node → ContentBlock ─── */

function nodeToBlock(content: string, node: RootContent): ContentBlock | null {
  const raw = sliceRaw(content, node)

  switch (node.type) {
    case "paragraph":
      return {
        type: "paragraph",
        raw,
        text: inlineToText((node as Paragraph).children),
      }

    case "list": {
      const list = node as List
      return {
        type: "list",
        raw,
        ordered: list.ordered ?? false,
        items: list.children.map(listItemText),
      }
    }

    case "code": {
      const code = node as Code
      return { type: "code", raw, lang: code.lang ?? "", value: code.value }
    }

    case "table": {
      const table = node as Table
      const [headerRow, ...dataRows] = table.children
      return {
        type: "table",
        raw,
        headers: headerRow ? headerRow.children.map(cellText) : [],
        rows: dataRows.map((row) => row.children.map(cellText)),
      }
    }

    case "blockquote": {
      const bq = node as Blockquote
      return {
        type: "blockquote",
        raw,
        text: bq.children
          .map((child) => {
            if (child.type === "paragraph")
              return inlineToText((child as Paragraph).children)
            return ""
          })
          .join("\n"),
      }
    }

    case "thematicBreak":
      return { type: "thematicBreak", raw }

    case "html":
      return { type: "html", raw, value: (node as { value: string }).value }

    default:
      return null
  }
}

/* ─── Parse: content → ParsedDocument ─── */

export function parseDocument(content: string): ParsedDocument {
  const tree = processor.parse(content) as Root

  const result: ParsedDocument = {
    preamble: [],
    sections: [],
  }

  let currentSection: ContentSection | null = null
  let sectionCounter = 0

  for (const node of tree.children) {
    if (node.type === "yaml") {
      const yamlValue = (node as { value: string }).value
      try {
        result.frontmatter = {
          raw: `---\n${yamlValue}\n---`,
          data: (parseYaml(yamlValue) as Record<string, unknown>) ?? {},
        }
      } catch {
        result.frontmatter = {
          raw: `---\n${yamlValue}\n---`,
          data: {},
        }
      }
      continue
    }

    if (node.type === "heading") {
      if (currentSection) {
        result.sections.push(currentSection)
      }
      sectionCounter++
      const heading = node as Heading
      currentSection = {
        id: `sec-${sectionCounter}`,
        heading: {
          depth: heading.depth,
          text: inlineToText(heading.children),
          raw: sliceRaw(content, node),
        },
        blocks: [],
      }
      continue
    }

    const block = nodeToBlock(content, node)
    if (block) {
      if (currentSection) {
        currentSection.blocks.push(block)
      } else {
        result.preamble.push(block)
      }
    }
  }

  if (currentSection) {
    result.sections.push(currentSection)
  }

  return result
}

/* ─── Serialize: ContentBlock → raw markdown ─── */

export function blockToRaw(block: ContentBlock): string {
  switch (block.type) {
    case "paragraph":
      return block.raw
    case "list":
      return block.items
        .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
        .join("\n")
    case "code":
      return block.lang
        ? `\`\`\`${block.lang}\n${block.value}\n\`\`\``
        : `\`\`\`\n${block.value}\n\`\`\``
    case "table": {
      const h = `| ${block.headers.join(" | ")} |`
      const s = `| ${block.headers.map(() => "---").join(" | ")} |`
      const d = block.rows.map((row) => `| ${row.join(" | ")} |`)
      return [h, s, ...d].join("\n")
    }
    case "blockquote":
      return block.text
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n")
    case "thematicBreak":
      return "---"
    case "html":
      return block.value
  }
}

/* ─── Serialize: ParsedDocument → content string ─── */

export function serializeDocument(doc: ParsedDocument): string {
  const parts: string[] = []

  if (doc.frontmatter) {
    parts.push(doc.frontmatter.raw)
  }

  for (const block of doc.preamble) {
    parts.push(block.raw)
  }

  for (const section of doc.sections) {
    parts.push(section.heading.raw)
    for (const block of section.blocks) {
      parts.push(block.raw)
    }
  }

  return parts.join("\n\n").trimEnd() + "\n"
}
