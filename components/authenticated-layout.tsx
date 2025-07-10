"use client"

import React, { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4" />
          <span className="text-white text-lg">Laden...</span>
        </div>
      </div>
    )
  }
  if (!user) return null
  return (
    <div className="flex min-h-screen bg-gray-900">
      <AppSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
} 