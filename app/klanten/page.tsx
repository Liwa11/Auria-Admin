"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { supabase, handleSupabaseError } from "@/lib/supabase"
import { Plus, Search, Building2, Phone, Mail, MapPin, Edit, Trash2, X, Save } from "lucide-react"
import { logEvent } from "@/lib/logEvent"
import { useToast } from "@/components/ui/use-toast"

export default function KlantenPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    vatNumber: "",
  })
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()

    const subscription = supabase
      .channel("klanten-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "klanten" }, () => {
        fetchClients()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("klanten").select("*").order("aangemaakt_op", { ascending: false })

      if (error) {
        console.error("Error fetching clients:", error)
        toast({
          title: "Fout",
          description: error.message || String(error),
          variant: "destructive",
        })
        return
      }

      setClients(data || [])
      setError(null)
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Fout",
        description: "Fout bij ophalen van klanten",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async () => {
    try {
      setError(null)
      console.log("Adding client with data:", formData)
      
      // Validate required fields
      if (!formData.name || !formData.phone) {
        toast({
          title: "Fout",
          description: "Bedrijfsnaam en telefoon zijn verplicht",
          variant: "destructive",
        })
        return
      }

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
        toast({ title: 'Fout', description: 'Ongeldig e-mailadres', variant: 'destructive' });
        return;
      }

      if (!/^[0-9\-\+ ]{6,}$/.test(formData.phone)) {
        toast({ title: 'Fout', description: 'Ongeldig telefoonnummer', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase
        .from("klanten")
        .insert([{
          bedrijfsnaam: formData.name,
          email: formData.email,
          telefoon: formData.phone,
          adres: formData.address,
          btw_nummer: formData.vatNumber || null,
        }])
        .select()

      if (error) {
        console.error("Supabase error:", error)
        toast({
          title: "Fout",
          description: handleSupabaseError(error),
          variant: "destructive",
        })
        return
      }

      console.log("Client added successfully:", data)
      setFormData({ name: "", email: "", phone: "", address: "", vatNumber: "" })
      setShowAddForm(false)
      
      // Refresh the clients list
      await fetchClients()
      if (!error && data && data[0]) {
        await logEvent({
          type: "client_add",
          status: "success",
          message: `Nieuwe klant toegevoegd: ${formData.name}`,
          data: { klantnaam: formData.name, adres: formData.address, email: formData.email, telefoon: formData.phone },
        })
        toast({
          title: "Succes",
          description: `Nieuwe klant toegevoegd: ${formData.name}`,
        })
      }
    } catch (error) {
      console.error("Error adding client:", error)
      toast({
        title: "Fout",
        description: "Fout bij toevoegen van klant",
        variant: "destructive",
      })
      await logEvent({
        type: "client_add",
        status: "error",
        message: `Fout bij toevoegen klant: ${formData.name}`,
        data: { klantnaam: formData.name, adres: formData.address, error },
      })
    }
  }

  const handleUpdateClient = async (id: string) => {
    try {
      setError(null)
      
      if (!formData.name || !formData.phone) {
        toast({
          title: "Fout",
          description: "Bedrijfsnaam en telefoon zijn verplicht",
          variant: "destructive",
        })
        return
      }

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
        toast({ title: 'Fout', description: 'Ongeldig e-mailadres', variant: 'destructive' });
        return;
      }

      if (!/^[0-9\-\+ ]{6,}$/.test(formData.phone)) {
        toast({ title: 'Fout', description: 'Ongeldig telefoonnummer', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from("klanten")
        .update({
          bedrijfsnaam: formData.name,
          email: formData.email,
          telefoon: formData.phone,
          adres: formData.address,
          btw_nummer: formData.vatNumber || null,
        })
        .eq("id", id)

      if (error) {
        console.error("Supabase error:", error)
        toast({
          title: "Fout",
          description: handleSupabaseError(error),
          variant: "destructive",
        })
        return
      }

      setEditingId(null)
      setFormData({ name: "", email: "", phone: "", address: "", vatNumber: "" })
      await fetchClients()
      if (!error) {
        await logEvent({
          type: "client_edit",
          status: "success",
          message: `Klant gewijzigd: ${formData.name}`,
          data: { klantnaam: formData.name, adres: formData.address, email: formData.email, telefoon: formData.phone },
        })
        toast({
          title: "Succes",
          description: `Klant gewijzigd: ${formData.name}`,
        })
      }
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Fout",
        description: "Fout bij bijwerken van klant",
        variant: "destructive",
      })
      await logEvent({
        type: "client_edit",
        status: "error",
        message: `Fout bij wijzigen klant: ${formData.name}`,
        data: { klantnaam: formData.name, adres: formData.address, error },
      })
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze klant wilt verwijderen?")) return

    try {
      setError(null)
      const { error } = await supabase
        .from("klanten")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Supabase error:", error)
        toast({
          title: "Fout",
          description: handleSupabaseError(error),
          variant: "destructive",
        })
        return
      }

      await fetchClients()
      if (!error) {
        await logEvent({
          type: "client_delete",
          status: "success",
          message: `Klant verwijderd: ${id}`,
          data: { klant_id: id },
        })
        toast({
          title: "Succes",
          description: `Klant verwijderd: ${id}`,
        })
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Fout",
        description: "Fout bij verwijderen van klant",
        variant: "destructive",
      })
      await logEvent({
        type: "client_delete",
        status: "error",
        message: `Fout bij verwijderen klant: ${id}`,
        data: { klant_id: id, error },
      })
    }
  }

  const startEdit = (client: any) => {
    setEditingId(client.id)
    setFormData({
      name: client.bedrijfsnaam,
      email: client.email,
      phone: client.telefoon,
      address: client.adres,
      vatNumber: client.btw_nummer || "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: "", email: "", phone: "", address: "", vatNumber: "" })
    setError(null)
  }

  const filteredClients = clients.filter(
    (client) => client.bedrijfsnaam.toLowerCase().includes(searchTerm.toLowerCase()) || client.telefoon.includes(searchTerm),
  )

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Klanten</h1>
          <p className="text-gray-400">Beheer uw klantendatabase</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Klant
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg">
          <p className="font-semibold">Fout:</p>
          <p>{error}</p>
          <Button 
            size="sm" 
            className="mt-2 bg-red-700 hover:bg-red-800"
            onClick={() => setError(null)}
          >
            Sluiten
          </Button>
        </div>
      )}

      {/* Add Client Form */}
      {showAddForm && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <h3 className="text-white font-semibold">Nieuwe Klant Toevoegen</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bedrijfsnaam *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Bedrijfsnaam"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Telefoon *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+32 123 456 789"
                  required
                  pattern="[0-9\-\+ ]{6,}"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Adres</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Straat, postcode stad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">BTW-nummer (optioneel)</label>
                <input
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="BE0123456789"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleAddClient}
                disabled={!formData.name || !formData.phone}
              >
                <Save className="h-4 w-4 mr-2" />
                Toevoegen
              </Button>
              <Button 
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => {
                  setShowAddForm(false)
                  setError(null)
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Annuleren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Zoek op bedrijfsnaam of telefoonnummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Laden...</div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  {editingId === client.id ? (
                    // Edit Form
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Bedrijfsnaam *</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Telefoon *</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                            pattern="[0-9\-\+ ]{6,}"
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
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Adres</label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">BTW-nummer</label>
                          <input
                            type="text"
                            value={formData.vatNumber}
                            onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateClient(client.id)}
                          disabled={!formData.name || !formData.phone}
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
                        <div className="p-2 rounded-lg bg-blue-600">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{client.bedrijfsnaam}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Phone className="h-3 w-3" />
                            <span>{client.telefoon}</span>
                            {client.email && (
                              <>
                                <span>•</span>
                                <Mail className="h-3 w-3" />
                                <span>{client.email}</span>
                              </>
                            )}
                          </div>
                          {client.adres && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3" />
                              <span>{client.adres}</span>
                            </div>
                          )}
                          {client.btw_nummer && (
                            <div className="text-xs text-gray-500">
                              BTW: {client.btw_nummer}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Toegevoegd: {client.aangemaakt_op ? new Date(client.aangemaakt_op).toLocaleDateString('nl-BE') : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                          onClick={() => startEdit(client)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Bewerken
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Verwijderen
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {filteredClients.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-400">Geen klanten gevonden</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 