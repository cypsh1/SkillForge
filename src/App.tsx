import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { ErrorBoundary } from "@/components/error-boundary"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import SkillListPage from "@/pages/skill-list"
import SkillDetailPage from "@/pages/skill-detail"

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="flex flex-1 flex-col h-svh">
              <AppHeader />
              <div className="flex-1 overflow-y-auto p-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/skills" replace />} />
                  <Route path="/skills" element={<SkillListPage />} />
                  <Route path="/skills/:skillId" element={<SkillDetailPage />} />
                </Routes>
              </div>
            </main>
          </SidebarProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
