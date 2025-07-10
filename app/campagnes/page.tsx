"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Plus, Calendar, Edit, Trash2, X, Save } from "lucide-react"
import { logEvent } from "@/lib/logEvent"
import { useToast } from "@/components/ui/use-toast"

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchCampaigns()

    const subscription = supabase
      .channel("campagnes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "campagnes" }, () => {
        fetchCampaigns()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase.from("campagnes").select("*").order("naam", { ascending: true })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      toast({ title: "Fout", description: error.message || String(error), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCampaign = async () => {
    try {
      console.log("Adding campaign with data:", formData)
      
      if (!formData.name) {
        toast({ title: "Fout", description: "Campagne naam is verplicht", variant: "destructive" })
        return
      }

      const { data, error } = await supabase
        .from("campagnes")
        .insert([{
          naam: formData.name,
          startdatum: formData.startDate || null,
          einddatum: formData.endDate || null,
        }])
        .select()

      if (error) {
        toast({ title: "Fout", description: `Fout bij toevoegen: ${error.message}`, variant: "destructive" })
        return
      }

      console.log("Campaign added successfully:", data)
      setFormData({ name: "", startDate: "", endDate: "" })
      setShowAddForm(false)
      
      await fetchCampaigns()
      if (!error && data && data[0]) {
        await logEvent({
          type: "campaign_add",
          status: "success",
          message: `Nieuwe campagne toegevoegd: ${formData.name}`,
          data: { campagne_id: data[0].id, naam: formData.name, startdatum: formData.startDate, einddatum: formData.endDate },
        })
      }
    } catch (error) {
      console.error("Error adding campaign:", error)
      toast({ title: "Fout", description: `Fout bij toevoegen: ${error}`, variant: "destructive" })
      await logEvent({
        type: "campaign_add",
        status: "error",
        message: `Fout bij toevoegen campagne: ${formData.name}`,
        data: { naam: formData.name, error },
      })
    }
  }

  const handleUpdateCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from("campagnes")
        .update({
          naam: formData.name,
          startdatum: formData.startDate || null,
          einddatum: formData.endDate || null,
        })
        .eq("id", id)

      if (error) throw error

      setEditingId(null)
      setFormData({ name: "", startDate: "", endDate: "" })
      if (!error) {
        await logEvent({
          type: "campaign_edit",
          status: "success",
          message: `Campagne gewijzigd: ${formData.name}`,
          data: { campagne_id: id, naam: formData.name, startdatum: formData.startDate, einddatum: formData.endDate },
        })
      }
    } catch (error) {
      console.error("Error updating campaign:", error)
      await logEvent({
        type: "campaign_edit",
        status: "error",
        message: `Fout bij wijzigen campagne: ${formData.name}`,
        data: { campagne_id: id, naam: formData.name, error },
      })
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze campagne wilt verwijderen?")) return

    try {
      const { error } = await supabase
        .from("campagnes")
        .delete()
        .eq("id", id)

      if (error) throw error
      if (!error) {
        await logEvent({
          type: "campaign_delete",
          status: "success",
          message: `Campagne verwijderd: ${id}`,
          data: { campagne_id: id },
        })
      }
    } catch (error) {
      console.error("Error deleting campaign:", error)
      await logEvent({
        type: "campaign_delete",
        status: "error",
        message: `Fout bij verwijderen campagne: ${id}`,
        data: { campagne_id: id, error },
      })
    }
  }

  const startEdit = (campaign: any) => {
    setEditingId(campaign.id)
    setFormData({
      name: campaign.naam,
      startDate: campaign.startdatum || "",
      endDate: campaign.einddatum || "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: "", startDate: "", endDate: "" })
  }

  const getCampaignStatus = (campaign: any) => {
    if (!campaign.startdatum && !campaign.einddatum) return "draft"
    if (campaign.startdatum && !campaign.einddatum) return "active"
    if (campaign.einddatum) {
      const endDate = new Date(campaign.einddatum)
      const now = new Date()
      return endDate < now ? "completed" : "active"
    }
    return "draft"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600 text-white"
      case "draft":
        return "bg-gray-600 text-white"
      case "completed":
        return "bg-blue-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Campagnes</h1>
          <p className="text-gray-400">Beheer uw belcampagnes</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Campagne
        </Button>
      </div>

      {/* Add Campaign Form */}
      {showAddForm && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Nieuwe Campagne Toevoegen</CardTitle>
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
                  placeholder="Campagne naam"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Startdatum (optioneel)</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Einddatum (optioneel)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleAddCampaign}
                  disabled={!formData.name}
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
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{campaign.naam}</CardTitle>
                  <Badge className={getStatusColor(getCampaignStatus(campaign))}>
                    {getCampaignStatus(campaign) === "active" ? "Actief" : 
                     getCampaignStatus(campaign) === "draft" ? "Concept" : "Voltooid"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {campaign.startdatum && (
                    <div className="flex items-center text-sm text-gray-300">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Start: {new Date(campaign.startdatum).toLocaleDateString('nl-BE')}</span>
                    </div>
                  )}
                  {campaign.einddatum && (
                    <div className="flex items-center text-sm text-gray-300">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Eind: {new Date(campaign.einddatum).toLocaleDateString('nl-BE')}</span>
                    </div>
                  )}
                  {!campaign.startdatum && !campaign.einddatum && (
                    <div className="text-sm text-gray-400">
                      Geen datums ingesteld
                    </div>
                  )}
                </div>
                
                {editingId === campaign.id ? (
                  // Edit Form
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Naam</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Startdatum</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Einddatum</label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateCampaign(campaign.id)}
                        disabled={!formData.name}
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
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                      onClick={() => startEdit(campaign)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Bewerken
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijderen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {campaigns.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400">Geen campagnes gevonden</div>
          )}
        </div>
      )}
    </div>
  )
}
