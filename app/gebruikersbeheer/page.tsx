"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Shield, User, Crown, Edit, Trash2, X, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AdminUser } from "@/lib/supabase"
import { logEvent } from "@/lib/logEvent"

export default function GebruikersbeheerPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar_url: "",
  })

  useEffect(() => {
    fetchAdmins()

    // Set up real-time subscription
    const subscription = supabase
      .channel("admin_users-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_users" }, () => {
        fetchAdmins()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAdmins(data || [])
    } catch (error) {
      console.error("Error fetching admins:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async () => {
    try {
      const { error } = await supabase
        .from("admin_users")
        .insert([{ name: formData.name, email: formData.email, avatar_url: formData.avatar_url || null }])
      if (!error) {
        await logEvent({
          type: "user_add",
          status: "success",
          message: `Admin toegevoegd: ${formData.email}`,
          data: { email: formData.email, name: formData.name },
        })
      }
    } catch (error) {
      await logEvent({
        type: "user_add",
        status: "error",
        message: `Fout bij toevoegen admin: ${formData.email}`,
        data: { email: formData.email, error },
      })
    }
  }

  const handleUpdateAdmin = async (id: string) => {
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ name: formData.name, email: formData.email, avatar_url: formData.avatar_url || null })
        .eq("id", id)
      if (!error) {
        await logEvent({
          type: "user_edit",
          status: "success",
          message: `Admin gewijzigd: ${formData.email}`,
          data: { admin_id: id, email: formData.email, name: formData.name },
        })
      }
    } catch (error) {
      await logEvent({
        type: "user_edit",
        status: "error",
        message: `Fout bij wijzigen admin: ${formData.email}`,
        data: { admin_id: id, email: formData.email, error },
      })
    }
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")) return
    try {
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", id)
      if (!error) {
        await logEvent({
          type: "user_delete",
          status: "success",
          message: `Admin verwijderd: ${id}`,
          data: { admin_id: id },
        })
      }
    } catch (error) {
      await logEvent({
        type: "user_delete",
        status: "error",
        message: `Fout bij verwijderen admin: ${id}`,
        data: { admin_id: id, error },
      })
    }
  }

  const startEdit = (admin: AdminUser) => {
    setEditingId(admin.id)
    setFormData({
      name: admin.name,
      email: admin.email,
      avatar_url: admin.avatar_url || "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: "", email: "", avatar_url: "" })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-4 w-4 text-yellow-400" />
      case "admin":
        return <Shield className="h-4 w-4 text-blue-400" />
      default:
        return <User className="h-4 w-4 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-yellow-600 text-white"
      case "admin":
        return "bg-blue-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin"
      case "admin":
        return "Administrator"
      default:
        return "Gebruiker"
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gebruikersbeheer</h1>
          <p className="text-gray-400">Beheer administratieve gebruikers</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Gebruiker
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Nieuwe Gebruiker Toevoegen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Naam</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Volledige naam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL (optioneel)</label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleAddAdmin}
                  disabled={!formData.name || !formData.email}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Toevoegen
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuleren
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Administratieve Gebruikers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Laden...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Geen gebruikers gevonden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  {editingId === admin.id ? (
                    // Edit Form
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Naam</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateAdmin(admin.id)}
                          disabled={!formData.name || !formData.email}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Opslaan
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-600"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Annuleren
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <>
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-green-600 text-white">
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
                        <Badge className="bg-green-600 text-white">Actief</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                          onClick={() => startEdit(admin)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Bewerken
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                          onClick={() => handleDeleteAdmin(admin.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Verwijderen
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
