"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Shield, User, Crown } from "lucide-react"
import { supabase, type AdminUser } from "@/lib/supabase"

interface Admin {
  id: string
  name: string
  email: string
  role: "super_admin" | "admin" | "moderator"
  lastLogin: string
  status: "active" | "inactive"
}

export default function GebruikersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("aangemaakt_op", { ascending: false })
    if (!error) setAdmins(data || [])
    setLoading(false)
  }

  const getRoleIcon = () => <Shield className="h-4 w-4 text-blue-400" />
  const getRoleColor = () => "bg-blue-500/20 text-blue-400 border-blue-500/30"
  const getRoleName = () => "Administrator"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gebruikersbeheer</h1>
          <p className="text-gray-300">Beheer administratieve gebruikers</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Gebruiker
        </Button>
      </div>

      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Administratieve Gebruikers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Laden...</div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-500/20 text-blue-400">
                        {admin.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">{admin.name}</h3>
                      <p className="text-sm text-gray-400">{admin.email}</p>
                      <p className="text-xs text-gray-500">
                        Laatste login: {admin.last_login ? new Date(admin.last_login).toLocaleString("nl-NL") : "Nooit"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getRoleColor()}>
                      {getRoleIcon()}
                      <span className="ml-1">{getRoleName()}</span>
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Actief
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      Bewerken
                    </Button>
                  </div>
                </div>
              ))}
              {admins.length === 0 && (
                <div className="text-center py-4 text-gray-400">Geen gebruikers gevonden</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Shield className="h-5 w-5 mr-2 text-blue-400" />
              Administrators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{admins.length}</div>
            <p className="text-sm text-gray-400">Beheer van campagnes en gebruikers</p>
          </CardContent>
        </Card>
        {/* De andere cards (Super Admins, Moderators) kun je later dynamisch maken als er rollen zijn */}
      </div>
    </div>
  )
}
