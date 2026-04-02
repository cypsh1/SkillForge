import { useNavigate } from "react-router"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { loadTestSkills } from "@/data/skill-loader"

export default function SkillListPage() {
  const navigate = useNavigate()
  const skills = loadTestSkills()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Skills</h2>
        <p className="text-muted-foreground">
          浏览和管理 OpenClaw Skills（{skills.length} 个）
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
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
