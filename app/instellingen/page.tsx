"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { supabase, type ExternalApi } from "@/lib/supabase"
import { Save, Database, Phone, Volume2, Network, Plus, Edit, Trash2, X, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Settings {
  twilio_sid: string
  twilio_token: string
  twilio_phone: string
  sip_username: string
  sip_password: string
  sip_host: string
  elevenlabs_api_key: string
}

export default function InstellingenPage() {
  const [settings, setSettings] = useState<Settings>({
    twilio_sid: "",
    twilio_token: "",
    twilio_phone: "",
    sip_username: "",
    sip_password: "",
    sip_host: "",
    elevenlabs_api_key: "",
  })
  const [externalApis, setExternalApis] = useState<ExternalApi[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddApi, setShowAddApi] = useState(false)
  const [editingApi, setEditingApi] = useState<string | null>(null)
  const [apiForm, setApiForm] = useState({
    name: "",
    api_key: "",
    provider: "other" as "twilio" | "elevenlabs" | "openai" | "other",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
    fetchExternalApis()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("settings").select("*")

      if (error) throw error

      const settingsMap: Record<string, string> = {}
      data?.forEach((setting: any) => {
        settingsMap[setting.key] = setting.value
      })

      setSettings({
        twilio_sid: settingsMap.twilio_sid || "",
        twilio_token: settingsMap.twilio_token || "",
        twilio_phone: settingsMap.twilio_phone || "",
        sip_username: settingsMap.sip_username || "",
        sip_password: settingsMap.sip_password || "",
        sip_host: settingsMap.sip_host || "",
        elevenlabs_api_key: settingsMap.elevenlabs_api_key || "",
      })
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Fout",
        description: "Kon instellingen niet laden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchExternalApis = async () => {
    try {
      const { data, error } = await supabase
        .from("external_apis")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setExternalApis(data || [])
    } catch (error) {
      console.error("Error fetching external APIs:", error)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        description: getSettingDescription(key),
      }))

      for (const setting of settingsArray) {
        await supabase.from("settings").upsert(
          {
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        )
      }

      toast({
        title: "Succes",
        description: "Instellingen zijn opgeslagen",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Fout",
        description: "Kon instellingen niet opslaan",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddApi = async () => {
    try {
      const { error } = await supabase
        .from("external_apis")
        .insert([{
          name: apiForm.name,
          api_key: apiForm.api_key,
          provider: apiForm.provider,
          is_active: true,
        }])

      if (error) throw error

      setApiForm({ name: "", api_key: "", provider: "other" })
      setShowAddApi(false)
      fetchExternalApis()
      
      toast({
        title: "Succes",
        description: "API sleutel toegevoegd",
      })
    } catch (error) {
      console.error("Error adding API:", error)
      toast({
        title: "Fout",
        description: "Kon API sleutel niet toevoegen",
        variant: "destructive",
      })
    }
  }

  const handleUpdateApi = async (id: string) => {
    try {
      const { error } = await supabase
        .from("external_apis")
        .update({
          name: apiForm.name,
          api_key: apiForm.api_key,
          provider: apiForm.provider,
        })
        .eq("id", id)

      if (error) throw error

      setEditingApi(null)
      setApiForm({ name: "", api_key: "", provider: "other" })
      fetchExternalApis()
      
      toast({
        title: "Succes",
        description: "API sleutel bijgewerkt",
      })
    } catch (error) {
      console.error("Error updating API:", error)
      toast({
        title: "Fout",
        description: "Kon API sleutel niet bijwerken",
        variant: "destructive",
      })
    }
  }

  const handleDeleteApi = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze API sleutel wilt verwijderen?")) return

    try {
      const { error } = await supabase
        .from("external_apis")
        .delete()
        .eq("id", id)

      if (error) throw error

      fetchExternalApis()
      toast({
        title: "Succes",
        description: "API sleutel verwijderd",
      })
    } catch (error) {
      console.error("Error deleting API:", error)
      toast({
        title: "Fout",
        description: "Kon API sleutel niet verwijderen",
        variant: "destructive",
      })
    }
  }

  const toggleApiStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("external_apis")
        .update({ is_active: !isActive })
        .eq("id", id)

      if (error) throw error

      fetchExternalApis()
    } catch (error) {
      console.error("Error toggling API status:", error)
    }
  }

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      twilio_sid: "Twilio Account SID voor telefonie",
      twilio_token: "Twilio Auth Token",
      twilio_phone: "Twilio telefoonnummer",
      sip_username: "SIP gebruikersnaam voor Telenet",
      sip_password: "SIP wachtwoord voor Telenet",
      sip_host: "SIP host server voor Telenet",
      elevenlabs_api_key: "ElevenLabs API sleutel voor text-to-speech",
    }
    return descriptions[key] || ""
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "twilio":
        return <Phone className="h-4 w-4" />
      case "elevenlabs":
        return <Volume2 className="h-4 w-4" />
      case "openai":
        return <Network className="h-4 w-4" />
      default:
        return <Key className="h-4 w-4" />
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "twilio":
        return "bg-red-600"
      case "elevenlabs":
        return "bg-purple-600"
      case "openai":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  const handleInputChange = (key: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="text-center py-8 text-gray-400">Laden...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Instellingen</h1>
          <p className="text-gray-400">Configureer uw call center platform</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Opslaan..." : "Opslaan"}
        </Button>
      </div>

      {/* API Keys Management */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-white">
              <Key className="h-5 w-5 mr-2 text-blue-400" />
              API Sleutels
            </CardTitle>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowAddApi(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe API Sleutel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add/Edit API Form */}
          {(showAddApi || editingApi) && (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-4">
                {editingApi ? "API Sleutel Bewerken" : "Nieuwe API Sleutel Toevoegen"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300 text-sm">Naam</Label>
                  <Input
                    value={apiForm.name}
                    onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })}
                    className="bg-gray-600 border-gray-500 text-white"
                    placeholder="API naam"
                  />
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Provider</Label>
                  <select
                    value={apiForm.provider}
                    onChange={(e) => setApiForm({ ...apiForm, provider: e.target.value as any })}
                    className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="elevenlabs">ElevenLabs</option>
                    <option value="openai">OpenAI</option>
                    <option value="other">Andere</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">API Sleutel</Label>
                  <Input
                    type="password"
                    value={apiForm.api_key}
                    onChange={(e) => setApiForm({ ...apiForm, api_key: e.target.value })}
                    className="bg-gray-600 border-gray-500 text-white"
                    placeholder="API sleutel"
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button 
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => editingApi ? handleUpdateApi(editingApi) : handleAddApi()}
                  disabled={!apiForm.name || !apiForm.api_key}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingApi ? "Bijwerken" : "Toevoegen"}
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-600"
                  onClick={() => {
                    setShowAddApi(false)
                    setEditingApi(null)
                    setApiForm({ name: "", api_key: "", provider: "other" })
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuleren
                </Button>
              </div>
            </div>
          )}

          {/* API Keys List */}
          <div className="space-y-3">
            {externalApis.map((api) => (
              <div
                key={api.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getProviderColor(api.provider)}`}>
                    {getProviderIcon(api.provider)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{api.name}</h4>
                    <p className="text-sm text-gray-400 capitalize">{api.provider}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={api.is_active ? "bg-green-600" : "bg-gray-600"}>
                    {api.is_active ? "Actief" : "Inactief"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-600"
                    onClick={() => toggleApiStatus(api.id, api.is_active)}
                  >
                    {api.is_active ? "Deactiveren" : "Activeren"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-600"
                    onClick={() => {
                      setEditingApi(api.id)
                      setApiForm({
                        name: api.name,
                        api_key: api.api_key,
                        provider: api.provider,
                      })
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Bewerken
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    onClick={() => handleDeleteApi(api.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Verwijderen
                  </Button>
                </div>
              </div>
            ))}
            {externalApis.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Geen API sleutels gevonden. Voeg uw eerste API sleutel toe.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supabase Configuration (Read-only) */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Database className="h-5 w-5 mr-2 text-blue-400" />
              Supabase Configuratie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Project URL</Label>
              <Input
                value="https://fuvtitcjzovzkknuuhcw.supabase.co"
                readOnly
                className="bg-gray-700 border-gray-600 text-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-300">Anon Key</Label>
              <Input
                value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                readOnly
                type="password"
                className="bg-gray-700 border-gray-600 text-gray-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-400">Verbonden</span>
            </div>
          </CardContent>
        </Card>

        {/* Legacy Settings */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Phone className="h-5 w-5 mr-2 text-blue-400" />
              Telefonie Instellingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sip_username" className="text-gray-300">
                SIP Gebruikersnaam
              </Label>
              <Input
                id="sip_username"
                type="text"
                value={settings.sip_username}
                onChange={(e) => handleInputChange("sip_username", e.target.value)}
                placeholder="SIP gebruikersnaam"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="sip_password" className="text-gray-300">
                SIP Wachtwoord
              </Label>
              <Input
                id="sip_password"
                type="password"
                value={settings.sip_password}
                onChange={(e) => handleInputChange("sip_password", e.target.value)}
                placeholder="SIP wachtwoord"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="sip_host" className="text-gray-300">
                SIP Host
              </Label>
              <Input
                id="sip_host"
                type="text"
                value={settings.sip_host}
                onChange={(e) => handleInputChange("sip_host", e.target.value)}
                placeholder="sip.example.com"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
