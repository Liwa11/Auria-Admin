"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Shield, User, Crown } from "lucide-react"

interface Admin {
  id: string
  name: string
  email: string
  role: "super_admin" | "admin" | "moderator"
  lastLogin: string
  status: "active" | "inactive"
}

export default function GebruikersPage() {
  const [admins] = useState<Admin[]>([
    {
      id: "1",
      name: "Admin Gebruiker",
      email: "admin@impactiq.nl",
      role: "super_admin",
      lastLogin: "2024-01-15T10:30:00Z",
      status: "active",
    },
    {
      id: "2",
      name: "John Manager",
      email: "john@impactiq.nl",
      role: "admin",
      lastLogin: "2024-01-15T09:15:00Z",
      status: "active",
    },
    {
      id: "3",
      name: "Sarah Moderator",
      email: "sarah@impactiq.nl",
      role: "moderator",
      lastLogin: "2024-01-14T16:45:00Z",
      status: "active",
    },
  ])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-4 w-4 text-yellow-400" />
      case "admin":
        return <Shield className="h-4 w-4 text-blue-400" />
      case "moderator":
        return <User className="h-4 w-4 text-green-400" />
      default:
        return <User className="h-4 w-4 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "admin":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "moderator":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin"
      case "admin":
        return "Administrator"
      case "moderator":
        return "Moderator"
      default:
        return "Gebruiker"
    }
  }

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
                      Laatste login: {new Date(admin.lastLogin).toLocaleString("nl-NL")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getRoleColor(admin.role)}>
                    {getRoleIcon(admin.role)}
                    <span className="ml-1">{getRoleName(admin.role)}</span>
                  </Badge>
                  <Badge
                    className={
                      admin.status === "active"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }
                  >
                    {admin.status === "active" ? "Actief" : "Inactief"}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    Bewerken
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Crown className="h-5 w-5 mr-2 text-yellow-400" />
              Super Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1</div>
            <p className="text-sm text-gray-400">Volledige toegang tot alle functies</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Shield className="h-5 w-5 mr-2 text-blue-400" />
              Administrators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1</div>
            <p className="text-sm text-gray-400">Beheer van campagnes en gebruikers</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <User className="h-5 w-5 mr-2 text-green-400" />
              Moderators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1</div>
            <p className="text-sm text-gray-400">Beperkte beheerfuncties</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
