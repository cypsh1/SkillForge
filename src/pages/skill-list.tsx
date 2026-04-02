import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const PLACEHOLDER_SKILLS = [
  { id: "weather", name: "weather", description: "获取当前天气和预报", tools: 2, version: "1.0.0" },
  { id: "url-reader", name: "url-reader", description: "读取 URL 内容", tools: 3, version: "1.0.0" },
  { id: "tech-news-digest", name: "tech-news-digest", description: "科技新闻摘要与分析", tools: 5, version: "2.0.0" },
]

export default function SkillListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Skills</h2>
        <p className="text-muted-foreground">
          浏览和管理 OpenClaw Skills
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PLACEHOLDER_SKILLS.map((skill) => (
          <Card key={skill.id} className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{skill.name}</CardTitle>
                <Badge variant="secondary">{skill.version}</Badge>
              </div>
              <CardDescription>{skill.description}</CardDescription>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="outline">{skill.tools} 个工具</Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
