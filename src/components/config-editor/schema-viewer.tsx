import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface SchemaViewerProps {
  schema: Record<string, unknown>
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function formatType(node: Record<string, unknown>): string {
  if (typeof node.$ref === "string") {
    return node.$ref
  }
  const t = node.type
  if (typeof t === "string") {
    return t
  }
  if (Array.isArray(t) && t.every((x) => typeof x === "string")) {
    return t.join(" | ")
  }
  if (node.enum !== undefined) {
    return "enum"
  }
  if (node.properties !== undefined || node.additionalProperties !== undefined) {
    return "object"
  }
  if (node.items !== undefined) {
    return "array"
  }
  return "—"
}

function constraintParts(node: Record<string, unknown>): string[] {
  const parts: string[] = []
  if (typeof node.pattern === "string") {
    parts.push(`pattern: ${node.pattern}`)
  }
  if (typeof node.minimum === "number") {
    parts.push(`min: ${node.minimum}`)
  }
  if (typeof node.maximum === "number") {
    parts.push(`max: ${node.maximum}`)
  }
  if (typeof node.exclusiveMinimum === "number") {
    parts.push(`exclusiveMin: ${node.exclusiveMinimum}`)
  }
  if (typeof node.exclusiveMaximum === "number") {
    parts.push(`exclusiveMax: ${node.exclusiveMaximum}`)
  }
  if (typeof node.minLength === "number") {
    parts.push(`minLength: ${node.minLength}`)
  }
  if (typeof node.maxLength === "number") {
    parts.push(`maxLength: ${node.maxLength}`)
  }
  if (typeof node.minItems === "number") {
    parts.push(`minItems: ${node.minItems}`)
  }
  if (typeof node.maxItems === "number") {
    parts.push(`maxItems: ${node.maxItems}`)
  }
  return parts
}

function PropertiesTable({
  properties,
  requiredSet,
}: {
  properties: Record<string, unknown>
  requiredSet: Set<string>
}) {
  const entries = Object.entries(properties)
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">No properties</p>
    )
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left font-medium py-1.5 pr-3 align-bottom">
              Property
            </th>
            <th className="text-left font-medium py-1.5 pr-3 align-bottom">
              Type
            </th>
            <th className="text-left font-medium py-1.5 pr-3 align-bottom">
              Description
            </th>
            <th className="text-left font-medium py-1.5 align-bottom">
              Constraints
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, raw]) => {
            const node = isRecord(raw) ? raw : {}
            const req = requiredSet.has(name)
            const desc =
              typeof node.description === "string" ? node.description : "—"
            const enumVals = Array.isArray(node.enum) ? node.enum : null
            const rest = constraintParts(node)

            return (
              <tr
                key={name}
                className={cn(
                  "border-b border-border/60 last:border-0",
                  req && "bg-muted/40",
                )}
              >
                <td
                  className={cn(
                    "py-1.5 pr-3 font-mono align-top",
                    req && "font-semibold text-foreground",
                  )}
                >
                  {name}
                </td>
                <td className="py-1.5 pr-3 align-top whitespace-nowrap">
                  <Badge variant="secondary" className="font-normal">
                    {formatType(node)}
                  </Badge>
                </td>
                <td className="py-1.5 pr-3 align-top text-muted-foreground max-w-[220px]">
                  {desc}
                </td>
                <td className="py-1.5 align-top">
                  <div className="flex flex-wrap gap-1 items-center">
                    {enumVals?.map((v, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="font-mono text-[10px] font-normal max-w-full truncate"
                      >
                        {String(v)}
                      </Badge>
                    ))}
                    {rest.map((line, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] text-muted-foreground"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function requiredArray(schema: Record<string, unknown>): string[] {
  const r = schema.required
  if (!Array.isArray(r)) {
    return []
  }
  return r.filter((x): x is string => typeof x === "string")
}

function ObjectSchemaCard({
  heading,
  body,
}: {
  heading: string
  body: Record<string, unknown>
}) {
  const props =
    body.properties !== undefined && isRecord(body.properties)
      ? body.properties
      : {}
  const requiredSet = new Set(requiredArray(body))
  const typeLabel = formatType(body)

  return (
    <Card size="sm" className="gap-2 py-3">
      <CardHeader className="px-3 pb-0 pt-0">
        <CardTitle className="text-sm font-mono">{heading}</CardTitle>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">Type</span>
          <Badge variant="secondary" className="font-normal">
            {typeLabel}
          </Badge>
        </div>
        {requiredSet.size > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-xs text-muted-foreground shrink-0">
              Required
            </span>
            {Array.from(requiredSet).map((name) => (
              <Badge key={name} variant="secondary" className="font-mono text-[10px]">
                {name}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="px-3 pt-0">
        <PropertiesTable properties={props} requiredSet={requiredSet} />
      </CardContent>
    </Card>
  )
}

export function SchemaViewer({ schema }: SchemaViewerProps) {
  const title = typeof schema.title === "string" ? schema.title : null
  const version =
    schema.version !== undefined && schema.version !== null
      ? String(schema.version)
      : null

  const definitions =
    schema.definitions !== undefined && isRecord(schema.definitions)
      ? schema.definitions
      : null

  const rootProps =
    schema.properties !== undefined && isRecord(schema.properties)
      ? schema.properties
      : {}

  const defEntries = definitions ? Object.entries(definitions) : []

  const hasRootBlock = Object.keys(rootProps).length > 0

  return (
    <div className="rounded-md border">
      <div className="max-w-full space-y-4 p-3 text-sm">
        {(title || version) && (
          <div className="space-y-1">
            {title ? (
              <h3 className="text-sm font-semibold leading-tight">{title}</h3>
            ) : null}
            {version ? (
              <p className="text-xs text-muted-foreground font-mono">
                v{version}
              </p>
            ) : null}
          </div>
        )}

        {(title || version) && (defEntries.length > 0 || hasRootBlock) ? (
          <Separator />
        ) : null}

        {defEntries.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Definitions
            </h4>
            {defEntries.map(([name, raw]) =>
              isRecord(raw) ? (
                <ObjectSchemaCard key={name} heading={name} body={raw} />
              ) : null,
            )}
          </div>
        ) : null}

        {defEntries.length > 0 && hasRootBlock ? <Separator /> : null}

        {hasRootBlock ? (
          <ObjectSchemaCard heading="Root properties" body={schema} />
        ) : null}

        {!title &&
        !version &&
        defEntries.length === 0 &&
        !hasRootBlock ? (
          <p className="text-xs text-muted-foreground">
            No schema structure to display.
          </p>
        ) : null}
      </div>
    </div>
  )
}
