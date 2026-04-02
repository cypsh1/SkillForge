import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Search } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { loadTestSkills } from "@/data/skill-loader"

export default function SkillListPage() {
  const navigate = useNavigate()
  const skills = loadTestSkills()
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return skills
    return skills.filter((skill) => {
      const name = skill.frontmatter.name?.toLowerCase() ?? ""
      const desc = skill.description?.toLowerCase() ?? ""
      return name.includes(q) || desc.includes(q)
    })
  }, [skills, query])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Skills</h2>
        <p className="text-muted-foreground">
          浏览和管理 OpenClaw Skills（显示 {filtered.length} / {skills.length} 个）
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          placeholder="按名称或描述筛选…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((skill) => (
          <Card
            key={skill.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => navigate(`/skills/${skill.id}`)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-mono">{skill.frontmatter.name}</CardTitle>
                {skill.frontmatter.version && (
                  <Badge variant="secondary">{skill.frontmatter.version}</Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {skill.description}
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {skill.tools.length > 0 && (
                  <Badge variant="outline">{skill.tools.length} 个工具</Badge>
                )}
                {skill.envVars.length > 0 && (
                  <Badge variant="outline">{skill.envVars.length} 个环境变量</Badge>
                )}
                {skill.hasConfig && (
                  <Badge variant="outline">有配置文件</Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
