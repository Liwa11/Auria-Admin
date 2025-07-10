"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function RootClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (pathname === "/login" && user) {
      router.replace("/dashboard")
    } else if (pathname !== "/login" && !user) {
      router.replace("/login")
    }
  }, [pathname, user, loading, router])

  if (loading) return null
  if (pathname === "/login") return <>{children}</>
  if (!user) return null
  return <DashboardLayout>{children}</DashboardLayout>
} 