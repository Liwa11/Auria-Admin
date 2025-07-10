"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, user, loading } = useAuth()
  const router = useRouter()

  if (user && !loading) {
    router.replace("/")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const { success, error: signInError } = await signIn(email, password)
    setIsLoading(false)
    if (success) {
      router.replace("/")
    } else {
      setError(signInError || "Inloggen mislukt")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Laden...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Auria Admin</CardTitle>
            <CardDescription className="text-gray-400">Log in met je beheerdersaccount</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-red-600/20 border-red-600/50">
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">E-mailadres</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className="bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Wachtwoord</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} className="bg-gray-700 border-gray-600 text-white" />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Inloggen"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 