import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { SidebarInset } from "@/components/ui/sidebar"
import { AuthProvider } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Auria Admin Dashboard - Impact IQ",
  description: "Professional Call Center Management Platform",
    generator: 'v0.dev'
}

function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      {children}
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
  // Fallback voor SSR/SSG: render children direct
  return (
    <html lang="nl">
      <body>
        <AuthProvider>
          {pathname === "/login" ? (
            <LoginLayout>{children}</LoginLayout>
          ) : (
            <DashboardLayout>{children}</DashboardLayout>
          )}
        </AuthProvider>
      </body>
    </html>
  )
}
