import { Hammer, Settings, BookOpen } from "lucide-react"
import { useNavigate, useLocation } from "react-router"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Skills", url: "/skills", icon: BookOpen },
  { title: "设置", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Hammer className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg tracking-tight">SkillForge</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          OpenClaw Skill 可视化配置
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={location.pathname.startsWith(item.url)}
                    onClick={() => navigate(item.url)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">v0.1.0</p>
      </SidebarFooter>
    </Sidebar>
  )
}
