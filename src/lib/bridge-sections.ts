export interface BridgeSection {
  id: string
  name: string
  color: string
  layer: BridgeLayerId
}

export type BridgeLayerId =
  | "identity"
  | "deps"
  | "caps"
  | "config"
  | "exec"
  | "ops"

export interface BridgeLayer {
  id: BridgeLayerId
  name: string
  icon: string
}

export const BRIDGE_LAYERS: BridgeLayer[] = [
  { id: "identity", name: "身份", icon: "🪪" },
  { id: "deps", name: "依赖", icon: "📦" },
  { id: "caps", name: "能力", icon: "⚡" },
  { id: "config", name: "配置", icon: "⚙️" },
  { id: "exec", name: "执行", icon: "▶️" },
  { id: "ops", name: "运维", icon: "🔧" },
]

export const BRIDGE_SECTIONS: BridgeSection[] = [
  { id: "basic", name: "基本信息", color: "#3b82f6", layer: "identity" },
  { id: "meta", name: "元数据", color: "#64748b", layer: "deps" },
  { id: "env", name: "环境变量", color: "#f59e0b", layer: "deps" },
  { id: "tools", name: "工具", color: "#10b981", layer: "caps" },
  { id: "files", name: "文件权限", color: "#8b5cf6", layer: "caps" },
  { id: "exec", name: "脚本管道", color: "#14b8a6", layer: "exec" },
  { id: "doc", name: "文档结构", color: "#14b8a6", layer: "ops" },
]

export const SECTION_MAP = Object.fromEntries(
  BRIDGE_SECTIONS.map((s) => [s.id, s]),
) as Record<string, BridgeSection>

export const LAYER_SECTION_IDS = Object.fromEntries(
  BRIDGE_LAYERS.map((layer) => [
    layer.id,
    BRIDGE_SECTIONS.filter((s) => s.layer === layer.id).map((s) => s.id),
  ]),
) as Record<BridgeLayerId, string[]>

export const BRIDGE_GUTTER_EXTEND = 25
