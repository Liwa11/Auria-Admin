"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { Plus, Mail, User, Edit, Trash2, X, Save, Crown, MapPin } from "lucide-react"

export default function VerkopersPage() {
  const [sellers, setSellers] = useState<any[]>([])
  const [regions, setRegions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    is_admin: false,
    regio_id: "",
  })

  useEffect(() => {
    fetchSellers()
    fetchRegions()

    const subscription = supabase
      .channel("verkopers-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "verkopers" }, () => {
        fetchSellers()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from("verkopers")
        .select(`
          *,
          regio(naam)
        `)
        .order("aangemaakt_op", { ascending: false })

      if (error) throw error
      setSellers(data || [])
    } catch (error) {
      console.error("Error fetching sellers:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("regio")
        .select("*")
        .order("naam", { ascending: true })

      if (error) throw error
      setRegions(data || [])
    } catch (error) {
      console.error("Error fetching regions:", error)
    }
  }

  const handleAddSeller = async () => {
    try {
      console.log("Adding seller with data:", formData)
      
      // Validate required fields
      if (!formData.name || !formData.email || !formData.regio_id) {
        alert("Naam, e-mail en regio zijn verplicht")
        return
      }

      const { data, error } = await supabase
        .from("verkopers")
        .insert([{
          naam: formData.name,
          email: formData.email,
          is_admin: formData.is_admin,
          regio_id: formData.regio_id,
        }])
        .select()

      if (error) {
        console.error("Supabase error:", error)
        alert(`Fout bij toevoegen: ${error.message}`)
        return
      }

      console.log("Seller added successfully:", data)
      setFormData({ name: "", email: "", is_admin: false, regio_id: "" })
      setShowAddForm(false)
      
      // Refresh the sellers list
      await fetchSellers()
    } catch (error) {
      console.error("Error adding seller:", error)
      alert(`Fout bij toevoegen: ${error}`)
    }
  }

  const handleUpdateSeller = async (id: string) => {
    try {
      if (!formData.name || !formData.email || !formData.regio_id) {
        alert("Naam, e-mail en regio zijn verplicht")
        return
      }

      const { error } = await supabase
        .from("verkopers")
        .update({
          naam: formData.name,
          email: formData.email,
          is_admin: formData.is_admin,
          regio_id: formData.regio_id,
        })
        .eq("id", id)

      if (error) {
        console.error("Supabase error:", error)
        alert(`Fout bij bijwerken: ${error.message}`)
        return
      }

      setEditingId(null)
      setFormData({ name: "", email: "", is_admin: false, regio_id: "" })
      await fetchSellers()
    } catch (error) {
      console.error("Error updating seller:", error)
      alert(`Fout bij bijwerken: ${error}`)
    }
  }

  const handleDeleteSeller = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze verkoper wilt verwijderen?")) return

    try {
      const { error } = await supabase
        .from("verkopers")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Supabase error:", error)
        alert(`Fout bij verwijderen: ${error.message}`)
        return
      }

      await fetchSellers()
    } catch (error) {
      console.error("Error deleting seller:", error)
      alert(`Fout bij verwijderen: ${error}`)
    }
  }

  const startEdit = (seller: any) => {
    setEditingId(seller.id)
    setFormData({
      name: seller.naam,
      email: seller.email,
      is_admin: seller.is_admin,
      regio_id: seller.regio_id,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: "", email: "", is_admin: false, regio_id: "" })
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Verkopers</h1>
          <p className="text-gray-400">Beheer uw verkoop team</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Verkoper
        </Button>
      </div>

      {/* Add Seller Form */}
      {showAddForm && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Nieuwe Verkoper Toevoegen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Naam *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Volledige naam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">E-mail *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Regio *</label>
                <select
                  value={formData.regio_id}
                  onChange={(e) => setFormData({ ...formData, regio_id: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecteer een regio</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.naam}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_admin}
                    onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-300">Admin rechten</span>
                </label>
              </div>
              <div className="flex space-x-2">
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleAddSeller}
                  disabled={!formData.name || !formData.email || !formData.regio_id}
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

      {loading ? (
        <div className="text-center py-8 text-gray-400">Laden...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => (
            <Card key={seller.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-green-600 text-white">
                      {seller.naam
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{seller.naam}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {seller.is_admin && (
                        <Badge className="bg-purple-600 text-white">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      <Badge className="bg-blue-600 text-white">Verkoper</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">{seller.email}</span>
                </div>
                {seller.regio && (
                  <div className="flex items-center text-gray-300">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{seller.regio.naam}</span>
                  </div>
                )}
                
                {editingId === seller.id ? (
                  // Edit Form
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Naam *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">E-mail *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Regio *</label>
                      <select
                        value={formData.regio_id}
                        onChange={(e) => setFormData({ ...formData, regio_id: e.target.value })}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Selecteer een regio</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.naam}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.is_admin}
                          onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                          className="rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-300">Admin rechten</span>
                      </label>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateSeller(seller.id)}
                        disabled={!formData.name || !formData.email || !formData.regio_id}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Opslaan
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={cancelEdit}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Annuleren
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="space-y-2 pt-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                        onClick={() => startEdit(seller)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Bewerken
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                        onClick={() => handleDeleteSeller(seller.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Verwijderen
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {sellers.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400">Geen verkopers gevonden</div>
          )}
        </div>
      )}
    </div>
  )
} 