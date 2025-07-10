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
    console.log("DashboardLayout - User:", user)
    console.log("DashboardLayout - Loading:", loading)
    console.log("DashboardLayout - Pathname:", pathname)
  }, [user, loading, pathname])

  // Show loading spinner while checking authentication
  if (loading) {
    console.log("DashboardLayout - Showing loading spinner")
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Laden...</span>
        </div>
      </div>
    )
  }

  // If user is not authenticated and not on login page, redirect to login
  if (!user && pathname !== "/login") {
    console.log("DashboardLayout - No user, redirecting to login")
    // Instead of returning null, show a message and redirect button
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Niet ingelogd</h1>
          <p className="text-gray-400 mb-4">Je moet inloggen om toegang te krijgen tot het dashboard.</p>
          <a 
            href="/login" 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Naar Login
          </a>
        </div>
      </div>
    )
  }

  // If user is authenticated and on login page, redirect to dashboard
  if (user && pathname === "/login") {
    console.log("DashboardLayout - User authenticated, redirecting from login")
    return null // This will trigger a redirect in the login page
  }

  // If on login page, show only the login content without sidebar
  if (pathname === "/login") {
    console.log("DashboardLayout - On login page, showing login content")
    return <>{children}</>
  }

  // Show the main app layout with sidebar for authenticated users
  console.log("DashboardLayout - Showing main app layout with sidebar")
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