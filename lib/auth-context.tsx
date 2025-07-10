"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase, AdminUser } from "./supabase"
import { useRouter } from "next/navigation"

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

  const checkAuth = async () => {
    try {
      setLoading(true)
      
      // Check if user is authenticated with Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        setUser(null)
        return
      }

      // Check if user exists in admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", authUser.email)
        .single()

      if (adminError || !adminUser) {
        console.log("User not found in admin_users table")
        await supabase.auth.signOut()
        setUser(null)
        return
      }

      // Update last login
      await supabase
        .from("admin_users")
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", adminUser.id)

      setUser(adminUser)
    } catch (error) {
      console.error("Auth check error:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)

      // First, check if user exists in admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", email)
        .single()

      if (adminError || !adminUser) {
        return { success: false, error: "Geen toegang. Contacteer de beheerder." }
      }

      // Try to sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: "Ongeldige inloggegevens" }
      }

      if (data.user) {
        // Update last login
        await supabase
          .from("admin_users")
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", adminUser.id)

        setUser(adminUser)
        return { success: true }
      }

      return { success: false, error: "Inloggen mislukt" }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Er is een fout opgetreden" }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  useEffect(() => {
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await checkAuth()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        router.push("/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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