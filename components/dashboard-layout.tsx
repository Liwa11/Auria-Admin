"use client"

import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { useEffect } from "react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
  }, [user, loading, pathname])

  // Debug: toon user object vóór render
  console.log('Gebruiker geladen', user)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Laden...</span>
        </div>
      </div>
    )
  }
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-900">
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 