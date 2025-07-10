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
  const [error, setError] = useState<string | null>(null)

  const checkAuth = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is authenticated with Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        setUser(null)
        setError("Niet ingelogd of authenticatie mislukt.")
        return
      }

      // Log user.id voor debug
      console.log("Supabase user.id (checkAuth):", authUser.id)

      // Check if user exists in admin_users table (op id)
      const { data: adminUser, error: adminError, status } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (adminError || !adminUser) {
        console.error("Gebruiker niet gevonden in admin_users voor id:", authUser.id, adminError)
        setError(`Geen toegang: jouw account (${authUser.id}) bestaat niet in admin_users. Neem contact op met de beheerder.`)
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
    } catch (error: any) {
      setUser(null)
      setError(error?.message || "Onbekende fout bij authenticatie.")
      if (process.env.NODE_ENV === "development") {
        console.error("[DEV] Auth error:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      // Probeer eerst in te loggen met Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        setError("Ongeldige inloggegevens")
        if (process.env.NODE_ENV === "development") {
          console.error("[DEV] Login error:", error)
        }
        return { success: false, error: "Ongeldige inloggegevens" }
      }

      // Log user.id voor debug
      console.log("Supabase user.id (login):", data.user.id)

      // Check of user bestaat in admin_users (op id)
      const { data: adminUser, error: adminError, status } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (adminError || !adminUser) {
        setError(`Geen toegang: jouw account (${data.user.id}) bestaat niet in admin_users. Neem contact op met de beheerder.`)
        if (process.env.NODE_ENV === "development") {
          console.error("[DEV] admin_users fetch error:", adminError)
        }
        return { success: false, error: "Geen toegang. Je account is niet geautoriseerd als admin gebruiker. Neem contact op met de beheerder." }
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
      return { success: true }
    } catch (error: any) {
      setError(error?.message || "Onbekende fout bij login.")
      if (process.env.NODE_ENV === "development") {
        console.error("[DEV] Login catch error:", error)
      }
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
      {error && (
        <div style={{ color: 'red', background: '#fff3f3', padding: 12, borderRadius: 6, margin: 8, fontWeight: 'bold' }}>
          {error}
        </div>
      )}
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