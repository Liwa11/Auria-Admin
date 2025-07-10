import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import AuthenticatedApp from "@/components/authenticated-app"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Auria Admin Dashboard - Impact IQ",
  description: "Professional Call Center Management Platform",
  generator: 'v0.dev'
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
