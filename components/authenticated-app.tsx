"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import React, { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])
  if (loading || !user) return null
  return <DashboardLayout>{children}</DashboardLayout>
} 