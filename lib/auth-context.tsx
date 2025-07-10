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
      let { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", authUser.id)
        .single()

      // Automatische synchronisatie: als user niet bestaat, voeg toe
      if (adminError || !adminUser) {
        console.warn("admin_users entry niet gevonden, probeer aan te maken:", authUser.id)
        const { data: inserted, error: insertError } = await supabase
          .from("admin_users")
          .insert([
            {
              id: authUser.id,
              email: authUser.email,
              rol: 'agent',
              actief: true,
              aangemaakt_op: new Date().toISOString(),
            },
          ])
          .select()
          .single()
        if (insertError || !inserted) {
          setError(`Kan admin_users entry niet aanmaken voor id ${authUser.id}: ${insertError?.message}`)
          await supabase.auth.signOut()
          setUser(null)
          return
        }
        adminUser = inserted
      }

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

      // Debug: toon session.user
      console.log("[LOGIN] session.user:", data?.user)

      if (error || !data.user) {
        setError("Ongeldige inloggegevens")
        if (process.env.NODE_ENV === "development") {
          console.error("[DEV] Login error:", error)
        }
        return { success: false, error: "Ongeldige inloggegevens" }
      }

      // Log user.id voor debug
      console.log("[LOGIN] Supabase user.id =", data.user?.id)

      // Check of user bestaat in admin_users (op id)
      let { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", String(data.user?.id))
        .maybeSingle()

      // Debug: toon resultaat van admin_users query
      console.log("[LOGIN] adminUser result =", adminUser, "error =", adminError)
      if (adminError) {
        console.error("[LOGIN] admin_users fetch error:", adminError)
      }

      // Automatische insert als user niet bestaat
      if (adminError || !adminUser) {
        console.warn("[LOGIN] admin_users entry niet gevonden, probeer aan te maken:", data.user.id)
        const { data: inserted, error: insertError } = await supabase
          .from("admin_users")
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              rol: 'admin',
              actief: true,
              aangemaakt_op: new Date().toISOString(),
            },
          ])
          .select()
          .single()
        // Debug: toon resultaat van insert
        console.log("[LOGIN] admin_users insert result:", inserted)
        if (insertError || !inserted) {
          setError(`Kan admin_users entry niet aanmaken voor id ${data.user.id}: ${insertError?.message}`)
          return { success: false, error: "Geen toegang. Je account is niet geautoriseerd als admin gebruiker. Neem contact op met de beheerder." }
        }
        // Herlaad de pagina zodat dashboard opnieuw laadt met correcte data
        window.location.reload()
        return { success: true }
      }

      setUser(adminUser)
      // Na succesvolle login en laden van adminUser, replace naar dashboard zodat de app volledig opnieuw laadt
      if (adminUser && data.user) {
        setTimeout(() => {
          router.replace("/dashboard")
        }, 100) // kleine delay om context update te garanderen
      }
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