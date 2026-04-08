/* ─── Content Fragment Protocol ─── */

export type BlockType =
  | "paragraph"
  | "list"
  | "code"
  | "table"
  | "blockquote"
  | "thematicBreak"
  | "html"

export interface ParagraphBlock {
  type: "paragraph"
  raw: string
  text: string
}

export interface ListBlock {
  type: "list"
  raw: string
  ordered: boolean
  items: string[]
}

export interface CodeBlock {
  type: "code"
  raw: string
  lang: string
  value: string
}

export interface TableBlock {
  type: "table"
  raw: string
  headers: string[]
  rows: string[][]
}

export interface BlockquoteBlock {
  type: "blockquote"
  raw: string
  text: string
}

export interface ThematicBreakBlock {
  type: "thematicBreak"
  raw: string
}

export interface HtmlBlock {
  type: "html"
  raw: string
  value: string
}

export type ContentBlock =
  | ParagraphBlock
  | ListBlock
  | CodeBlock
  | TableBlock
  | BlockquoteBlock
  | ThematicBreakBlock
  | HtmlBlock

export interface ContentSection {
  id: string
  heading: {
    depth: number
    text: string
    raw: string
  }
  blocks: ContentBlock[]
}

export interface ParsedDocument {
  frontmatter?: {
    raw: string
    data: Record<string, unknown>
  }
  preamble: ContentBlock[]
  sections: ContentSection[]
}
