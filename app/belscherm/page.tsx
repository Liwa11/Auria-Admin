"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Save, Play, Phone, User, Building2, CheckCircle, XCircle, Clock } from "lucide-react"
import { supabase, type Client, type Campaign } from "@/lib/supabase"

export default function BelschermPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedCampaign, setSelectedCampaign] = useState<string>("")
  const [callScript, setCallScript] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentCall, setCurrentCall] = useState<any>(null)

  useEffect(() => {
    fetchClients()
    fetchCampaigns()
    fetchCallScripts()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          campaigns(name)
        `)
        .eq("status", "active")
        .order("name")

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, description")
        .eq("status", "active")
        .order("name")

      if (error) throw error
      setCampaigns((data as any[]) || [])
    } catch (error) {
      console.error("Error fetching campaigns:", error)
    }
  }

  const fetchCallScripts = async () => {
    try {
      // Fetch default scripts from settings or use placeholder
      setCallScript(`Hallo, dit is [Verkoper Naam] van [Bedrijf]. Ik bel u namens [Campagne Naam].

Ik zie dat u geïnteresseerd bent in onze diensten. Kunt u mij vertellen wat uw specifieke behoeften zijn?

[Luister naar antwoord en pas script aan]

Bedankt voor uw tijd. Kunnen we een afspraak inplannen voor een verdere bespreking?`)

      setAiPrompt(`Je bent een professionele verkoper die namens [Bedrijf] belt. 

Belangrijke richtlijnen:
- Wees vriendelijk en respectvol
- Luister aandachtig naar de klant
- Pas je aan de situatie aan
- Vraag om toestemming voor verdere contacten
- Documenteer belangrijke informatie

Doel: Een afspraak inplannen of relevante informatie verzamelen.`)
    } catch (error) {
      console.error("Error fetching scripts:", error)
    }
  }

  const startCall = async () => {
    if (!selectedClient || !selectedCampaign) {
      alert("Selecteer eerst een klant en campagne")
      return
    }

    try {
      const { data, error } = await supabase
        .from("call_logs")
        .insert([{
          client_id: selectedClient,
          campaign_id: selectedCampaign,
          status: "in_progress",
          notes: "Gesprek gestart via belscherm",
        }])
        .select()
        .single()

      if (error) throw error

      setCurrentCall(data)
      alert("Gesprek gestart! Gebruik de knoppen hieronder om de status bij te werken.")
    } catch (error) {
      console.error("Error starting call:", error)
      alert("Fout bij het starten van het gesprek")
    }
  }

  const updateCallStatus = async (status: string) => {
    if (!currentCall) {
      alert("Geen actief gesprek")
      return
    }

    try {
      const { error } = await supabase
        .from("call_logs")
        .update({ 
          status,
          notes: `Status bijgewerkt naar: ${status}`,
        })
        .eq("id", currentCall.id)

      if (error) throw error

      setCurrentCall(null)
      setSelectedClient("")
      alert(`Gesprek ${status === "completed" ? "voltooid" : "beëindigd"}`)
    } catch (error) {
      console.error("Error updating call status:", error)
      alert("Fout bij het bijwerken van de gesprekstatus")
    }
  }

  const selectedClientData = clients.find(c => c.id === selectedClient)
  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign)

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Belscherm</h1>
          <p className="text-gray-400">Beheer belscripts en voer gesprekken</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => {
            // Save scripts to settings
            alert("Scripts opgeslagen!")
          }}
        >
          <Save className="h-4 w-4 mr-2" />
          Script Opslaan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Selection & Call Control */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Phone className="h-5 w-5 mr-2 text-blue-400" />
              Gesprek Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Selecteer Klant</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Kies een klant..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        {client.bedrijfsnaam} - {client.telefoon}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-gray-300 text-sm mb-2 block">Selecteer Campagne</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Kies een campagne..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClientData && (
              <div className="p-3 bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Klant Informatie</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <div><strong>Naam:</strong> {selectedClientData.name}</div>
                  <div><strong>Telefoon:</strong> {selectedClientData.phone}</div>
                  {selectedClientData.email && (
                    <div><strong>E-mail:</strong> {selectedClientData.email}</div>
                  )}
                  <div><strong>Campagne:</strong> {selectedClientData.campaign_id}</div>
                </div>
              </div>
            )}

            {selectedCampaignData && (
              <div className="p-3 bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Campagne Informatie</h4>
                <div className="text-sm text-gray-300">
                  <div><strong>Naam:</strong> {selectedCampaignData.name}</div>
                  {selectedCampaignData.description && (
                    <div><strong>Beschrijving:</strong> {selectedCampaignData.description}</div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={startCall}
                disabled={!selectedClient || !selectedCampaign}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Gesprek
              </Button>

              {currentCall && (
                <div className="space-y-2">
                  <div className="text-center text-sm text-yellow-400">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Gesprek actief
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateCallStatus("completed")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Voltooid
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => updateCallStatus("appointment_scheduled")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Afspraak
                    </Button>
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => updateCallStatus("no_answer")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Niet Opgenomen
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => updateCallStatus("missed")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Gemist
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Script Display */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <FileText className="h-5 w-5 mr-2 text-blue-400" />
              Belscript
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {callScript}
              </div>
            </div>
            
            <div>
              <label className="text-gray-300 text-sm mb-2 block">AI Prompt</label>
              <div className="p-3 bg-gray-700 rounded-lg text-sm text-gray-300">
                {aiPrompt}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
