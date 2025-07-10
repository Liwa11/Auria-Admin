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
    return null
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