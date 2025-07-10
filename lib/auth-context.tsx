"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "./supabase"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  user: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const getUser = async () => {
      setLoading(true)
      const { data, error } = await supabase.auth.getUser()
      setUser(data?.user || null)
      setLoading(false)
    }
    getUser()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })
    return () => {
      listener?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.replace("/login")
      }
      if (user && pathname === "/login") {
        router.replace("/")
      }
    }
  }, [user, loading, pathname, router])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setLoading(false)
      return { success: false, error: error?.message || "Ongeldige inloggegevens" }
    }
    setUser(data.user)
    setLoading(false)
    return { success: true }
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setLoading(false)
    router.replace("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
} 