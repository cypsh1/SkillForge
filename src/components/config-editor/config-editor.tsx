import { useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SourcesEditor } from "./sources-editor"
import { TopicsEditor, type TopicsConfig } from "./topics-editor"
import { JsonPreview } from "./json-preview"
import { SchemaViewer } from "./schema-viewer"

interface ConfigEditorProps {
  configFiles: Record<string, unknown>
}

export function ConfigEditor({ configFiles }: ConfigEditorProps) {
  const entries = Object.entries(configFiles)
  const [editedConfigs, setEditedConfigs] = useState<Record<string, unknown>>(
    () => structuredClone(configFiles),
  )

  const handleConfigChange = useCallback(
    (path: string, newValue: unknown) => {
      setEditedConfigs((prev) => ({
        ...prev,
        [path]: newValue,
      }))
    },
    [],
  )

  if (entries.length === 0) return null

  return (
    <div className="space-y-4">
      <Tabs defaultValue={entries[0][0]} className="w-full">
        <TabsList>
          {entries.map(([path]) => (
            <TabsTrigger key={path} value={path} className="text-xs font-mono">
              {path.split("/").pop()}
            </TabsTrigger>
          ))}
        </TabsList>

        {entries.map(([path]) => (
          <TabsContent key={path} value={path}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">表单编辑</h4>
                <ConfigFormRouter
                  path={path}
                  data={editedConfigs[path]}
                  onChange={(newData) => handleConfigChange(path, newData)}
                />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">JSON 预览</h4>
                <JsonPreview data={editedConfigs[path]} />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ConfigFormRouter({
  path,
  data,
  onChange,
}: {
  path: string
  data: unknown
  onChange: (newData: unknown) => void
}) {
  const filename = path.split("/").pop() ?? ""

  if (filename === "sources.json" && isSourcesConfig(data)) {
    return <SourcesEditor data={data} onChange={onChange} />
  }

  if (filename === "topics.json" && isTopicsConfig(data)) {
    return <TopicsEditor data={data} onChange={onChange} />
  }

  if (
    filename === "schema.json" &&
    typeof data === "object" &&
    data !== null &&
    !Array.isArray(data)
  ) {
    return <SchemaViewer schema={data as Record<string, unknown>} />
  }

  return (
    <div className="text-sm text-muted-foreground p-4 border rounded-md">
      <p>此配置文件暂不支持表单编辑。</p>
      <p className="mt-1 text-xs">文件: {path}</p>
    </div>
  )
}

interface SourcesConfig {
  sources: Array<{
    id: string
    type: string
    name: string
    enabled: boolean
    priority: boolean
    topics: string[]
    [key: string]: unknown
  }>
  [key: string]: unknown
}

function isSourcesConfig(data: unknown): data is SourcesConfig {
  return (
    typeof data === "object" &&
    data !== null &&
    "sources" in data &&
    Array.isArray((data as SourcesConfig).sources)
  )
}

function isTopicsConfig(data: unknown): data is TopicsConfig {
  return (
    typeof data === "object" &&
    data !== null &&
    "topics" in data &&
    Array.isArray((data as TopicsConfig).topics)
  )
}
