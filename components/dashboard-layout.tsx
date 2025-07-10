"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { useEffect } from "react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
  }, [pathname])

  // Debug: toon user object vóór render
  console.log('Gebruiker geladen', user)

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