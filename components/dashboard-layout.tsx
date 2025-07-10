"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Laden...</span>
      </div>
    )
  }
  if (!user) return null
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-900">
          <AppSidebar />
          <SidebarInset>
            <main className="flex-1">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
} 