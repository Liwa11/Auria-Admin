"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Phone, User, Building2, Edit, Trash2, X, Save } from "lucide-react"

export default function GesprekkenPage() {
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    notes: "",
    status: "",
  })

  useEffect(() => {
    fetchCalls()

    const subscription = supabase
      .channel("gesprekken-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "gesprekken" }, () => {
        fetchCalls()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchCalls = async () => {
    try {
      const { data, error } = await supabase
        .from("gesprekken")
        .select(`
          *,
          klanten(bedrijfsnaam),
          verkopers(naam),
          campagnes(naam)
        `)
        .order("aangemaakt_op", { ascending: false })

      if (error) throw error
      setCalls(data || [])
    } catch (error) {
      console.error("Error fetching calls:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCall = async (id: string) => {
    try {
      const { error } = await supabase
        .from("gesprekken")
        .update({
          datum: formData.date,
          tijdslot: formData.time,
          opmerkingen: formData.notes,
          resultaatcode: formData.status,
        })
        .eq("id", id)

      if (error) throw error

      setEditingId(null)
      setFormData({ date: "", time: "", notes: "", status: "" })
    } catch (error) {
      console.error("Error updating call:", error)
    }
  }

  const handleDeleteCall = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit gesprek wilt verwijderen?")) return

    try {
      const { error } = await supabase
        .from("gesprekken")
        .delete()
        .eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error deleting call:", error)
    }
  }

  const startEdit = (call: any) => {
    setEditingId(call.id)
    setFormData({
      date: call.datum,
      time: call.tijdslot,
      notes: call.opmerkingen || "",
      status: call.resultaatcode,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ date: "", time: "", notes: "", status: "" })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Afspraak ingepland":
        return "bg-green-600 text-white"
      case "Geen interesse":
        return "bg-red-600 text-white"
      case "Interesse, maar niet nu":
        return "bg-yellow-600 text-white"
      case "Terugbellen":
        return "bg-blue-600 text-white"
      case "Niet bereikbaar":
        return "bg-gray-600 text-white"
      case "Verkeerd nummer":
        return "bg-orange-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gesprekken</h1>
          <p className="text-gray-400">Overzicht van alle belgeschiedenis</p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Belgeschiedenis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Laden...</div>
          ) : (
            <div className="space-y-4">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  {editingId === call.id ? (
                    // Edit Form
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Datum</label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Tijd</label>
                          <input
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Resultaat</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Selecteer resultaat</option>
                            <option value="Afspraak ingepland">Afspraak ingepland</option>
                            <option value="Geen interesse">Geen interesse</option>
                            <option value="Interesse, maar niet nu">Interesse, maar niet nu</option>
                            <option value="Terugbellen">Terugbellen</option>
                            <option value="Niet bereikbaar">Niet bereikbaar</option>
                            <option value="Verkeerd nummer">Verkeerd nummer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Opmerkingen</label>
                          <input
                            type="text"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Opmerkingen"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateCall(call.id)}
                          disabled={!formData.date || !formData.status}
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
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{call.campagnes?.naam || "Onbekende campagne"}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              <span>{call.verkopers?.naam || "Onbekende verkoper"}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center">
                              <Building2 className="h-3 w-3 mr-1" />
                              <span>{call.klanten?.bedrijfsnaam || "Onbekende klant"}</span>
                            </div>
                            <span>•</span>
                            <span>{call.datum} {call.tijdslot}</span>
                          </div>
                          {call.opmerkingen && (
                            <div className="text-xs text-gray-500 mt-1">
                              Notitie: {call.opmerkingen}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Aangemaakt: {call.aangemaakt_op ? new Date(call.aangemaakt_op).toLocaleString("nl-BE") : "—"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(call.resultaatcode)}>
                          {call.resultaatcode}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                            onClick={() => startEdit(call)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Bewerken
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                            onClick={() => handleDeleteCall(call.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Verwijderen
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {calls.length === 0 && (
                <div className="text-center py-8 text-gray-400">Geen gesprekken gevonden</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 