"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Save, Play, Phone, User, Building2, CheckCircle, XCircle, Clock } from "lucide-react"
import { supabase, type Client, type Campaign } from "@/lib/supabase"
import { logEvent } from "@/lib/logEvent"
import { useToast } from "@/components/ui/use-toast"

export default function BelschermPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedCampaign, setSelectedCampaign] = useState<string>("")
  const [script, setScript] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentCall, setCurrentCall] = useState<any>(null)

  // State voor call script
  const [scriptId, setScriptId] = useState<string | null>(null)
  const [loadingScript, setLoadingScript] = useState(true)
  const [errorScript, setErrorScript] = useState<string | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
    fetchCampaigns()
    fetchCallScripts()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("klanten")
        .select("*")
        .order("bedrijfsnaam")

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      toast({ title: "Fout", description: error.message || String(error), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campagnes")
        .select("*")
        .order("naam")

      if (error) throw error
      setCampaigns((data as any[]) || [])
    } catch (error) {
      toast({ title: "Fout", description: error.message || String(error), variant: "destructive" })
    }
  }

  const fetchCallScripts = async () => {
    try {
      // Fetch default scripts from settings or use placeholder
      setScript(`Hallo, dit is [Verkoper Naam] van [Bedrijf]. Ik bel u namens [Campagne Naam].

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
      toast({ title: "Fout", description: error.message || String(error), variant: "destructive" })
    }
  }

  // Ophalen call script bij laden
  useEffect(() => {
    fetchCallScript()
  }, [])

  async function fetchCallScript() {
    setLoadingScript(true)
    setErrorScript(null)
    try {
      const { data, error } = await supabase.from("call_scripts").select("*").order("updated_at", { ascending: false }).limit(1)
      if (error) throw error
      if (data && data.length > 0) {
        setScript(data[0].script || "")
        setAiPrompt(data[0].ai_prompt || "")
        setScriptId(data[0].id)
      } else {
        setScript("")
        setAiPrompt("")
        setScriptId(null)
      }
    } catch (err: any) {
      if (err.message?.includes("does not exist")) {
        setErrorScript("Tabel 'call_scripts' bestaat niet. Voeg deze toe in Supabase:\n\ncreate table public.call_scripts (id uuid primary key default gen_random_uuid(), script text, ai_prompt text, updated_at timestamptz default now());")
      } else {
        setErrorScript("Fout bij ophalen verkoopscript: " + err.message)
      }
    } finally {
      setLoadingScript(false)
    }
  }

  // Autosave met debounce
  function handleScriptChange(val: string) {
    setScript(val)
    triggerAutosave(val, aiPrompt)
  }
  function handleAiPromptChange(val: string) {
    setAiPrompt(val)
    triggerAutosave(script, val)
  }
  function triggerAutosave(newScript: string, newPrompt: string) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveScript(newScript, newPrompt)
    }, 2000)
  }
  async function saveScript(newScript: string, newPrompt: string) {
    if (!scriptId) return
    setSaving(true)
    try {
      const { error } = await supabase.from("call_scripts").update({ script: newScript, ai_prompt: newPrompt, updated_at: new Date().toISOString() }).eq("id", scriptId)
      if (error) throw error
      await logEvent({
        type: "call_script_update",
        status: "success",
        message: "Verkoopscript of AI-prompt bijgewerkt",
        data: { script: newScript, ai_prompt: newPrompt },
      })
    } catch (err: any) {
      await logEvent({
        type: "call_script_update",
        status: "error",
        message: "Fout bij bijwerken verkoopscript of AI-prompt",
        data: { error: err.message },
      })
    } finally {
      setSaving(false)
    }
  }
  // Handmatig opslaan
  async function handleManualSave() {
    await saveScript(script, aiPrompt)
  }

  const startCall = async () => {
    if (!selectedClient || !selectedCampaign) {
      toast({ title: "Fout", description: "Selecteer eerst een klant en campagne", variant: "destructive" })
      return
    }

    try {
      const { data, error } = await supabase
        .from("gesprekken")
        .insert([{
          klant_id: selectedClient,
          campagne_id: selectedCampaign,
          status: "in_progress",
          notes: "Gesprek gestart via belscherm",
        }])
        .select()
        .single()

      if (error) throw error

      setCurrentCall(data)
      toast({ title: "Gesprek gestart", description: "Gebruik de knoppen hieronder om de status bij te werken." })
      await logEvent({
        type: "call_init",
        status: "success",
        message: `Start gesprek: ${clients.find(c => c.id === selectedClient)?.bedrijfsnaam || ''} (${campaigns.find(c => c.id === selectedCampaign)?.naam || ''}) door ${'Verkoper Naam'}`,
        data: {
          klant: clients.find(c => c.id === selectedClient),
          campagne: campaigns.find(c => c.id === selectedCampaign),
          verkoper: { naam: 'Verkoper Naam' }, // Placeholder for verkoper info
        },
      })
    } catch (error) {
      toast({ title: "Fout", description: "Fout bij het starten van het gesprek", variant: "destructive" })
    }
  }

  const updateCallStatus = async (status: string) => {
    if (!currentCall) {
      toast({ title: "Fout", description: "Geen actief gesprek", variant: "destructive" })
      return
    }

    try {
      const { error } = await supabase
        .from("gesprekken")
        .update({ 
          status,
          notes: `Status bijgewerkt naar: ${status}`,
        })
        .eq("id", currentCall.id)

      if (error) throw error

      setCurrentCall(null)
      setSelectedClient("")
      toast({ title: `Gesprek ${status === "completed" ? "voltooid" : "beëindigd"}` })
    } catch (error) {
      toast({ title: "Fout", description: "Fout bij het bijwerken van de gesprekstatus", variant: "destructive" })
    }
  }

  const selectedClientData = clients.find(c => c.id === selectedClient)
  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign)

  return (
    <div className="w-full min-h-screen bg-slate-900 p-0">
      <div className="max-w-[1800px] mx-auto w-full h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Gesprek Control links */}
        <div className="col-span-1 w-full h-full flex flex-col">
          {/* Gesprek Control Card */}
          <div className="bg-slate-800 rounded-lg shadow-md p-6 flex-1 flex flex-col overflow-auto min-h-[300px]">
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
                      {campaign.naam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClientData && (
              <div className="p-3 bg-gray-700 rounded-lg mt-4">
                <h4 className="font-semibold text-white mb-2">Klant Informatie</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <div><strong>Bedrijfsnaam:</strong> {selectedClientData.bedrijfsnaam}</div>
                  <div><strong>Telefoon:</strong> {selectedClientData.telefoon}</div>
                  {selectedClientData.email && (
                    <div><strong>E-mail:</strong> {selectedClientData.email}</div>
                  )}
                </div>
              </div>
            )}

            {selectedCampaignData && (
              <div className="p-3 bg-gray-700 rounded-lg mt-4">
                <h4 className="font-semibold text-white mb-2">Campagne Informatie</h4>
                <div className="text-sm text-gray-300">
                  <div><strong>Naam:</strong> {selectedCampaignData.naam}</div>
                </div>
              </div>
            )}

            <div className="space-y-2 mt-4">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={startCall}
                disabled={!selectedClient || !selectedCampaign}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Gesprek
              </Button>

              {currentCall && (
                <div className="space-y-2 mt-4">
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
          </div>
        </div>
        {/* Belscript + AI-prompt rechts */}
        <div className="col-span-1 lg:col-span-2 w-full h-full flex flex-col gap-6">
          {/* Belscript Card */}
          <div className="bg-slate-800 rounded-lg shadow-md p-6 flex-1 flex flex-col overflow-auto min-h-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-1">Verkoopscript (Markdown/HTML)</label>
            <textarea
              className="w-full min-h-[200px] resize-y bg-gray-900 border border-gray-700 rounded-md text-white p-2 mt-2"
              value={script}
              onChange={e => handleScriptChange(e.target.value)}
              disabled={loadingScript || saving}
            />
          </div>
          {/* AI-prompt Card */}
          <div className="bg-slate-800 rounded-lg shadow-md p-6 flex-1 flex flex-col overflow-auto min-h-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-1">AI-prompt</label>
            <textarea
              className="w-full min-h-[200px] resize-y bg-gray-900 border border-gray-700 rounded-md text-white p-2 mt-2"
              value={aiPrompt}
              onChange={e => handleAiPromptChange(e.target.value)}
              disabled={loadingScript || saving}
            />
            <button
              className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded text-white disabled:opacity-50 self-end"
              onClick={handleManualSave}
              disabled={loadingScript || saving}
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
