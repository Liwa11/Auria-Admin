import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { SidebarInset } from "@/components/ui/sidebar"
import { AuthProvider } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Auria Admin Dashboard - Impact IQ",
  description: "Professional Call Center Management Platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
