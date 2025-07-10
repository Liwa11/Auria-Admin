import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { AppSidebar } from "@/components/app-sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Auria Admin Dashboard - Impact IQ",
  description: "Professional Call Center Management Platform",
  generator: 'v0.dev'
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  "use client"
  const { user, loading } = require("@/lib/auth-context").useAuth()
  const router = require("next/navigation").useRouter()
  React.useEffect(() => {
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <AuthProvider>
          <AuthenticatedLayout>{children}</AuthenticatedLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
