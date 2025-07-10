import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Auria Admin Dashboard - Impact IQ",
  description: "Professional Call Center Management Platform",
  generator: 'v0.dev'
}

function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  "use client"
  const { user, loading } = require("@/lib/auth-context").useAuth()
  const router = require("next/navigation").useRouter()
  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])
  if (loading || !user) return null
  return <DashboardLayout>{children}</DashboardLayout>
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <AuthProvider>
          <AuthenticatedApp>{children}</AuthenticatedApp>
        </AuthProvider>
      </body>
    </html>
  )
}
