"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase, AdminUser } from "./supabase"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

interface AuthContextType {
  user: AdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = async () => {
    setLoading(true)
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        setUser(null)
        setLoading(false)
        return
      }
      // Check of user bestaat in admin_users (op id)
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", String(authUser.id))
        .maybeSingle()
      if (!adminUser) {
        console.log("Gebruiker niet gevonden in admin_users:", authUser.id)
      }
      setUser(adminUser || null)
      setLoading(false)
    } catch {
      setUser(null)
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) {
        setUser(null)
        setLoading(false)
        return { success: false, error: "Ongeldige inloggegevens" }
      }
      // Check of user bestaat in admin_users (op id)
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", String(data.user.id))
        .maybeSingle()
      if (!adminUser) {
        console.log("Gebruiker niet gevonden in admin_users:", data.user.id)
      }
      setUser(adminUser || null)
      setLoading(false)
      if (adminUser) {
        return { success: true }
      } else {
        return { success: false, error: "Geen toegang" }
      }
    } catch {
      setUser(null)
      setLoading(false)
      return { success: false, error: "Er is een fout opgetreden" }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  useEffect(() => {
    checkAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await checkAuth()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <span className="animate-spin">⏳</span>
        <span className="ml-2">Laden...</span>
      </div>
    )
  }
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 